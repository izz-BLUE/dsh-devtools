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
import type { StepWire, TraceStats, TurnWire } from '../trace.ts';
export interface ExecutionSummary {
    readonly turns: number;
    /** Steps in the retained window (equals stats.steps). */
    readonly steps: number;
    readonly stepsCompleted: number;
    readonly stepsRunning: number;
    /** Steps closed without an assistant message and not yet attributed. */
    readonly stepsPending: number;
    readonly toolCalls: number;
    readonly toolErrors: number;
    readonly retries: number;
    /** Step-level failures (step status 'error'). */
    readonly stepErrors: number;
    /** Turn-level failures (turn/end reason kind 'error'). */
    readonly turnErrors: number;
    /** Turn-level aborted + interrupted (turn/end reason kind). */
    readonly turnInterrupted: number;
    readonly maxTokens: number;
}
export interface PerformanceSummary {
    /** Summed model wall time (assistantAt - startAt) over steps. */
    readonly modelMs: number;
    /** Summed tool wall time (tool/result - tool/call) over paired results. */
    readonly toolMs: number;
    /** Mean time from step/start to the first persisted block-start. */
    readonly avgFirstMs?: number;
    /** Session wall: last endAt - first startAt. */
    readonly wallMs?: number;
    /** Summed decode time (assistantAt - firstChunkAt) over steps. */
    readonly decodeMs?: number;
    /** Output tokens per session-wall second. */
    readonly throughputPerSec?: number;
}
export interface TokenSummary {
    readonly input: number;
    readonly output: number;
    readonly cacheRead: number;
    readonly reasoning: number;
    /** cacheRead / (input + cacheRead); undefined when the denominator is 0. */
    readonly cacheReusePct?: number;
}
export interface SummaryGroups {
    readonly execution: ExecutionSummary;
    readonly performance: PerformanceSummary;
    readonly tokens: TokenSummary;
}
/** Count steps by outcome semantics (completed = anything closed). */
export declare function countStepStatuses(steps: readonly StepWire[]): {
    readonly total: number;
    readonly completed: number;
    readonly running: number;
    readonly pending: number;
};
/**
 * Cache reuse ratio — an internal, derived figure.
 * cacheRead / (input + cacheRead). Undefined when the denominator is 0.
 * This is NOT the provider's official cache hit rate.
 */
export declare function cacheReuse(input: number, cacheRead: number): number | undefined;
/** Mean step TTFT over steps that persisted a block-start. */
export declare function meanFirstActivity(steps: readonly StepWire[]): number | undefined;
/** Summed decode time over steps that have it. */
export declare function sumDecode(steps: readonly StepWire[]): number | undefined;
/** Session wall time from the stats window, when both edges exist. */
export declare function sessionWall(stats: TraceStats): number | undefined;
/** Compute the three summary groups from the wire snapshot. */
export declare function computeSummary(stats: TraceStats, turns: readonly TurnWire[]): SummaryGroups;
export type SpanKind = 'model' | 'tool';
/** One time slice drawn on the step timeline bar. */
export interface ActivitySpan {
    readonly id: string;
    readonly kind: SpanKind;
    /** Absolute ms time of the slice start. */
    readonly start: number;
    /** Absolute ms time of the slice end (extended to tMax while in flight). */
    readonly end: number;
    readonly durationMs: number;
    readonly toolName?: string;
    readonly error?: boolean;
    /** True while the underlying activity has not finished yet. */
    readonly running?: boolean;
}
/** Minimum visible bar width as a fraction of the full track (e.g. 0.004). */
export declare const MIN_BAR_FRACTION = 0.004;
/**
 * Slice a step into absolute-time activity spans:
 * one model span [startAt, assistantAt] plus one span per tool call
 * [callAt, resultAt]. In-flight spans extend to `tMax` (the current visible
 * window edge) so a running model/tool is still visible.
 */
export declare function stepSpans(step: StepWire, tMax: number): ActivitySpan[];
/**
 * Greedy interval partitioning into lanes so parallel tool calls render side
 * by side instead of being stacked serially. Returns the lane index per span.
 */
export declare function assignLanes(spans: readonly ActivitySpan[]): ReadonlyArray<{
    span: ActivitySpan;
    lane: number;
}>;
/**
 * Map an absolute [start, end] onto the [tMin, tMax] track as percentages.
 * Degenerate tracks (tMax === tMin) yield a full-width bar; bars shorter
 * than MIN_BAR_FRACTION are clamped to stay visible.
 */
export declare function barGeometry(start: number, end: number, tMin: number, tMax: number): {
    readonly leftPct: number;
    readonly widthPct: number;
};
/** The collapsed summary of one turn. */
export interface TurnSummary {
    readonly steps: number;
    readonly toolCalls: number;
    /** Wall time; undefined while the turn is still open. */
    readonly wallMs?: number;
    readonly running: boolean;
    readonly reason?: string;
}
export declare function summarizeTurn(turn: TurnWire): TurnSummary;
/** Default fold policy: the running turn and the newest turn stay open. */
export declare function defaultOpen(turn: TurnWire, idx: number, len: number): boolean;
