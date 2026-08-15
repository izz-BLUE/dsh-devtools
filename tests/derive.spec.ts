/**
 * Derive unit tests — V0.1.1 Profiler UX pure helpers.
 *
 * Covers: summary group math (execution/performance/tokens), step status
 * semantics (completed/running/pending), error-vs-aborted-vs-tool-error
 * separation, cache reuse boundaries (incl. zero denominator), timeline
 * span/lane/bar geometry (incl. very short bars), and turn fold defaults.
 */

import { describe, expect, it } from 'vitest'
import {
  assignLanes,
  barGeometry,
  cacheReuse,
  computeSummary,
  countStepStatuses,
  defaultOpen,
  MAX_TIMELINE_TICKS,
  meanFirstActivity,
  MIN_BAR_FRACTION,
  niceTickIntervalMs,
  sessionWall,
  stepSpans,
  sumDecode,
  summarizeTurn,
  tickLabel,
  timelineTicks,
  trackPct,
} from '../src/client/derive.ts'
import type { StepWire, TraceStats, TurnWire } from '../src/trace.ts'

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function mkStep(over: Partial<StepWire> & { seq: number }): StepWire {
  return {
    turn: 1,
    step: over.seq,
    startAt: 0,
    status: 'ok',
    retries: [],
    tools: [],
    ...over,
  }
}

function mkTurn(over: Partial<TurnWire> & { seq: number }): TurnWire {
  return { turn: over.seq, startAt: 0, steps: [], ...over }
}

const stats: TraceStats = {
  turns: 2,
  steps: 5,
  errors: 1,
  aborted: 1,
  maxTokens: 0,
  retries: 2,
  toolCalls: 4,
  toolErrors: 1,
  startedAt: 1000,
  endedAt: 5000,
  modelMs: 2000,
  toolMs: 1500,
  inputTokens: 100,
  outputTokens: 50,
  cacheReadTokens: 300,
  reasoningTokens: 10,
}

/* ------------------------------------------------------------------ */
/* Summary groups                                                      */
/* ------------------------------------------------------------------ */

describe('computeSummary', () => {
  it('separates step errors, turn errors, and tool errors', () => {
    const turns: TurnWire[] = [
      mkTurn({
        seq: 1,
        turn: 1,
        startAt: 1000,
        endAt: 3000,
        reason: { kind: 'completed' },
        steps: [
          mkStep({ seq: 1, status: 'ok' }),
          mkStep({ seq: 2, status: 'error' }),
          mkStep({ seq: 3, status: 'ok' }),
        ],
      }),
      mkTurn({
        seq: 2,
        turn: 2,
        startAt: 3000,
        endAt: 5000,
        reason: { kind: 'aborted' },
        steps: [
          mkStep({ seq: 4, status: 'aborted' }),
          mkStep({ seq: 5, status: 'ok' }),
        ],
      }),
    ]
    const s = computeSummary(stats, turns)
    expect(s.execution.stepErrors).toBe(1)
    expect(s.execution.turnErrors).toBe(0) // reason 'error' only
    expect(s.execution.toolErrors).toBe(1)
    expect(s.execution.turnInterrupted).toBe(1) // aborted turn
    expect(s.execution.steps).toBe(5)
    // completed = anything closed (ok/error/aborted/max-tokens), not running/unknown
    expect(s.execution.stepsCompleted).toBe(5)
    expect(s.execution.stepsRunning).toBe(0)
    expect(s.execution.stepsPending).toBe(0)
  })

  it('counts turn errors from turn/end reason kind error', () => {
    const turns: TurnWire[] = [
      mkTurn({
        seq: 1,
        turn: 1,
        startAt: 1000,
        endAt: 2000,
        reason: { kind: 'error', detail: 'boom' },
        steps: [],
      }),
    ]
    const s = computeSummary(stats, turns)
    expect(s.execution.turnErrors).toBe(1)
    expect(s.execution.turnInterrupted).toBe(0)
  })

  it('computes performance figures (model/tool wall, avg first, wall, decode, throughput)', () => {
    const turns: TurnWire[] = [
      mkTurn({
        seq: 1,
        turn: 1,
        startAt: 1000,
        endAt: 5000,
        reason: { kind: 'completed' },
        steps: [
          mkStep({ seq: 1, startAt: 1000, endAt: 3000, assistantAt: 2500, firstChunkAt: 1500, ttftMs: 500, modelMs: 1500, decodeMs: 1000 }),
          mkStep({ seq: 2, startAt: 3000, endAt: 5000, assistantAt: 4500, firstChunkAt: 3500, ttftMs: 500, modelMs: 1500, decodeMs: 1000 }),
        ],
      }),
    ]
    const s = computeSummary(stats, turns)
    expect(s.performance.modelMs).toBe(2000) // stats.modelMs
    expect(s.performance.toolMs).toBe(1500)  // stats.toolMs
    expect(s.performance.avgFirstMs).toBe(500)
    expect(s.performance.wallMs).toBe(4000)  // 5000 - 1000
    expect(s.performance.decodeMs).toBe(2000)
    expect(s.performance.throughputPerSec).toBe(12.5) // 50 tokens / 4s
  })

  it('omits unavailable performance figures', () => {
    const turns: TurnWire[] = [mkTurn({ seq: 1, turn: 1, startAt: 1000, steps: [mkStep({ seq: 1, startAt: 1000 })] })]
    const bare: TraceStats = { ...stats, startedAt: undefined, endedAt: undefined }
    const s = computeSummary(bare, turns)
    expect(s.performance.avgFirstMs).toBeUndefined()
    expect(s.performance.wallMs).toBeUndefined()
    expect(s.performance.decodeMs).toBeUndefined()
    expect(s.performance.throughputPerSec).toBeUndefined()
  })

  it('computes token group with cache reuse percentage', () => {
    const s = computeSummary(stats, [])
    expect(s.tokens.input).toBe(100)
    expect(s.tokens.output).toBe(50)
    expect(s.tokens.cacheRead).toBe(300)
    expect(s.tokens.reasoning).toBe(10)
    expect(s.tokens.cacheReusePct).toBe(75) // 300 / (100 + 300)
  })

  it('omits cache reuse when the denominator is zero', () => {
    const zero: TraceStats = { ...stats, inputTokens: 0, cacheReadTokens: 0 }
    const s = computeSummary(zero, [])
    expect(s.tokens.cacheReusePct).toBeUndefined()
  })
})

describe('cacheReuse', () => {
  it('returns the ratio cacheRead / (input + cacheRead)', () => {
    expect(cacheReuse(100, 300)).toBeCloseTo(0.75)
    expect(cacheReuse(0, 5)).toBe(1)
    expect(cacheReuse(5, 0)).toBe(0)
  })

  it('returns undefined on zero denominator and non-finite input', () => {
    expect(cacheReuse(0, 0)).toBeUndefined()
    expect(cacheReuse(Number.NaN, 1)).toBeUndefined()
    expect(cacheReuse(Infinity, 1)).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */
/* Step status semantics                                               */
/* ------------------------------------------------------------------ */

describe('countStepStatuses', () => {
  it('counts completed / running / pending separately', () => {
    const steps = [
      mkStep({ seq: 1, status: 'ok' }),
      mkStep({ seq: 2, status: 'running' }),
      mkStep({ seq: 3, status: 'unknown' }),
      mkStep({ seq: 4, status: 'error' }),
      mkStep({ seq: 5, status: 'aborted' }),
      mkStep({ seq: 6, status: 'max-tokens' }),
    ]
    const c = countStepStatuses(steps)
    expect(c.total).toBe(6)
    expect(c.completed).toBe(4) // ok, error, aborted, max-tokens
    expect(c.running).toBe(1)
    expect(c.pending).toBe(1)   // unknown
  })

  it('handles empty input', () => {
    const c = countStepStatuses([])
    expect(c).toEqual({ total: 0, completed: 0, running: 0, pending: 0 })
  })
})

describe('meanFirstActivity / sumDecode / sessionWall', () => {
  it('averages available TTFT values only', () => {
    const steps = [
      mkStep({ seq: 1, ttftMs: 100 }),
      mkStep({ seq: 2, ttftMs: 300 }),
      mkStep({ seq: 3 }), // no ttft
    ]
    expect(meanFirstActivity(steps)).toBe(200)
    expect(meanFirstActivity([mkStep({ seq: 1 })])).toBeUndefined()
  })

  it('sums decode values only when present', () => {
    const steps = [
      mkStep({ seq: 1, decodeMs: 10 }),
      mkStep({ seq: 2, decodeMs: 20 }),
      mkStep({ seq: 3 }),
    ]
    expect(sumDecode(steps)).toBe(30)
    expect(sumDecode([mkStep({ seq: 1 })])).toBeUndefined()
  })

  it('derives session wall from stats edges', () => {
    expect(sessionWall(stats)).toBe(4000)
    expect(sessionWall({ ...stats, endedAt: undefined })).toBeUndefined()
    expect(sessionWall({ ...stats, startedAt: undefined })).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */
/* Timeline geometry                                                   */
/* ------------------------------------------------------------------ */

describe('stepSpans', () => {
  it('emits one model span and one span per tool call with absolute times', () => {
    const step = mkStep({
      seq: 1,
      startAt: 1000,
      assistantAt: 2500,
      tools: [
        { callId: 'c1', name: 'read', callAt: 2600, resultAt: 3200, durationMs: 600 },
      ],
    })
    const spans = stepSpans(step, 99999)
    expect(spans).toHaveLength(2)
    expect(spans[0]).toMatchObject({ kind: 'model', start: 1000, end: 2500, durationMs: 1500 })
    expect(spans[1]).toMatchObject({ kind: 'tool', start: 2600, end: 3200, toolName: 'read', durationMs: 600 })
  })

  it('marks error tools and in-flight tools', () => {
    const step = mkStep({
      seq: 1,
      startAt: 1000,
      assistantAt: 2000,
      tools: [
        { callId: 'bad', name: 'pwsh', callAt: 2100, resultAt: 2300, durationMs: 200, error: { code: 'E1' } },
        { callId: 'live', name: 'glob', callAt: 2400 }, // no result yet
      ],
    })
    const spans = stepSpans(step, 5000)
    const bad = spans.find(s => s.id === 'tbad')
    const live = spans.find(s => s.id === 'tlive')
    expect(bad?.error).toBe(true)
    expect(live?.running).toBe(true)
    expect(live?.end).toBe(5000) // extends to the visible window edge
    expect(live?.durationMs).toBe(2600)
  })

  it('emits a running model span while streaming without an assistant message', () => {
    const step = mkStep({ seq: 1, startAt: 1000, status: 'running', firstChunkAt: 1500 })
    const spans = stepSpans(step, 4000)
    expect(spans).toHaveLength(1)
    expect(spans[0]).toMatchObject({ kind: 'model', start: 1000, end: 4000, running: true })
  })
})

describe('assignLanes', () => {
  it('puts parallel tools on separate lanes', () => {
    const spans = [
      { id: 'a', kind: 'tool' as const, start: 1000, end: 3000, durationMs: 2000 },
      { id: 'b', kind: 'tool' as const, start: 1100, end: 2900, durationMs: 1800 },
    ]
    const lanes = assignLanes(spans)
    expect(lanes.find(l => l.span.id === 'a')?.lane).not.toBe(lanes.find(l => l.span.id === 'b')?.lane)
  })

  it('reuses a lane for serial spans', () => {
    const spans = [
      { id: 'a', kind: 'tool' as const, start: 1000, end: 2000, durationMs: 1000 },
      { id: 'b', kind: 'tool' as const, start: 2001, end: 3000, durationMs: 999 },
    ]
    const lanes = assignLanes(spans)
    expect(lanes.find(l => l.span.id === 'a')?.lane).toBe(lanes.find(l => l.span.id === 'b')?.lane)
  })

  it('handles empty input', () => {
    expect(assignLanes([])).toEqual([])
  })
})

describe('barGeometry', () => {
  it('maps absolute times to percentages', () => {
    const g = barGeometry(2000, 4000, 0, 8000)
    expect(g.leftPct).toBe(25)
    expect(g.widthPct).toBe(25)
  })

  it('clamps very short bars to a minimum visible width', () => {
    const g = barGeometry(100, 101, 0, 100_000)
    expect(g.widthPct).toBeGreaterThanOrEqual(MIN_BAR_FRACTION * 100)
    expect(g.widthPct).toBeLessThan(MIN_BAR_FRACTION * 100 + 1e-9)
  })

  it('handles degenerate and out-of-range tracks', () => {
    expect(barGeometry(0, 100, 50, 50)).toEqual({ leftPct: 0, widthPct: 100 })
    const g = barGeometry(-1000, 10_000, 0, 1000)
    expect(g.leftPct).toBe(0)
    expect(g.widthPct).toBe(100)
  })

  it('never exceeds the track width', () => {
    const g = barGeometry(0, 500, 0, 1000)
    expect(g.leftPct + g.widthPct).toBeLessThanOrEqual(100)
  })
})

/* ------------------------------------------------------------------ */
/* Timeline time scale (ticks / ruler)                                 */
/* ------------------------------------------------------------------ */

describe('niceTickIntervalMs', () => {
  it('uses sub-second steps for short durations', () => {
    expect(niceTickIntervalMs(300)).toBe(250)
    expect(niceTickIntervalMs(1_500)).toBe(250) // < 2s
    expect(niceTickIntervalMs(1_000)).toBe(250) // exactly 1s still fits 4 ticks
  })

  it('steps up to 1s for a few seconds', () => {
    expect(niceTickIntervalMs(5_000)).toBe(1_000)
  })

  it('steps up to 2s / 5s for tens of seconds', () => {
    expect(niceTickIntervalMs(15_000)).toBe(2_000)
    expect(niceTickIntervalMs(30_000)).toBe(5_000)
  })

  it('steps up to 10s+ for a minute or more', () => {
    expect(niceTickIntervalMs(60_000)).toBe(10_000)
    expect(niceTickIntervalMs(300_000)).toBe(60_000) // 5m -> 1m ticks
    expect(niceTickIntervalMs(3_600_000)).toBe(600_000) // 1h -> 10m ticks
  })

  it('keeps tick counts within the cap on long durations', () => {
    expect(niceTickIntervalMs(24 * 3_600_000)).toBeGreaterThanOrEqual(3_600_000)
  })

  it('returns 0 for degenerate durations', () => {
    expect(niceTickIntervalMs(0)).toBe(0)
    expect(niceTickIntervalMs(-5)).toBe(0)
    expect(niceTickIntervalMs(Number.NaN)).toBe(0)
    expect(niceTickIntervalMs(Number.POSITIVE_INFINITY)).toBe(0)
    expect(niceTickIntervalMs(5_000, 0)).toBe(0)
  })

  it('respects a custom tick cap', () => {
    // with cap 4, a 15s span no longer fits 2s ticks (8) and moves to 5s (3)
    expect(niceTickIntervalMs(15_000, 4)).toBe(5_000)
  })
})

describe('tickLabel', () => {
  it('formats sub-second labels as ms', () => {
    expect(tickLabel(0, 250)).toBe('0s')
    expect(tickLabel(250, 250)).toBe('250ms')
    expect(tickLabel(500, 500)).toBe('500ms')
  })

  it('formats second-scale labels compactly', () => {
    expect(tickLabel(0, 1_000)).toBe('0s')
    expect(tickLabel(2_000, 1_000)).toBe('2s')
    expect(tickLabel(2_500, 1_000)).toBe('2.5s')
    // a 500ms interval stays in ms units for consistency
    expect(tickLabel(2_500, 500)).toBe('2500ms')
  })

  it('formats minute-scale labels compactly', () => {
    expect(tickLabel(0, 60_000)).toBe('0s')
    expect(tickLabel(60_000, 60_000)).toBe('1m')
    expect(tickLabel(120_000, 60_000)).toBe('2m')
    // a 30s interval stays in seconds units for consistency
    expect(tickLabel(90_000, 30_000)).toBe('90s')
  })
})

describe('timelineTicks', () => {
  it('emits aligned ticks with relative labels over a short span', () => {
    const ticks = timelineTicks(0, 300)
    expect(ticks.map(t => t.at)).toEqual([0, 250])
    expect(ticks.map(t => t.label)).toEqual(['0s', '250ms'])
  })

  it('scales a few seconds to 1s ticks', () => {
    const ticks = timelineTicks(0, 5_000)
    expect(ticks.map(t => t.at)).toEqual([0, 1_000, 2_000, 3_000, 4_000, 5_000])
  })

  it('anchors labels relative to tMin, not to 0', () => {
    const ticks = timelineTicks(10_000, 15_000)
    expect(ticks[0]).toEqual({ at: 10_000, label: '0s' })
    expect(ticks[ticks.length - 1].at).toBe(15_000)
    expect(ticks[ticks.length - 1].label).toBe('5s')
  })

  it('anchors the ruler at tMin even when tMin is off the wall-clock grid', () => {
    // tMin is not a multiple of the interval — the ruler must still start at 0s
    const ticks = timelineTicks(12_345, 17_345)
    expect(ticks[0]).toEqual({ at: 12_345, label: '0s' })
    expect(ticks.map(t => t.at)).toEqual([12_345, 13_345, 14_345, 15_345, 16_345, 17_345])
    expect(ticks.map(t => t.label)).toEqual(['0s', '1s', '2s', '3s', '4s', '5s'])
  })

  it('handles 60s+ spans with minute-scale ticks', () => {
    const ticks = timelineTicks(0, 60_000)
    expect(ticks.every(t => t.at % 10_000 === 0)).toBe(true)
    expect(ticks.length).toBeLessThanOrEqual(MAX_TIMELINE_TICKS + 1)
  })

  it('returns empty for degenerate or missing spans', () => {
    expect(timelineTicks(0, 0)).toEqual([])
    expect(timelineTicks(5_000, 1_000)).toEqual([])
    expect(timelineTicks(Number.NaN, 5_000)).toEqual([])
  })
})

describe('trackPct', () => {
  it('maps absolute times onto the track as percentages', () => {
    expect(trackPct(10_000, 10_000, 20_000)).toBe(0)
    expect(trackPct(15_000, 10_000, 20_000)).toBe(50)
    expect(trackPct(20_000, 10_000, 20_000)).toBe(100)
  })

  it('handles times outside the window without dividing by zero', () => {
    // ruler/grid positions are clamped by the caller; the helper itself
    // just maps the linear position (may be <0 or >100).
    expect(trackPct(0, 10_000, 20_000)).toBe(-100)
    expect(trackPct(30_000, 10_000, 20_000)).toBe(200)
  })

  it('falls back to a 1ms track on degenerate windows', () => {
    expect(trackPct(10_000, 10_000, 10_000)).toBe(0)
    expect(trackPct(10_001, 10_000, 10_000)).toBe(100)
  })

  it('matches barGeometry left position on the same window', () => {
    const at = 12_000
    const left = trackPct(at, 10_000, 20_000)
    expect(barGeometry(at, 13_000, 10_000, 20_000).leftPct).toBe(left)
  })
})

/* ------------------------------------------------------------------ */
/* Turn folding                                                        */
/* ------------------------------------------------------------------ */

describe('summarizeTurn', () => {
  it('summarizes a completed turn with wall time and tool count', () => {
    const turn = mkTurn({
      seq: 1,
      turn: 1,
      startAt: 1000,
      endAt: 4000,
      reason: { kind: 'completed' },
      steps: [
        mkStep({ seq: 1, tools: [{ callId: 'c1', name: 'read', callAt: 2000 }] }),
        mkStep({ seq: 2, tools: [{ callId: 'c2', name: 'glob', callAt: 3000 }, { callId: 'c3', name: 'pwsh', callAt: 3100 }] }),
      ],
    })
    const s = summarizeTurn(turn)
    expect(s.steps).toBe(2)
    expect(s.toolCalls).toBe(3)
    expect(s.wallMs).toBe(3000)
    expect(s.running).toBe(false)
    expect(s.reason).toBe('completed')
  })

  it('reports a running turn without wall time', () => {
    const s = summarizeTurn(mkTurn({ seq: 1, turn: 1, startAt: 1000, steps: [] }))
    expect(s.running).toBe(true)
    expect(s.wallMs).toBeUndefined()
    expect(s.reason).toBeUndefined()
  })
})

describe('defaultOpen', () => {
  it('opens the running turn and the newest turn, folds the rest', () => {
    const turns = [
      mkTurn({ seq: 1, turn: 1, startAt: 0, endAt: 1000, reason: { kind: 'completed' } }),
      mkTurn({ seq: 2, turn: 2, startAt: 1000, endAt: 2000, reason: { kind: 'completed' } }),
      mkTurn({ seq: 3, turn: 3, startAt: 2000 }), // running
    ]
    expect(defaultOpen(turns[0], 0, 3)).toBe(false)
    expect(defaultOpen(turns[1], 1, 3)).toBe(false) // middle completed turn folds
    expect(defaultOpen(turns[2], 2, 3)).toBe(true)  // running
    expect(defaultOpen(turns[1], 1, 2)).toBe(true)  // newest closed turn stays open
  })
})
