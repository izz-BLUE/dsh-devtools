/**
 * dsh-devtools — Host half (installed package entry).
 *
 * A plain Cordis plugin loaded by the harness as the `dsh-devtools` loader
 * row. It replays a session's durable event log into an Agent Runtime
 * Trace (fold.ts) and serves it to the Client half over the generic
 * Connection RPC channel `/dsh-devtools` (trace.ts).
 *
 * READ-ONLY OBSERVABILITY: nothing here intercepts, injects, or mutates any
 * request; the fold consumes only committed session events and the payloads
 * are metadata-only (no prompt or tool-result text ever crosses the wire).
 *
 * Live sessions fold straight from the in-memory log (`sessions.get(id).events`
 * — no clone, no parse) and the fold is INCREMENTAL: per-session state
 * advances only over newly appended events. Cold (persisted, not live)
 * sessions fall back to `sessionQuery` and are served from cache once folded,
 * since their logs never grow.
 *
 * @module dsh-devtools
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ConnectionRpcHandler, HostConnectionRpc } from '@deepseek-ai/dsh-client-connection'
import { createFold, foldInto } from './fold.ts'
import type { FoldEventLike, FoldState } from './fold.ts'
import { buildTrace } from './trace.ts'
import type { TraceSnapshot } from './trace.ts'

/** Cordis plugin name. */
export const name = 'dsh-devtools'

/** Required services: the generic Connection RPC registry and the session store. */
export const inject = ['connection', 'sessions']

/** Per-session fold state plus the cached result it reflects. */
interface SessionState {
  fold: FoldState
  /** Number of log events the cached result reflects. */
  count: number
  result: TraceSnapshot | null
}

/** Minimal structural views of the harness services (runtime values are the
 * real services; these narrow the consumed surface for tests). */
interface SessionLike {
  readonly events: readonly import('./fold.ts').FoldEventLike[]
}
interface SessionsLike {
  get(id: string): SessionLike | undefined
}
interface SessionQueryLike {
  listEvents(id: string): Promise<readonly unknown[]>
  readSession(id: string): Promise<{ events?: readonly import('./fold.ts').FoldEventLike[] } | undefined>
}

/** Build one trace snapshot for a session, folding incrementally. */
function computeTrace(ctx: Context, states: Map<string, SessionState>, sessionId: string): Promise<TraceSnapshot> {
  let st = states.get(sessionId)
  if (st === undefined) {
    st = { fold: createFold(), count: -1, result: null }
    states.set(sessionId, st)
  }

  // Resolve the log sources lazily per call: `sessions` / `sessionQuery` may
  // be provided after this plugin applies, and a replaced service must not
  // leave us holding a stale instance.
  const sessions = ctx.get('sessions') as SessionsLike | undefined
  const sessionQuery = ctx.get('sessionQuery') as SessionQueryLike | undefined

  // Live sessions fold from the in-memory log — no clone, no disk parse.
  const live = sessions !== undefined ? sessions.get(sessionId) : undefined
  if (live !== undefined) {
    const events = live.events
    if (events.length === st.count && st.result !== null) return Promise.resolve(st.result)
    if (events.length < st.fold.n) st.fold = createFold() // defensive: log replaced
    foldInto(st.fold, events)
    st.count = events.length
    st.result = buildTrace(st.fold, sessionId, true)
    return Promise.resolve(st.result)
  }

  // Cold (persisted) session: probe the lightweight record count only.
  if (sessionQuery === undefined) {
    return Promise.reject(new Error('session is not live and sessionQuery is unavailable'))
  }
  return (async () => {
    if (st.result !== null && st.count >= 0) {
      const records = await sessionQuery.listEvents(sessionId)
      if (records.length === st.count) return st.result as TraceSnapshot
    }
    const snapshot = await sessionQuery.readSession(sessionId)
    const events = snapshot !== undefined && Array.isArray(snapshot.events) ? snapshot.events : []
    if (events.length === st.count && st.result !== null) return st.result
    if (events.length < st.fold.n) st.fold = createFold()
    foldInto(st.fold, events)
    st.count = events.length
    st.result = buildTrace(st.fold, sessionId, false)
    return st.result
  })()
}

/**
 * Register the /dsh-devtools RPC channel.
 * @param ctx - plugin context carrying connection + sessions.
 */
export function apply(ctx: Context): void {
  const states = new Map<string, SessionState>()

  ctx.effect(() => {
    const rpc = (ctx.get('connection') as { rpc: HostConnectionRpc } | undefined)?.rpc
    if (rpc === undefined) {
      ctx.logger.warn('dsh-devtools: connection.rpc unavailable; trace channel not mounted')
      return () => undefined
    }
    const handler: ConnectionRpcHandler = async (endpoint, payload) => {
      try {
        if (endpoint !== 'trace') {
          return { ok: false, error: { code: 'internal', message: `unknown endpoint: ${endpoint}`, details: {} } }
        }
        const sessionId = payload !== null && typeof payload === 'object'
          ? (payload as { sessionId?: unknown }).sessionId
          : undefined
        if (typeof sessionId !== 'string' || sessionId === '') {
          return { ok: false, error: { code: 'internal', message: 'missing sessionId', details: {} } }
        }
        const value = await computeTrace(ctx, states, sessionId)
        return { ok: true, value }
      } catch (err) {
        return {
          ok: false,
          error: {
            code: 'internal',
            message: err instanceof Error ? err.message : String(err),
            details: {},
          },
        }
      }
    }
    return rpc.handle('/dsh-devtools', handler, { authority: 'trusted-host' })
  }, 'dsh-devtools: rpc channel')
}

// ---- public type surface (stable for downstream consumers) ----

export { createFold, foldInto } from './fold.ts'
export type { FoldState, HookRecord, RetryRecord, StepRecord, ToolCallRecord, TraceCaps, TraceMeta, TurnRecord } from './fold.ts'
export { buildTrace } from './trace.ts'
export type { RetryWire, StepWire, TraceSnapshot, TraceStats, TurnWire } from './trace.ts'
