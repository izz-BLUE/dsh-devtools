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
import type { FinishReason, TokenUsage } from '@deepseek-ai/dsh-llm';
/** The minimal structural event the fold consumes (the runtime SessionEvent
 * satisfies this shape). */
export interface FoldEventLike {
    readonly seq: number;
    readonly type: string;
    readonly time: number;
    readonly data?: Record<string, unknown>;
}
/** The per-step outcome. 'unknown' is a step that closed without an
 * assistant message and whose turn has not ended yet (its final status
 * arrives with turn/end). */
export type StepStatus = 'running' | 'ok' | 'error' | 'aborted' | 'max-tokens' | 'blocked' | 'interrupted' | 'unknown';
/** One model-requested tool invocation inside a step, paired by callId. */
export interface ToolCallRecord {
    readonly callId: string;
    readonly name: string;
    readonly callAt: number;
    readonly resultAt?: number;
    /** resultAt - callAt when the result landed; absent while in flight. */
    readonly durationMs?: number;
    /** The tool/result envelope's structured failure identity, when present. */
    readonly error?: {
        readonly name?: string;
        readonly code?: string;
    };
    /** The tool-result block's isError flag, when the tool reported one. */
    readonly isError?: boolean;
}
/** One llm/retry decision attributed to its step. */
export interface RetryRecord {
    readonly retry: number;
    readonly maxRetries: number;
    /** Provider-requested or policy delay before the retry stream starts. */
    readonly delayMs?: number;
    readonly code?: string;
    readonly message?: string;
    readonly at: number;
}
/** One model call (a step) with its execution facts. */
export interface StepRecord {
    /** seq of the step/start event. */
    readonly seq: number;
    readonly turn: number;
    readonly step: number;
    readonly startAt: number;
    readonly endAt?: number;
    /** Time of the first stream block-start chunk (TTFT anchor). */
    readonly firstChunkAt?: number;
    /** Time the assembled assistant message landed (model-time end). */
    readonly assistantAt?: number;
    /** Stream finish reason from the terminal finish chunk, when reported. */
    readonly finish?: FinishReason;
    /** Provider-reported usage for the step, when the adapter reported it. */
    readonly usage?: TokenUsage;
    readonly retries: readonly RetryRecord[];
    readonly tools: readonly ToolCallRecord[];
    readonly status: StepStatus;
    /** Structured failure attributed via turn/end (or stream finish). */
    readonly error?: {
        readonly message: string;
        readonly code: string;
    };
    /** Model in force when this step started (model switches are visible here). */
    readonly model?: string;
    readonly provider?: string;
}
/** One turn with its outcome and closed-step count. */
export interface TurnRecord {
    /** seq of the turn/start event. */
    readonly seq: number;
    readonly turn: number;
    readonly startAt: number;
    readonly endAt?: number;
    /** Closed steps so far (step/end count). */
    readonly stepCount?: number;
    /** The authoritative turn outcome, when the turn ended. */
    readonly reason?: {
        readonly kind: string;
        readonly detail?: string;
    };
}
/** One hook execution (hook/invoked .. hook/result), when producers emit them. */
export interface HookRecord {
    readonly seq: number;
    readonly at: number;
    readonly plugin?: string;
    readonly name?: string;
    readonly durationMs?: number;
    readonly error?: boolean;
}
/** Session-level metadata captured from the log. */
export interface TraceMeta {
    readonly model?: string;
    readonly provider?: string;
    readonly contextWindow?: number;
    /** Captured from subagent/descriptor when this session is a subagent. */
    readonly subagent?: {
        readonly label?: string;
        readonly mode?: string;
        readonly agentModel?: string;
    };
}
/** Retention caps for the fold (bounded memory, ring semantics). */
export interface TraceCaps {
    /** Kept steps; the oldest are dropped past this bound. */
    readonly maxSteps: number;
    /** Kept hook records. */
    readonly maxHooks: number;
}
/** Default retention: 1000 steps / 200 hooks. */
export declare const DEFAULT_TRACE_CAPS: TraceCaps;
/** Per-session fold state; advances only over newly appended events. */
export interface FoldState {
    /** Number of log events already folded (the fold resumes from here). */
    n: number;
    readonly caps: TraceCaps;
    readonly turns: TurnRecord[];
    readonly steps: StepRecord[];
    readonly hooks: HookRecord[];
    /** Session-level metadata captured from the log. */
    meta: TraceMeta;
    openTurn?: TurnRecord;
    openStep?: StepRecord;
    /** Stack of unclosed hook/invoked records for defensive pairing. */
    readonly hookStack: {
        readonly record: HookRecord;
    }[];
    /** Number of steps dropped by the retention cap (for the wire). */
    droppedSteps: number;
}
/** Fresh fold state for one session. */
export declare function createFold(caps?: TraceCaps): FoldState;
/**
 * Advance the fold over every event not yet folded. Mutates `st` in place.
 * Pure structural consumption: never reads or stores message content.
 */
export declare function foldInto(st: FoldState, events: readonly FoldEventLike[]): void;
