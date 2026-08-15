/**
 * The DevTools conversation.view tab — Agent Runtime Profiler.
 *
 * Renders the per-turn/per-step execution timeline served by the Host half
 * over the /dsh-devtools RPC channel: step outcomes and latency (TTFT /
 * model / decode / wall), tool calls with durations and errors, retry
 * chains, turn end reasons, and hook executions. Metadata-only: no message
 * or tool content is ever shown.
 *
 * V0.1.1 Profiler UX: wide layout, three summary groups (Execution /
 * Performance / Tokens), step runtime timeline bars, collapsible turns, a
 * sticky runtime status bar, strict status semantics, trace completeness
 * and hook empty states. All figures are derived from the existing wire
 * snapshot (see derive.ts) — zero new instrumentation.
 *
 * Data policy: fetch on mount, then a 2s poll while the tab is visible
 * (paused on document hide, refreshed on re-show). A per-session cache
 * makes re-opening a session render instantly. Polling never resets user
 * UI state (turn folding lives in local component state).
 *
 * @module dsh-devtools/client/view
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { DevtoolsKey } from './locales.ts';
export type { TraceSnapshot, TurnWire } from '../trace.ts';
type Translate = (key: keyof DevtoolsKey, params?: Record<string, string | number>) => string;
/**
 * Build the DevTools view bound to a client context.
 * @param ctx - client root context (RPC face).
 * @param t - bound translate function.
 */
export declare function makeTraceView(ctx: ClientContext, t: Translate): import("react").NamedExoticComponent<ConvViewProps>;
