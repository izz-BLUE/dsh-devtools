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
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. */
export declare const name = "dsh-devtools";
/** Required services: the generic Connection RPC registry and the session store. */
export declare const inject: string[];
/**
 * Register the /dsh-devtools RPC channel.
 * @param ctx - plugin context carrying connection + sessions.
 */
export declare function apply(ctx: Context): void;
export { createFold, foldInto } from './fold.ts';
export type { FoldState, HookRecord, RetryRecord, StepRecord, ToolCallRecord, TraceCaps, TraceMeta, TurnRecord } from './fold.ts';
export { buildTrace } from './trace.ts';
export type { RetryWire, StepWire, TraceSnapshot, TraceStats, TurnWire } from './trace.ts';
