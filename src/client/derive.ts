/**
 * Pure derivation helpers for the DevTools profiler UI.
 *
 * Everything here is computed from the wire snapshot only (see trace.ts) —
 * no extra instrumentation, no new events. Kept as pure functions so the
 * summary math, step-status semantics, timeline geometry, and turn folding
 * rules are unit-testable without a DOM.
 *
 * @module dsh-devtools/client/derive
 */

import type { StepWire, TraceStats, TurnWire } from '../trace.ts'

/* ------------------------------------------------------------------ */
/* Summary groups                                                      */
/* ------------------------------------------------------------------ */

export interface ExecutionSummary {
  readonly turns: number
  /** Steps in the retained window (equals stats.steps). */
  readonly steps: number
  readonly stepsCompleted: number
  readonly stepsRunning: number
  /** Steps closed without an assistant message and not yet attributed. */
  readonly stepsPending: number
  readonly toolCalls: number
  readonly toolErrors: number
  readonly retries: number
  /** Step-level failures (step status 'error'). */
  readonly stepErrors: number
  /** Turn-level failures (turn/end reason kind 'error'). */
  readonly turnErrors: number
  /** Turn-level aborted + interrupted (turn/end reason kind). */
  readonly turnInterrupted: number
  readonly maxTokens: number
}

export interface PerformanceSummary {
  /** Summed model wall time (assistantAt - startAt) over steps. */
  readonly modelMs: number
  /** Summed tool wall time (tool/result - tool/call) over paired results. */
  readonly toolMs: number
  /** Mean time from step/start to the first persisted block-start. */
  readonly avgFirstMs?: number
  /** Session wall: last endAt - first startAt. */
  readonly wallMs?: number
  /** Summed decode time (assistantAt - firstChunkAt) over steps. */
  readonly decodeMs?: number
  /** Output tokens per session-wall second. */
  readonly throughputPerSec?: number
}

export interface TokenSummary {
  readonly input: number
  readonly output: number
  readonly cacheRead: number
  readonly reasoning: number
  /** cacheRead / (input + cacheRead); undefined when the denominator is 0. */
  readonly cacheReusePct?: number
}

export interface SummaryGroups {
  readonly execution: ExecutionSummary
  readonly performance: PerformanceSummary
  readonly tokens: TokenSummary
}

/** Count steps by outcome semantics (completed = anything closed). */
export function countStepStatuses(steps: readonly StepWire[]): {
  readonly total: number
  readonly completed: number
  readonly running: number
  readonly pending: number
} {
  let completed = 0
  let running = 0
  let pending = 0
  for (const s of steps) {
    if (s.status === 'running') running++
    else if (s.status === 'unknown') pending++
    else completed++
  }
  return { total: steps.length, completed, running, pending }
}

/**
 * Cache reuse ratio — an internal, derived figure.
 * cacheRead / (input + cacheRead). Undefined when the denominator is 0.
 * This is NOT the provider's official cache hit rate.
 */
export function cacheReuse(input: number, cacheRead: number): number | undefined {
  const denom = input + cacheRead
  if (!Number.isFinite(denom) || denom <= 0) return undefined
  const r = cacheRead / denom
  return Number.isFinite(r) ? r : undefined
}

/** Mean step TTFT over steps that persisted a block-start. */
export function meanFirstActivity(steps: readonly StepWire[]): number | undefined {
  let sum = 0
  let n = 0
  for (const s of steps) {
    if (s.ttftMs !== undefined) {
      sum += s.ttftMs
      n++
    }
  }
  return n === 0 ? undefined : sum / n
}

/** Summed decode time over steps that have it. */
export function sumDecode(steps: readonly StepWire[]): number | undefined {
  let sum = 0
  let n = 0
  for (const s of steps) {
    if (s.decodeMs !== undefined) {
      sum += s.decodeMs
      n++
    }
  }
  return n === 0 ? undefined : sum
}

/** Session wall time from the stats window, when both edges exist. */
export function sessionWall(stats: TraceStats): number | undefined {
  if (stats.startedAt === undefined || stats.endedAt === undefined) return undefined
  return Math.max(0, stats.endedAt - stats.startedAt)
}

/** Compute the three summary groups from the wire snapshot. */
export function computeSummary(stats: TraceStats, turns: readonly TurnWire[]): SummaryGroups {
  const steps = turns.flatMap(t => t.steps)
  const stepCounts = countStepStatuses(steps)

  let turnErrors = 0
  let turnInterrupted = 0
  for (const t of turns) {
    const kind = t.reason?.kind
    if (kind === 'error') turnErrors++
    else if (kind === 'aborted' || kind === 'interrupted') turnInterrupted++
  }

  const wall = sessionWall(stats)
  const tokens = stats.outputTokens
  const throughput = wall !== undefined && wall > 0 ? tokens / (wall / 1000) : undefined
  const avgFirst = meanFirstActivity(steps)
  const decode = sumDecode(steps)
  const reuse = cacheReuse(stats.inputTokens, stats.cacheReadTokens)

  return {
    execution: {
      turns: stats.turns,
      steps: stepCounts.total,
      stepsCompleted: stepCounts.completed,
      stepsRunning: stepCounts.running,
      stepsPending: stepCounts.pending,
      toolCalls: stats.toolCalls,
      toolErrors: stats.toolErrors,
      retries: stats.retries,
      stepErrors: stats.errors,
      turnErrors,
      turnInterrupted,
      maxTokens: stats.maxTokens,
    },
    performance: {
      modelMs: stats.modelMs,
      toolMs: stats.toolMs,
      ...(avgFirst === undefined ? {} : { avgFirstMs: avgFirst }),
      ...(wall === undefined ? {} : { wallMs: wall }),
      ...(decode === undefined ? {} : { decodeMs: decode }),
      ...(throughput !== undefined && Number.isFinite(throughput)
        ? { throughputPerSec: throughput }
        : {}),
    },
    tokens: {
      input: stats.inputTokens,
      output: stats.outputTokens,
      cacheRead: stats.cacheReadTokens,
      reasoning: stats.reasoningTokens,
      ...(reuse === undefined ? {} : { cacheReusePct: reuse * 100 }),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Step runtime timeline                                               */
/* ------------------------------------------------------------------ */

export type SpanKind = 'model' | 'tool'

/** One time slice drawn on the step timeline bar. */
export interface ActivitySpan {
  readonly id: string
  readonly kind: SpanKind
  /** Absolute ms time of the slice start. */
  readonly start: number
  /** Absolute ms time of the slice end (extended to tMax while in flight). */
  readonly end: number
  readonly durationMs: number
  readonly toolName?: string
  readonly error?: boolean
  /** True while the underlying activity has not finished yet. */
  readonly running?: boolean
}

/** Minimum visible bar width as a fraction of the full track (e.g. 0.004). */
export const MIN_BAR_FRACTION = 0.004

/**
 * Slice a step into absolute-time activity spans:
 * one model span [startAt, assistantAt] plus one span per tool call
 * [callAt, resultAt]. In-flight spans extend to `tMax` (the current visible
 * window edge) so a running model/tool is still visible.
 */
export function stepSpans(step: StepWire, tMax: number): ActivitySpan[] {
  const spans: ActivitySpan[] = []
  const running = step.status === 'running'
  if (step.assistantAt !== undefined) {
    spans.push({
      id: `m${step.seq}`,
      kind: 'model',
      start: step.startAt,
      end: step.assistantAt,
      durationMs: Math.max(0, step.assistantAt - step.startAt),
    })
  } else if (running && step.firstChunkAt !== undefined) {
    spans.push({
      id: `m${step.seq}`,
      kind: 'model',
      start: step.startAt,
      end: Math.max(tMax, step.startAt),
      durationMs: Math.max(0, tMax - step.startAt),
      running: true,
    })
  }
  for (const tool of step.tools) {
    const end = tool.resultAt ?? Math.max(tMax, tool.callAt)
    spans.push({
      id: `t${tool.callId}`,
      kind: 'tool',
      start: tool.callAt,
      end,
      durationMs: tool.durationMs ?? Math.max(0, end - tool.callAt),
      toolName: tool.name,
      error: tool.error !== undefined || tool.isError === true,
      running: tool.resultAt === undefined,
    })
  }
  return spans
}

/**
 * Greedy interval partitioning into lanes so parallel tool calls render side
 * by side instead of being stacked serially. Returns the lane index per span.
 */
export function assignLanes(spans: readonly ActivitySpan[]): ReadonlyArray<{ span: ActivitySpan; lane: number }> {
  const sorted = [...spans].sort((a, b) => a.start - b.start)
  const laneEnds: number[] = []
  const out: Array<{ span: ActivitySpan; lane: number }> = []
  for (const span of sorted) {
    let lane = laneEnds.findIndex(end => end <= span.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(span.end)
    } else {
      laneEnds[lane] = span.end
    }
    out.push({ span, lane })
  }
  return out
}

/**
 * Map an absolute [start, end] onto the [tMin, tMax] track as percentages.
 * Degenerate tracks (tMax === tMin) yield a full-width bar; bars shorter
 * than MIN_BAR_FRACTION are clamped to stay visible.
 */
export function barGeometry(start: number, end: number, tMin: number, tMax: number): {
  readonly leftPct: number
  readonly widthPct: number
} {
  const span = Math.max(0, tMax - tMin)
  if (span === 0) return { leftPct: 0, widthPct: 100 }
  const left = Math.max(0, Math.min(100, ((start - tMin) / span) * 100))
  const rawWidth = Math.max(0, Math.min(100 - left, ((end - start) / span) * 100))
  return { leftPct: left, widthPct: Math.max(rawWidth, Math.min(MIN_BAR_FRACTION * 100, 100 - left)) }
}

/**
 * Horizontal position (0-100) of an absolute time on the [tMin, tMax]
 * track, used by the turn ruler and every step grid line so they stay
 * pixel-aligned. Degenerate tracks (tMax <= tMin) fall back to a 1ms
 * track instead of dividing by zero.
 */
export function trackPct(at: number, tMin: number, tMax: number): number {
  const spanMax = tMax > tMin ? tMax : tMin + 1
  const span = Math.max(0, spanMax - tMin)
  return span > 0 ? ((at - tMin) / span) * 100 : 0
}

/* ------------------------------------------------------------------ */
/* Timeline time scale (ruler ticks + grid)                            */
/* ------------------------------------------------------------------ */

/** Candidate tick intervals in ms, from sub-second to long sessions. */
const TICK_STEP_MS = [
  250, 500, 1_000, 2_000, 5_000, 10_000, 15_000, 30_000,
  60_000, 120_000, 300_000, 600_000, 1_800_000, 3_600_000,
] as const

/** Target tick count cap before the ruler steps up to the next interval. */
export const MAX_TIMELINE_TICKS = 8

/**
 * Pick the smallest "nice" tick interval (ms) whose tick count on a
 * `durationMs`-long span stays within `maxTicks`. Degenerate or missing
 * durations yield 0, so callers can skip the ruler/grid entirely.
 */
export function niceTickIntervalMs(durationMs: number, maxTicks = MAX_TIMELINE_TICKS): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0 || maxTicks < 1) return 0
  for (const step of TICK_STEP_MS) {
    if (Math.ceil(durationMs / step) <= maxTicks) return step
  }
  let step = TICK_STEP_MS[TICK_STEP_MS.length - 1]
  while (Math.ceil(durationMs / step) > maxTicks) step *= 2
  return step
}

/** One ruler tick: absolute time and its offset label. */
export interface TimelineTick {
  readonly at: number
  readonly label: string
}

/** Format a ruler label for an offset (ms) given the tick interval.
 * The origin always reads "0s" regardless of the interval unit, matching
 * the relative-ruler convention; later offsets use the interval's unit. */
export function tickLabel(offsetMs: number, intervalMs: number): string {
  if (offsetMs === 0) return '0s'
  if (intervalMs < 1_000) return `${offsetMs}ms`
  if (intervalMs < 60_000) {
    const sec = offsetMs / 1_000
    return `${sec.toFixed(Number.isInteger(sec) ? 0 : 1)}s`
  }
  const m = Math.floor(offsetMs / 60_000)
  const s = Math.round((offsetMs % 60_000) / 1_000)
  return s === 0 ? `${m}m` : `${m}m${s}s`
}

/**
 * Absolute tick positions across [tMin, tMax] at a nice interval derived
 * from the span, anchored at tMin so the ruler always starts at the 0
 * offset, with labels relative to tMin. Empty when the span is degenerate
 * or missing. Times are integer ms, so the loop stays exact.
 */
export function timelineTicks(tMin: number, tMax: number, maxTicks = MAX_TIMELINE_TICKS): readonly TimelineTick[] {
  const duration = tMax - tMin
  const interval = niceTickIntervalMs(duration, maxTicks)
  if (interval <= 0 || !Number.isFinite(tMin)) return []
  const out: TimelineTick[] = []
  for (let i = 0; i <= maxTicks; i++) {
    const at = tMin + i * interval
    if (at > tMax + 0.5) break
    out.push({ at, label: tickLabel(at - tMin, interval) })
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Turn folding                                                        */
/* ------------------------------------------------------------------ */

/** The collapsed summary of one turn. */
export interface TurnSummary {
  readonly steps: number
  readonly toolCalls: number
  /** Wall time; undefined while the turn is still open. */
  readonly wallMs?: number
  readonly running: boolean
  readonly reason?: string
}

export function summarizeTurn(turn: TurnWire): TurnSummary {
  let toolCalls = 0
  for (const s of turn.steps) toolCalls += s.tools.length
  return {
    steps: turn.steps.length,
    toolCalls,
    ...(turn.endAt === undefined
      ? {}
      : { wallMs: Math.max(0, turn.endAt - turn.startAt) }),
    running: turn.reason === undefined,
    ...(turn.reason === undefined ? {} : { reason: turn.reason.kind }),
  }
}

/** Default fold policy: the running turn and the newest turn stay open. */
export function defaultOpen(turn: TurnWire, idx: number, len: number): boolean {
  return turn.reason === undefined || idx === len - 1
}
