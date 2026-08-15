/**
 * Trace snapshot building — turns the folded per-session state into the
 * wire payload served over the /dsh-devtools RPC channel.
 *
 * METADATA-FIRST by construction: the wire carries only structural facts
 * (timestamps, ids, names, statuses, provider-reported usage counts). No
 * message text, tool arguments, or tool result content ever enters a
 * snapshot, so nothing here can leak a prompt or a secret.
 *
 * @module dsh-devtools/trace
 */
import type { FinishReason, TokenUsage } from '@deepseek-ai/dsh-llm';
import type { FoldState, HookRecord } from './fold.ts';
import type { TraceMeta } from './fold.ts';
/** One tool invocation on the wire. */
export interface ToolCallWire {
    readonly callId: string;
    readonly name: string;
    readonly callAt: number;
    readonly resultAt?: number;
    readonly durationMs?: number;
    readonly error?: {
        readonly name?: string;
        readonly code?: string;
    };
    readonly isError?: boolean;
}
/** One retry on the wire. */
export interface RetryWire {
    readonly retry: number;
    readonly maxRetries: number;
    readonly delayMs?: number;
    readonly code?: string;
    readonly at: number;
}
/** One step on the wire. */
export interface StepWire {
    readonly seq: number;
    readonly turn: number;
    readonly step: number;
    readonly startAt: number;
    readonly endAt?: number;
    readonly firstChunkAt?: number;
    readonly assistantAt?: number;
    readonly finish?: FinishReason;
    readonly usage?: TokenUsage;
    readonly status: string;
    readonly error?: {
        readonly message: string;
        readonly code: string;
    };
    readonly model?: string;
    readonly provider?: string;
    /** Derived: model-wall time ms (assistantAt - startAt). */
    readonly modelMs?: number;
    /** Derived: time to first chunk ms (firstChunkAt - startAt). */
    readonly ttftMs?: number;
    /** Derived: decode ms (assistantAt - firstChunkAt). */
    readonly decodeMs?: number;
    /** Derived: step wall time ms (endAt - startAt). */
    readonly wallMs?: number;
    readonly retries: readonly RetryWire[];
    readonly tools: readonly ToolCallWire[];
}
/** One turn on the wire, with its closed steps attached. */
export interface TurnWire {
    readonly seq: number;
    readonly turn: number;
    readonly startAt: number;
    readonly endAt?: number;
    readonly stepCount?: number;
    readonly reason?: {
        readonly kind: string;
        readonly detail?: string;
    };
    readonly steps: readonly StepWire[];
}
/** Whole-session aggregates (computed over the retained window). */
export interface TraceStats {
    readonly turns: number;
    readonly steps: number;
    readonly errors: number;
    readonly aborted: number;
    readonly maxTokens: number;
    readonly retries: number;
    readonly toolCalls: number;
    readonly toolErrors: number;
    readonly startedAt?: number;
    readonly endedAt?: number;
    /** Summed model wall time over steps with an assistant message, ms. */
    readonly modelMs: number;
    /** Summed tool execution time over paired results, ms. */
    readonly toolMs: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly reasoningTokens: number;
}
/** The wire payload for one session's runtime trace. */
export interface TraceSnapshot {
    readonly ok: true;
    readonly session: {
        readonly id: string;
        readonly meta: TraceMeta;
    };
    readonly stats: TraceStats;
    readonly turns: readonly TurnWire[];
    readonly hooks: readonly HookRecord[];
    readonly droppedSteps: number;
    /** True when the session log is still live in the host store. */
    readonly live: boolean;
}
/** Build the wire snapshot from the folded state. */
export declare function buildTrace(st: FoldState, sessionId: string, live: boolean): TraceSnapshot;
