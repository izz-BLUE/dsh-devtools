/**
 * Fold unit tests — Agent Runtime Trace semantics over synthetic durable
 * logs shaped like real v0.1.0-rc.6 sessions.
 */

import { describe, expect, it } from 'vitest'
import { createFold, foldInto } from '../src/fold.ts'
import type { FoldEventLike, FoldState } from '../src/fold.ts'
import { buildTrace } from '../src/trace.ts'

/** Build a synthetic event with seq/time auto-assigned. */
function ev(seq: number, time: number, type: string, data: Record<string, unknown> = {}): FoldEventLike {
  return { seq, time, type, data }
}

/** Fold a list of events into a fresh state. */
function fold(events: readonly FoldEventLike[], caps?: { maxSteps: number; maxHooks: number }): FoldState {
  const st = createFold(caps)
  foldInto(st, events)
  return st
}

const usage = { inputTokens: 100, outputTokens: 20, cacheReadTokens: 400, reasoningTokens: 5 }

/** A normal completed turn with one tool-using step. */
function normalTurn(base = 1000): FoldEventLike[] {
  return [
    ev(1, base, 'turn/start', { turn: 1 }),
    ev(2, base + 10, 'step/start', { turn: 1, step: 1 }),
    ev(3, base + 500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'block-start', index: 0, blockType: 'reasoning' } }),
    ev(4, base + 700, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'usage', usage } }),
    ev(5, base + 800, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'finish', reason: { kind: 'tool-calls' } } }),
    ev(6, base + 810, 'assistant/message', { turn: 1, step: 1, message: { content: [{ type: 'tool-call', id: 'c1', name: 'read', arguments: '{}' }] }, usage }),
    ev(7, base + 820, 'tool/call', { turn: 1, step: 1, callId: 'c1', name: 'read', arguments: '{"path":"/a"}' }),
    ev(8, base + 850, 'tool/result', { turn: 1, step: 1, message: { source: { callId: 'c1' }, content: [{ type: 'tool-result', toolCallId: 'c1', content: [{ type: 'text', text: 'file content' }] }] } }),
    ev(9, base + 860, 'step/end', { turn: 1, step: 1 }),
    ev(10, base + 900, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
  ]
}

describe('step timeline', () => {
  it('derives TTFT / model / decode / wall latency from event timestamps', () => {
    const st = fold(normalTurn())
    expect(st.steps).toHaveLength(1)
    const s = st.steps[0]
    expect(s.status).toBe('ok')
    expect(s.firstChunkAt).toBe(1500)
    expect(s.assistantAt).toBe(1810)
    expect(s.endAt).toBe(1860)
    const wire = buildTrace(st, 's1', true)
    const step = wire.turns[0].steps[0]
    expect(step.ttftMs).toBe(490)   // 1500 - 1010
    expect(step.modelMs).toBe(800)  // 1810 - 1010
    expect(step.decodeMs).toBe(310) // 1810 - 1500
    expect(step.wallMs).toBe(850)   // 1860 - 1010
    expect(step.finish).toEqual({ kind: 'tool-calls' })
    expect(step.usage).toEqual(usage)
  })

  it('pairs parallel tool calls by callId regardless of completion order', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'finish', reason: { kind: 'tool-calls' } } }),
      ev(4, 1510, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(5, 1520, 'tool/call', { turn: 1, step: 1, callId: 'slow', name: 'pwsh', arguments: '{}' }),
      ev(6, 1530, 'tool/call', { turn: 1, step: 1, callId: 'fast', name: 'read', arguments: '{}' }),
      // fast completes first, then slow
      ev(7, 1600, 'tool/result', { turn: 1, step: 1, message: { source: { callId: 'fast' }, content: [{ type: 'tool-result', toolCallId: 'fast', content: [] }] } }),
      ev(8, 3000, 'tool/result', { turn: 1, step: 1, message: { source: { callId: 'slow' }, content: [{ type: 'tool-result', toolCallId: 'slow', content: [] }] } }),
      ev(9, 3010, 'step/end', { turn: 1, step: 1 }),
      ev(10, 3100, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const st = fold(events)
    const tools = st.steps[0].tools
    expect(tools).toHaveLength(2)
    const fast = tools.find(t => t.callId === 'fast')
    const slow = tools.find(t => t.callId === 'slow')
    expect(fast?.durationMs).toBe(70)   // 1600 - 1530
    expect(slow?.durationMs).toBe(1480) // 3000 - 1520
    expect(buildTrace(st, 's1', true).stats.toolMs).toBe(70 + 1480)
  })

  it('marks tool errors and isError results', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'finish', reason: { kind: 'tool-calls' } } }),
      ev(4, 1510, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(5, 1520, 'tool/call', { turn: 1, step: 1, callId: 'a', name: 'pwsh', arguments: '{}' }),
      ev(6, 2000, 'tool/result', { turn: 1, step: 1, error: { name: 'Error', code: 'E2BIG' }, message: { source: { callId: 'a' }, content: [{ type: 'tool-result', toolCallId: 'a', content: [] }] } }),
      ev(7, 2100, 'step/end', { turn: 1, step: 1 }),
      ev(8, 2200, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const st = fold(events)
    const tool = st.steps[0].tools[0]
    expect(tool.error).toEqual({ name: 'Error', code: 'E2BIG' })
    expect(buildTrace(st, 's1', true).stats.toolErrors).toBe(1)
  })
})

describe('failure and interruption semantics', () => {
  it('attributes turn/end error to the step and keeps retry chains', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'block-start', index: 0, blockType: 'reasoning' } }),
      ev(4, 1600, 'llm/retry', { retryId: 'r1', turn: 1, step: 1, retry: 1, maxRetries: 2, delayMs: 500, failure: { message: 'DeepSeek API request failed', code: 'TRANSPORT' } }),
      ev(5, 1700, 'llm/retry-started', { retryId: 'r1', turn: 1, step: 1, retry: 1 }),
      ev(6, 2100, 'llm/retry', { retryId: 'r1', turn: 1, step: 1, retry: 2, maxRetries: 2, delayMs: 900, failure: { message: 'DeepSeek API request failed', code: 'TRANSPORT' } }),
      ev(7, 2200, 'llm/retry-started', { retryId: 'r1', turn: 1, step: 1, retry: 2 }),
      ev(8, 2500, 'step/end', { turn: 1, step: 1 }),
      ev(9, 2600, 'turn/end', { turn: 1, reason: { kind: 'error', error: { message: 'DeepSeek API request to https://api.deepseek.com failed', code: 'TRANSPORT' } } }),
    ]
    const st = fold(events)
    const s = st.steps[0]
    expect(s.status).toBe('error')
    expect(s.error?.code).toBe('TRANSPORT')
    expect(s.assistantAt).toBeUndefined() // failed steps assemble no message
    expect(s.retries).toHaveLength(2)
    expect(s.retries[1]).toMatchObject({ retry: 2, maxRetries: 2, delayMs: 900, code: 'TRANSPORT' })
    const wire = buildTrace(st, 's1', true)
    expect(wire.stats.errors).toBe(1)
    expect(wire.stats.retries).toBe(2)
    expect(wire.turns[0].reason?.kind).toBe('error')
  })

  it('marks aborted turns (user interruption) on the open step', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'block-start', index: 0, blockType: 'text' } }),
      ev(4, 2000, 'step/end', { turn: 1, step: 1 }),
      ev(5, 2100, 'turn/end', { turn: 1, reason: { kind: 'aborted', reason: { kind: 'user' } } }),
    ]
    const st = fold(events)
    expect(st.steps[0].status).toBe('aborted')
    expect(st.turns[0].reason?.kind).toBe('aborted')
  })

  it('keeps max-tokens from the stream finish chunk', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'finish', reason: { kind: 'max-tokens' } } }),
      ev(4, 1600, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(5, 1610, 'step/end', { turn: 1, step: 1 }),
      ev(6, 1700, 'turn/end', { turn: 1, reason: { kind: 'max-tokens' } }),
    ]
    const st = fold(events)
    expect(st.steps[0].status).toBe('max-tokens')
    expect(st.steps[0].finish).toEqual({ kind: 'max-tokens' })
    expect(buildTrace(st, 's1', true).stats.maxTokens).toBe(1)
  })

  it('marks blocked and interrupted outcomes', () => {
    const blocked = fold([
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'step/end', { turn: 1, step: 1 }),
      ev(4, 1600, 'turn/end', { turn: 1, reason: { kind: 'blocked' } }),
    ])
    expect(blocked.steps[0].status).toBe('blocked')
    const interrupted = fold([
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'step/end', { turn: 1, step: 1 }),
      ev(4, 1600, 'turn/end', { turn: 1, reason: { kind: 'interrupted' } }),
    ])
    expect(interrupted.steps[0].status).toBe('interrupted')
  })

  it('does not clobber an already-ok step of a failed turn', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/message', { turn: 1, step: 1, message: { content: [{ type: 'text', text: 'ok' }] } }),
      ev(4, 1600, 'step/end', { turn: 1, step: 1 }),
      // step 2 fails
      ev(5, 2000, 'step/start', { turn: 1, step: 2 }),
      ev(6, 2500, 'step/end', { turn: 1, step: 2 }),
      ev(7, 2600, 'turn/end', { turn: 1, reason: { kind: 'error', error: { message: 'boom', code: 'SERVER' } } }),
    ]
    const st = fold(events)
    expect(st.steps[0].status).toBe('ok')
    expect(st.steps[1].status).toBe('error')
    expect(st.steps[1].error?.code).toBe('SERVER')
  })
})

describe('model and metadata', () => {
  it('tracks model switches through request/header changes', () => {
    const events = [
      ev(1, 1000, 'request/header', { header: { config: { provider: 'deepseek', model: 'deepseek-v4-pro' } }, reason: 'initial' }),
      ev(2, 1010, 'turn/start', { turn: 1 }),
      ev(3, 1020, 'step/start', { turn: 1, step: 1 }),
      ev(4, 1500, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(5, 1600, 'step/end', { turn: 1, step: 1 }),
      ev(6, 2000, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } }, reason: 'change' }),
      ev(7, 2010, 'step/start', { turn: 1, step: 2 }),
      ev(8, 2500, 'assistant/message', { turn: 1, step: 2, message: { content: [] } }),
      ev(9, 2600, 'step/end', { turn: 1, step: 2 }),
      ev(10, 3000, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const st = fold(events)
    expect(st.meta.model).toBe('deepseek-v4-flash')
    const wire = buildTrace(st, 's1', true)
    expect(wire.turns[0].steps[0].model).toBe('deepseek-v4-pro')
    expect(wire.turns[0].steps[1].model).toBe('deepseek-v4-flash')
  })

  it('backfills the in-flight step when request/header lands after step/start', () => {
    // Real log order: step/start, then user/message, session/title, then
    // request/header for the actual request. Without backfill the first step
    // of each turn keeps the PREVIOUS turn's model (or nothing at all).
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1012, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } }, reason: 'initial' }),
      ev(4, 1500, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(5, 1600, 'step/end', { turn: 1, step: 1 }),
      ev(6, 2000, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
      // Turn 2 switches the model; its step/start precedes the new header.
      ev(7, 2100, 'turn/start', { turn: 2 }),
      ev(8, 2110, 'step/start', { turn: 2, step: 1 }),
      ev(9, 2112, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-pro' } }, reason: 'change' }),
      ev(10, 2600, 'assistant/message', { turn: 2, step: 1, message: { content: [] } }),
      ev(11, 2700, 'step/end', { turn: 2, step: 1 }),
      ev(12, 2800, 'turn/end', { turn: 2, reason: { kind: 'completed' } }),
    ]
    const wire = buildTrace(fold(events), 's1', true)
    // Turn 1 step 1: header backfills the missing model.
    expect(wire.turns[0].steps[0].model).toBe('deepseek-v4-flash')
    expect(wire.turns[0].steps[0].provider).toBe('deepseek-official')
    // Turn 2 step 1: stale snapshot (flash) corrected to the switched model.
    expect(wire.turns[1].steps[0].model).toBe('deepseek-v4-pro')
    expect(wire.turns[1].steps[0].provider).toBe('deepseek-official')
  })

  it('does not clobber a step model when the header matches or the step is closed', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1012, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } }, reason: 'initial' }),
      ev(4, 1015, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } }, reason: 'repeat' }),
      ev(5, 1500, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(6, 1600, 'step/end', { turn: 1, step: 1 }),
      // Header arriving after the step closed must NOT resurrect anything.
      ev(7, 1700, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-pro' } }, reason: 'late' }),
      ev(8, 2000, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const st = fold(events)
    expect(st.steps).toHaveLength(1)
    expect(st.steps[0].model).toBe('deepseek-v4-flash') // unchanged by the repeat header
    const wire = buildTrace(st, 's1', true)
    expect(wire.turns[0].steps[0].model).toBe('deepseek-v4-flash') // late header ignored
    expect(wire.session.meta.model).toBe('deepseek-v4-pro') // meta still advances
  })

  it('captures context window and subagent descriptor metadata', () => {
    const st = fold([
      ev(1, 1000, 'request/context', { provider: 'deepseek-official', model: 'deepseek-v4-flash', contextWindow: 1000000 }),
      ev(2, 1010, 'subagent/descriptor', { version: 2, mode: 'continuable', provider: 'spawn', label: 'Research X', agentModel: 'deepseek-v4-flash' }),
    ])
    expect(st.meta.contextWindow).toBe(1000000)
    expect(st.meta.subagent?.label).toBe('Research X')
    expect(st.meta.subagent?.mode).toBe('continuable')
  })
})

describe('retention and incrementality', () => {
  it('trims the step ring past the cap and reports dropped steps', () => {
    const events: FoldEventLike[] = []
    let seq = 0
    for (let turn = 1; turn <= 6; turn++) {
      events.push(ev(++seq, seq * 10, 'turn/start', { turn }))
      for (let step = 1; step <= 100; step++) {
        events.push(ev(++seq, seq * 10, 'step/start', { turn, step }))
        events.push(ev(++seq, seq * 10 + 1, 'assistant/message', { turn, step, message: { content: [] } }))
        events.push(ev(++seq, seq * 10 + 2, 'step/end', { turn, step }))
      }
      events.push(ev(++seq, seq * 10, 'turn/end', { turn, reason: { kind: 'completed' } }))
    }
    const st = fold(events, { maxSteps: 100, maxHooks: 50 })
    expect(st.steps.length).toBe(100)
    expect(st.droppedSteps).toBe(500)
    expect(st.steps[0].turn).toBe(6) // newest 100 steps = the last turn's 100
    const wire = buildTrace(st, 's1', true)
    expect(wire.droppedSteps).toBe(500)
    expect(wire.stats.steps).toBe(100)
  })

  it('folds incrementally: only new events are consumed on the next pass', () => {
    const st = createFold()
    const base = normalTurn()
    foldInto(st, base)
    const consumed = st.n
    // Append a second turn; folding again must start from the new tail.
    const more = normalTurn(10000).map(e => ({ ...e, seq: e.seq + 100, data: { ...e.data, turn: 2 } }))
    foldInto(st, [...base, ...more])
    expect(st.n).toBe(base.length + more.length)
    expect(consumed).toBe(base.length)
    expect(st.turns).toHaveLength(2)
  })
})

describe('hooks (defensive; no installed producer today)', () => {
  it('pairs hook/invoked with hook/result and records duration', () => {
    const st = fold([
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'hook/invoked', { name: 'agent/pre-step', plugin: 'dsh-compaction-basic' }),
      ev(3, 1050, 'hook/result', { name: 'agent/pre-step', durationMs: 40 }),
      ev(4, 1100, 'step/start', { turn: 1, step: 1 }),
      ev(5, 1500, 'assistant/message', { turn: 1, step: 1, message: { content: [] } }),
      ev(6, 1600, 'step/end', { turn: 1, step: 1 }),
      ev(7, 1700, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ])
    expect(st.hooks).toHaveLength(1)
    expect(st.hooks[0]).toMatchObject({ name: 'agent/pre-step', plugin: 'dsh-compaction-basic', durationMs: 40 })
    expect(buildTrace(st, 's1', true).hooks).toHaveLength(1)
  })

  it('keeps an unpaired hook/invoked without crashing', () => {
    const st = fold([ev(1, 1000, 'hook/invoked', { name: 'x' })])
    expect(st.hooks).toHaveLength(1)
    expect(st.hooks[0].durationMs).toBeUndefined()
  })
})

describe('privacy (metadata-first)', () => {
  it('never carries tool arguments or result text on the wire', () => {
    const events = [
      ev(1, 1000, 'turn/start', { turn: 1 }),
      ev(2, 1010, 'step/start', { turn: 1, step: 1 }),
      ev(3, 1500, 'assistant/chunk', { turn: 1, step: 1, chunk: { type: 'finish', reason: { kind: 'tool-calls' } } }),
      ev(4, 1510, 'assistant/message', { turn: 1, step: 1, message: { content: [{ type: 'tool-call', id: 'c1', name: 'read', arguments: '{"path":"/etc/passwd"}' }] } }),
      ev(5, 1520, 'tool/call', { turn: 1, step: 1, callId: 'c1', name: 'read', arguments: '{"path":"/etc/passwd"}' }),
      ev(6, 2000, 'tool/result', {
        turn: 1, step: 1,
        message: {
          source: { callId: 'c1' },
          content: [{ type: 'tool-result', toolCallId: 'c1', content: [{ type: 'text', text: 'sk-AAAAAAAA-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB secret-line' }] }],
        },
      }),
      ev(7, 2100, 'step/end', { turn: 1, step: 1 }),
      ev(8, 2200, 'turn/end', { turn: 1, reason: { kind: 'completed' } }),
    ]
    const wire = JSON.stringify(buildTrace(fold(events), 's1', true))
    expect(wire).not.toContain('/etc/passwd')
    expect(wire).not.toContain('sk-AAAAAAAA')
    expect(wire).not.toContain('secret-line')
    // But the metadata survives.
    expect(wire).toContain('"name":"read"')
    expect(wire).toContain('"durationMs":480')
  })
})
