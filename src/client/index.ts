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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and the
// conversation view ring slot merge (conversation.view).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { en, zh, type DevtoolsKey } from './locales.ts'
import { makeTraceView } from './trace-view.tsx'

/** Locale namespace this plugin owns. */
const NS = 'devtools'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'devtools': DevtoolsKey
  }
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['connection', 'slots', 'locale']

/**
 * Mount the DevTools view.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, 'zh', zh), 'devtools: zh dictionary')
  ctx.effect(() => ctx.locale.register(NS, 'en', en), 'devtools: en dictionary')
  const t = ctx.locale.bind(NS) as (key: keyof DevtoolsKey, params?: Record<string, string | number>) => string

  const DevToolsView = makeTraceView(ctx, t)
  ctx.slots.inject('conversation.view', () => {
    return ctx.slots.register(
      // order 30 renders right of Chat (0), Trajectory (10), Context (20).
      { name: 'conversation.view', id: 'devtools', order: 30, label: () => t('tab.label'), locale: NS },
      DevToolsView,
    )
  })
}
