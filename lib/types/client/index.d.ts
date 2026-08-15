/**
 * dsh-devtools — Client half (installed package bundle entry).
 *
 * Registers a "DevTools" tab in the conversation view ring
 * (`conversation.view` slot, beside Chat/Trajectory/Context) and renders
 * the Agent Runtime Trace served by the Host half over the generic
 * Connection RPC channel `/dsh-devtools`: turn/step execution timeline,
 * model latency, tool-call durations, retries, and turn outcomes.
 *
 * @module dsh-devtools/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type DevtoolsKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'devtools': DevtoolsKey;
    }
}
/** Required services (fiber inject waiting — the runtime must be up first). */
export declare const inject: string[];
/**
 * Mount the DevTools view.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
