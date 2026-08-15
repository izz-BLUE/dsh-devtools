/**
 * Agent Runtime Trace fold — replays a session's durable event log into a
 * per-turn/per-step execution timeline.
 *
 * READ-ONLY and METADATA-FIRST: the fold consumes only the structural facts
 * of each event (types, timestamps, ids, names, statuses, provider-reported
 * usage). It never retains message content, tool arguments, or tool result
 * text, so the wire payload cannot leak prompts or secrets.
 *
 * Verified against real durable logs (v0.1.0-rc.6): step/start..step/end
 * brackets every step (including failed ones), tool/call..tool/result pair
 * by callId, `assistant/chunk` carries block-start (TTFT anchor), `usage`
 * and `finish` chunks, `llm/retry` attributes retries to turn/step, and
 * turn/end.reason carries the authoritative outcome (completed / aborted /
 * error / max-tokens / blocked / interrupted). hook/invoked and
 * hook/result are in the known vocabulary but no installed producer emits
 * them today — the fold tolerates their absence and parses them defensively
 * when present.
 *
 * The fold consumes a minimal structural event shape rather than the
 * harness `SessionEvent` union so that plugin-merged event types
 * (subagent/descriptor, hook/*, compaction/*) stay readable without the
 * host package declaring them.
 *
 * @module dsh-devtools/fold
 */

import type { FinishReason, TokenUsage } from '@deepseek-ai/dsh-llm'

/** The minimal structural event the fold consumes (the runtime SessionEvent
 * satisfies this shape). */
export interface FoldEventLike {
  readonly seq: number
  readonly type: string
  readonly time: number
  readonly data?: Record<string, unknown>
}

/** The per-step outcome. 'unknown' is a step that closed without an
 * assistant message and whose turn has not ended yet (its final status
 * arrives with turn/end). */
export type StepStatus =
  | 'running'
  | 'ok'
  | 'error'
  | 'aborted'
  | 'max-tokens'
  | 'blocked'
  | 'interrupted'
  | 'unknown'

/** One model-requested tool invocation inside a step, paired by callId. */
export interface ToolCallRecord {
  readonly callId: string
  readonly name: string
  readonly callAt: number
  readonly resultAt?: number
  /** resultAt - callAt when the result landed; absent while in flight. */
  readonly durationMs?: number
  /** The tool/result envelope's structured failure identity, when present. */
  readonly error?: { readonly name?: string; readonly code?: string }
  /** The tool-result block's isError flag, when the tool reported one. */
  readonly isError?: boolean
}

/** One llm/retry decision attributed to its step. */
export interface RetryRecord {
  readonly retry: number
  readonly maxRetries: number
  /** Provider-requested or policy delay before the retry stream starts. */
  readonly delayMs?: number
  readonly code?: string
  readonly message?: string
  readonly at: number
}

/** One model call (a step) with its execution facts. */
export interface StepRecord {
  /** seq of the step/start event. */
  readonly seq: number
  readonly turn: number
  readonly step: number
  readonly startAt: number
  readonly endAt?: number
  /** Time of the first stream block-start chunk (TTFT anchor). */
  readonly firstChunkAt?: number
  /** Time the assembled assistant message landed (model-time end). */
  readonly assistantAt?: number
  /** Stream finish reason from the terminal finish chunk, when reported. */
  readonly finish?: FinishReason
  /** Provider-reported usage for the step, when the adapter reported it. */
  readonly usage?: TokenUsage
  readonly retries: readonly RetryRecord[]
  readonly tools: readonly ToolCallRecord[]
  readonly status: StepStatus
  /** Structured failure attributed via turn/end (or stream finish). */
  readonly error?: { readonly message: string; readonly code: string }
  /** Model in force when this step started (model switches are visible here). */
  readonly model?: string
  readonly provider?: string
}

/** One turn with its outcome and closed-step count. */
export interface TurnRecord {
  /** seq of the turn/start event. */
  readonly seq: number
  readonly turn: number
  readonly startAt: number
  readonly endAt?: number
  /** Closed steps so far (step/end count). */
  readonly stepCount?: number
  /** The authoritative turn outcome, when the turn ended. */
  readonly reason?: { readonly kind: string; readonly detail?: string }
}

/** One hook execution (hook/invoked .. hook/result), when producers emit them. */
export interface HookRecord {
  readonly seq: number
  readonly at: number
  readonly plugin?: string
  readonly name?: string
  readonly durationMs?: number
  readonly error?: boolean
}

/** Session-level metadata captured from the log. */
export interface TraceMeta {
  readonly model?: string
  readonly provider?: string
  readonly contextWindow?: number
  /** Captured from subagent/descriptor when this session is a subagent. */
  readonly subagent?: {
    readonly label?: string
    readonly mode?: string
    readonly agentModel?: string
  }
}

/** Retention caps for the fold (bounded memory, ring semantics). */
export interface TraceCaps {
  /** Kept steps; the oldest are dropped past this bound. */
  readonly maxSteps: number
  /** Kept hook records. */
  readonly maxHooks: number
}

/** Default retention: 1000 steps / 200 hooks. */
export const DEFAULT_TRACE_CAPS: TraceCaps = { maxSteps: 1000, maxHooks: 200 }

/** Per-session fold state; advances only over newly appended events. */
export interface FoldState {
  /** Number of log events already folded (the fold resumes from here). */
  n: number
  readonly caps: TraceCaps
  readonly turns: TurnRecord[]
  readonly steps: StepRecord[]
  readonly hooks: HookRecord[]
  /** Session-level metadata captured from the log. */
  meta: TraceMeta
  openTurn?: TurnRecord
  openStep?: StepRecord
  /** Stack of unclosed hook/invoked records for defensive pairing. */
  readonly hookStack: { readonly record: HookRecord }[]
  /** Number of steps dropped by the retention cap (for the wire). */
  droppedSteps: number
}

/** Fresh fold state for one session. */
export function createFold(caps: TraceCaps = DEFAULT_TRACE_CAPS): FoldState {
  return {
    n: 0,
    caps,
    turns: [],
    steps: [],
    hooks: [],
    hookStack: [],
    meta: {},
    droppedSteps: 0,
  }
}

/** Pluck a string field from an unknown payload, or undefined. */
function str(data: unknown, key: string): string | undefined {
  if (data === null || typeof data !== 'object') return undefined
  const v = (data as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : undefined
}

/** Pluck a number field from an unknown payload, or undefined. */
function num(data: unknown, key: string): number | undefined {
  if (data === null || typeof data !== 'object') return undefined
  const v = (data as Record<string, unknown>)[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Attribute a turn outcome to its in-flight/unknown steps. */
function applyTurnOutcome(st: FoldState, turnNo: number, kind: string, error?: { message: string; code: string }): void {
  // The open step (turn ended mid-step) plus every 'unknown' step of the turn
  // that closed without an assistant message (failed steps land one).
  const targets = st.steps.filter(s => s.turn === turnNo && (s.status === 'running' || s.status === 'unknown'))
  for (const step of targets) {
    const record = { ...step, status: kind as StepStatus, ...(error === undefined ? {} : { error }) }
    const idx = st.steps.indexOf(step)
    st.steps[idx] = record
    if (st.openStep === step) st.openStep = record
  }
}

/**
 * Advance the fold over every event not yet folded. Mutates `st` in place.
 * Pure structural consumption: never reads or stores message content.
 */
export function foldInto(st: FoldState, events: readonly FoldEventLike[]): void {
  for (let e = st.n; e < events.length; e++) {
    const ev = events[e]
    if (ev === null || typeof ev !== 'object') continue
    const data = ev.data ?? {}
    const time = typeof ev.time === 'number' ? ev.time : 0
    switch (ev.type) {
      case 'turn/start': {
        const turn = num(data, 'turn')
        if (turn === undefined) break
        // Defensive: a stale open step from a malformed predecessor must not
        // leak into the new turn.
        st.openStep = undefined
        const record: TurnRecord = { seq: ev.seq, turn, startAt: time }
        st.openTurn = record
        st.turns.push(record)
        break
      }
      case 'step/start': {
        const turn = num(data, 'turn')
        const step = num(data, 'step')
        if (turn === undefined || step === undefined) break
        const record: StepRecord = {
          seq: ev.seq,
          turn,
          step,
          startAt: time,
          retries: [],
          tools: [],
          status: 'running',
          ...(st.meta.model === undefined ? {} : { model: st.meta.model }),
          ...(st.meta.provider === undefined ? {} : { provider: st.meta.provider }),
        }
        st.openStep = record
        st.steps.push(record)
        break
      }
      case 'assistant/chunk': {
        const step = st.openStep
        if (step === undefined) break
        const chunk = (data.chunk ?? null) as { type?: string } | null
        if (chunk === null || typeof chunk !== 'object') break
        if (chunk.type === 'block-start' && step.firstChunkAt === undefined) {
          const next = { ...step, firstChunkAt: time }
          st.steps[st.steps.indexOf(step)] = next
          st.openStep = next
        } else if (chunk.type === 'usage') {
          const usage = (chunk as { usage?: TokenUsage }).usage
          if (usage !== undefined && typeof usage === 'object') {
            const next = { ...step, usage }
            st.steps[st.steps.indexOf(step)] = next
            st.openStep = next
          }
        } else if (chunk.type === 'finish') {
          const reason = (chunk as { reason?: FinishReason }).reason
          if (reason !== undefined && typeof reason === 'object') {
            const status: StepStatus = reason.kind === 'max-tokens' ? 'max-tokens' : step.status
            const next = { ...step, finish: reason, status }
            st.steps[st.steps.indexOf(step)] = next
            st.openStep = next
          }
        }
        break
      }
      case 'assistant/message': {
        const step = st.openStep
        if (step === undefined) break
        const usage = (data.usage ?? undefined) as TokenUsage | undefined
        const next: StepRecord = {
          ...step,
          assistantAt: time,
          status: step.status === 'max-tokens' ? 'max-tokens' : step.status === 'running' ? 'ok' : step.status,
          ...(usage !== undefined && typeof usage === 'object' ? { usage } : {}),
        }
        st.steps[st.steps.indexOf(step)] = next
        st.openStep = next
        break
      }
      case 'tool/call': {
        const step = st.openStep
        if (step === undefined) break
        const callId = str(data, 'callId')
        const name = str(data, 'name')
        if (callId === undefined) break
        const tool: ToolCallRecord = { callId, name: name ?? '?', callAt: time }
        const next = { ...step, tools: [...step.tools, tool] }
        st.steps[st.steps.indexOf(step)] = next
        st.openStep = next
        break
      }
      case 'tool/result': {
        const step = st.openStep
        if (step === undefined) break
        const message = (data.message ?? null) as {
          source?: { callId?: unknown }
          content?: readonly unknown[]
        } | null
        const callId = str(message?.source, 'callId')
        if (callId === undefined) break
        const tools = step.tools.map(t => {
          if (t.callId !== callId) return t
          const error = data.error as { name?: unknown; code?: unknown } | undefined
          const block = Array.isArray(message?.content) ? message.content[0] : undefined
          const isError = block !== undefined && typeof block === 'object'
            && (block as { isError?: unknown }).isError === true
          return {
            ...t,
            resultAt: time,
            durationMs: Math.max(0, time - t.callAt),
            ...(error !== undefined && typeof error === 'object' ? {
              error: {
                ...(typeof error.name === 'string' ? { name: error.name } : {}),
                ...(typeof error.code === 'string' ? { code: error.code } : {}),
              },
            } : {}),
            ...(isError ? { isError: true } : {}),
          }
        })
        const next = { ...step, tools }
        st.steps[st.steps.indexOf(step)] = next
        st.openStep = next
        break
      }
      case 'llm/retry': {
        const step = st.openStep
        if (step === undefined) break
        const failure = (data.failure ?? null) as { message?: unknown; code?: unknown } | null
        const retry: RetryRecord = {
          retry: num(data, 'retry') ?? 0,
          maxRetries: num(data, 'maxRetries') ?? 0,
          at: time,
          ...(num(data, 'delayMs') === undefined ? {} : { delayMs: num(data, 'delayMs') }),
          ...(typeof failure?.code === 'string' ? { code: failure.code } : {}),
          ...(typeof failure?.message === 'string' ? { message: failure.message } : {}),
        }
        const next = { ...step, retries: [...step.retries, retry] }
        st.steps[st.steps.indexOf(step)] = next
        st.openStep = next
        break
      }
      case 'step/end': {
        const step = st.openStep
        if (step === undefined) break
        const turn = num(data, 'turn')
        const stepNo = num(data, 'step')
        if (turn !== step.turn || stepNo !== step.step) break
        const status: StepStatus = step.status === 'running'
          ? step.assistantAt !== undefined ? 'ok' : 'unknown'
          : step.status
        const next = { ...step, endAt: time, status }
        st.steps[st.steps.indexOf(step)] = next
        st.openStep = undefined
        if (st.openTurn !== undefined) {
          const nextTurn = { ...st.openTurn, stepCount: (st.openTurn.stepCount ?? 0) + 1 }
          const ti = st.turns.indexOf(st.openTurn)
          if (ti >= 0) st.turns[ti] = nextTurn
          st.openTurn = nextTurn
        }
        break
      }
      case 'turn/end': {
        const turn = st.openTurn
        if (turn === undefined) break
        const reason = (data.reason ?? null) as { kind?: unknown; detail?: unknown } | null
        const kind = typeof reason?.kind === 'string' ? reason.kind : 'unknown'
        const error = (reason?.kind === 'error' ? (reason as { error?: unknown }).error : undefined) as
          | { message?: unknown; code?: unknown }
          | undefined
        const closed: TurnRecord = {
          ...turn,
          endAt: time,
          reason: {
            kind,
            ...(error !== undefined && typeof error === 'object'
              && typeof error.message === 'string' ? { detail: error.message } : {}),
          },
        }
        const idx = st.turns.indexOf(turn)
        st.turns[idx] = closed
        st.openTurn = undefined
        // Attribute the outcome to in-flight/unknown steps of this turn.
        const failure = error !== undefined && typeof error === 'object'
          ? {
            message: typeof error.message === 'string' ? error.message : String(error),
            code: typeof error.code === 'string' ? error.code : 'UNKNOWN',
          }
          : undefined
        applyTurnOutcome(st, turn.turn, kind, failure)
        break
      }
      case 'request/header': {
        const header = (data.header ?? null) as { config?: unknown } | null
        const config = header?.config as { provider?: unknown; model?: unknown } | null | undefined
        if (config !== null && config !== undefined && typeof config === 'object') {
          const provider = typeof config.provider === 'string' ? config.provider : undefined
          const model = typeof config.model === 'string' ? config.model : undefined
          if (provider !== undefined || model !== undefined) {
            st.meta = {
              ...st.meta,
              ...(provider === undefined ? {} : { provider }),
              ...(model === undefined ? {} : { model }),
            }
            // Backfill the in-flight step: request/header lands ~1ms after
            // step/start (and carries no turn/step id), so the step's own
            // snapshot may still hold the PREVIOUS model. The header config is
            // the current request's config, so overwriting the open step's
            // model/provider is the accurate value (verified against real
            // logs: the first step of every turn otherwise shows a missing or
            // stale model).
            const step = st.openStep
            if (step !== undefined) {
              let changed = false
              const next = { ...step }
              if (provider !== undefined && step.provider !== provider) {
                next.provider = provider
                changed = true
              }
              if (model !== undefined && step.model !== model) {
                next.model = model
                changed = true
              }
              if (changed) {
                st.steps[st.steps.indexOf(step)] = next
                st.openStep = next
              }
            }
          }
        }
        break
      }
      case 'request/context': {
        const provider = str(data, 'provider')
        const model = str(data, 'model')
        const contextWindow = num(data, 'contextWindow')
        if (provider !== undefined || model !== undefined || contextWindow !== undefined) {
          st.meta = {
            ...st.meta,
            ...(provider === undefined ? {} : { provider }),
            ...(model === undefined ? {} : { model }),
            ...(contextWindow === undefined ? {} : { contextWindow }),
          }
        }
        break
      }
      case 'subagent/descriptor': {
        st.meta = {
          ...st.meta,
          subagent: {
            ...(str(data, 'label') === undefined ? {} : { label: str(data, 'label') }),
            ...(str(data, 'mode') === undefined ? {} : { mode: str(data, 'mode') }),
            ...(str(data, 'agentModel') === undefined ? {} : { agentModel: str(data, 'agentModel') }),
          },
        }
        break
      }
      case 'hook/invoked': {
        // Defensive parse: no installed producer emits this today. The event
        // shape is unknown; record whatever name-like fields exist.
        const record: HookRecord = {
          seq: ev.seq,
          at: time,
          ...(str(data, 'plugin') === undefined ? {} : { plugin: str(data, 'plugin') }),
          ...(str(data, 'name') === undefined ? {} : { name: str(data, 'name') }),
        }
        st.hooks.push(record)
        st.hookStack.push({ record })
        break
      }
      case 'hook/result': {
        const open = st.hookStack.pop()
        if (open === undefined) break
        const error = data.error === true
        const durationMs = num(data, 'durationMs')
        const record: HookRecord = {
          ...open.record,
          ...(durationMs === undefined ? {} : { durationMs }),
          ...(error ? { error: true } : {}),
        }
        const idx = st.hooks.indexOf(open.record)
        st.hooks[idx] = record
        break
      }
      default:
        break
    }
  }
  st.n = events.length

  // Retention: ring-trim the step list; turn records stay (bounded by turns).
  if (st.steps.length > st.caps.maxSteps) {
    const dropped = st.steps.length - st.caps.maxSteps
    st.steps.splice(0, dropped)
    st.droppedSteps += dropped
    // An open step can never be trimmed (it is the newest), so no repair needed.
  }
  if (st.hooks.length > st.caps.maxHooks) {
    const dropped = st.hooks.length - st.caps.maxHooks
    st.hooks.splice(0, dropped)
  }
}
