/**
 * Browser-side API client for the /dsh-devtools RPC channel.
 *
 * Plain unary RPC through the generic Connection seam (the same channel the
 * Host half registers); no credentials ever appear in a request.
 *
 * The client Connection service is provided by @deepseek-ai/dsh-client-connection
 * at runtime; its browser face has no published Context type merge, so this
 * module declares the exact consumed surface (structural, matches the
 * runtime `ctx.connection.rpc` object).
 *
 * @module dsh-devtools/client/api
 */
import type { TraceSnapshot } from '../trace.ts';
/** The consumed browser RPC face (structural subset of ClientConnectionRpc). */
export interface DevtoolsRpcFace {
    call(channel: string, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<{
        ok: boolean;
        value?: unknown;
        error?: {
            code?: string;
            message?: string;
        };
    }>;
}
/**
 * Fetch the runtime trace for one session.
 * @param rpc - the client connection RPC face.
 * @param sessionId - the session whose trace is requested.
 * @returns the trace snapshot, or throws with the RPC error message.
 */
export declare function fetchTrace(rpc: DevtoolsRpcFace, sessionId: string): Promise<TraceSnapshot>;
