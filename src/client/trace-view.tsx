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

import { memo, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { StepWire, TraceSnapshot, TurnWire } from '../trace.ts'
import { fetchTrace } from './api.ts'
import type { DevtoolsRpcFace } from './api.ts'
import { fmtCount, fmtMs, fmtPct, fmtTime, fmtRate } from './format.ts'
import type { DevtoolsKey } from './locales.ts'
import {
  assignLanes,
  barGeometry,
  computeSummary,
  defaultOpen,
  stepSpans,
  summarizeTurn,
  timelineTicks,
  trackPct,
} from './derive.ts'
import type { TimelineTick } from './derive.ts'
import css from './devtools.module.css'

export type { TraceSnapshot, TurnWire } from '../trace.ts'

/** Bounded per-session snapshot cache (stale-while-revalidate). */
const CACHE_MAX = 10
const sessionCache = new Map<string, TraceSnapshot>()

function cacheGet(id: string): TraceSnapshot | undefined {
  return sessionCache.get(id)
}
function cachePut(id: string, snap: TraceSnapshot): void {
  sessionCache.set(id, snap)
  if (sessionCache.size > CACHE_MAX) {
    const oldest = sessionCache.keys().next().value
    if (oldest !== undefined) sessionCache.delete(oldest)
  }
}

type Translate = (key: keyof DevtoolsKey, params?: Record<string, string | number>) => string

/** Status badge class + label key. */
function statusOf(status: string): { cls: string; label: keyof DevtoolsKey } {
  switch (status) {
    case 'ok':
    case 'completed': return { cls: css.statusOk, label: 'status.ok' }
    case 'error': return { cls: css.statusError, label: 'status.error' }
    case 'aborted': return { cls: css.statusAborted, label: 'status.aborted' }
    case 'max-tokens': return { cls: css.statusMax, label: 'status.max-tokens' }
    case 'running': return { cls: css.statusRunning, label: 'status.running' }
    case 'blocked': return { cls: css.statusBlocked, label: 'status.blocked' }
    case 'interrupted': return { cls: css.statusBlocked, label: 'status.interrupted' }
    default: return { cls: css.statusUnknown, label: 'status.unknown' }
  }
}

/**
 * Build the DevTools view bound to a client context.
 * @param ctx - client root context (RPC face).
 * @param t - bound translate function.
 */
export function makeTraceView(ctx: ClientContext, t: Translate) {
  // The runtime provides ctx.connection.rpc (dsh-client-connection); its
  // browser face has no published Context merge, so read it structurally.
  const rpc = (ctx as unknown as { connection?: { rpc?: DevtoolsRpcFace } }).connection?.rpc

  return memo(function DevToolsView(props: ConvViewProps): JSX.Element {
    const sessionId = (props as { sessionId?: string }).sessionId
    const [data, setData] = useState<TraceSnapshot | null>(
      typeof sessionId === 'string' && sessionId !== '' ? cacheGet(sessionId) ?? null : null,
    )
    const [error, setError] = useState<string | null>(null)
    const dataRef = useRef<TraceSnapshot | null>(data)
    useEffect(() => { dataRef.current = data }, [data])
    const rootRef = useRef<HTMLDivElement>(null)

    /* Keep the turn ruler parked below the sticky status bar even when the
       bar wraps to two lines: measure its live height and publish the
       derived sticky top as a CSS variable (the stylesheet keeps a static
       single-line fallback for the first paint). */
    useEffect(() => {
      const rootEl = rootRef.current
      if (rootEl === null) return undefined
      const statusBarEl = rootEl.querySelector<HTMLElement>('[class*="statusBar"]')
      if (statusBarEl === null) return undefined
      const update = (): void => {
        const cs = getComputedStyle(rootEl)
        const top = parseFloat(cs.getPropertyValue('--devtools-statusbar-top')) || 8
        const h = statusBarEl.getBoundingClientRect().height
        rootEl.style.setProperty('--devtools-ruler-top', `${top + h + 4}px`)
      }
      update()
      const ro = new ResizeObserver(update)
      ro.observe(statusBarEl)
      return () => ro.disconnect()
    }, [data])

    useEffect(() => {
      if (typeof sessionId !== 'string' || sessionId === '' || rpc === undefined) return undefined
      let alive = true
      const load = (): void => {
        fetchTrace(rpc, sessionId).then((snap) => {
          if (!alive) return
          cachePut(sessionId, snap)
          setData(snap)
          setError(null)
        }).catch((err: unknown) => {
          if (alive && dataRef.current === null) {
            setError(err instanceof Error ? err.message : String(err))
          }
        })
      }
      load()
      const timerId = setInterval(() => {
        if (document.visibilityState !== 'hidden') load()
      }, 2000)
      const onVisible = (): void => { if (document.visibilityState === 'visible') load() }
      document.addEventListener('visibilitychange', onVisible)
      return () => {
        alive = false
        clearInterval(timerId)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }, [sessionId, rpc])

    if (error !== null && data === null) {
      return <div className={css.root}><div className={css.empty}>{t('tab.error')}{error}</div></div>
    }
    if (data === null) {
      return <div className={css.root}><div className={css.empty}>{t('tab.loading')}</div></div>
    }

    const { stats, turns, hooks, session } = data
    const meta = session.meta
    const summary = computeSummary(stats, turns)

    if (stats.steps === 0 && stats.turns === 0) {
      return (
        <div className={css.root}>
          <div className={css.empty}>
            <div className={css.emptyTitle}>{t('empty.title')}</div>
            <div className={css.emptyHint}>{t('empty.hint')}</div>
          </div>
          <div className={css.footer}>{t('footer.note')}</div>
        </div>
      )
    }

    return (
      <div className={css.root} ref={rootRef}>
        <StatusBar stats={stats} turns={turns} summary={summary} t={t} />

        {/* session metadata + trace completeness (quiet when complete, loud when partial) */}
        <div className={css.metaRow}>
          <span className={`${css.traceStatus} ${data.droppedSteps > 0 ? css.traceStatusPartial : ''}`}>
            <span className={css.traceDot} aria-hidden="true" />
            {data.droppedSteps > 0 ? t('trace.partial', { count: data.droppedSteps }) : t('trace.complete')}
          </span>
          {meta.model !== undefined ? <span className={css.metaChip}><b>{t('meta.model')}</b> {meta.model}</span> : null}
          {meta.provider !== undefined ? <span className={css.metaChip}><b>{t('meta.provider')}</b> {meta.provider}</span> : null}
          {meta.contextWindow !== undefined
            ? <span className={css.metaChip}><b>{t('meta.window')}</b> {fmtCount(meta.contextWindow)}</span>
            : null}
          {meta.subagent !== undefined
            ? <span className={css.metaChip}><b>{t('meta.subagent')}</b> {meta.subagent.label ?? meta.subagent.mode ?? '?'}</span>
            : null}
        </div>

        {/* summary groups */}
        <div className={css.summaryGroups}>
          <SummaryCard title={t('summary.execution')}>
            {stat(t('stats.turns'), fmtCount(summary.execution.turns))}
            {stat(t('stats.steps'), fmtCount(summary.execution.steps),
              summary.execution.stepsRunning > 0 || summary.execution.stepsPending > 0
                ? t('stats.stepsDetail', {
                  completed: summary.execution.stepsCompleted,
                  running: summary.execution.stepsRunning,
                })
                : undefined,
              t('tip.stepsDetail'))}
            {stat(t('stats.toolCalls'), fmtCount(summary.execution.toolCalls),
              summary.execution.toolErrors > 0 ? `${summary.execution.toolErrors} ${t('stats.toolErrors')}` : undefined)}
            {stat(t('stats.retries'), fmtCount(summary.execution.retries))}
            {stat(t('stats.errors'), fmtCount(summary.execution.stepErrors),
              summary.execution.turnErrors > 0 || summary.execution.toolErrors > 0
                ? `turn ${summary.execution.turnErrors} · tool ${summary.execution.toolErrors}`
                : undefined,
              t('tip.errors'))}
            {stat(t('stats.interrupted'), fmtCount(summary.execution.turnInterrupted), undefined, t('tip.interrupted'))}
          </SummaryCard>

          <SummaryCard title={t('summary.performance')}>
            {stat(t('stats.modelWall'), fmtMs(summary.performance.modelMs), undefined, t('tip.modelWall'))}
            {stat(t('stats.toolWall'), fmtMs(summary.performance.toolMs), undefined, t('tip.toolWall'))}
            {stat(t('stats.avgFirst'), fmtMs(summary.performance.avgFirstMs), undefined, t('tip.avgFirst'))}
            {stat(t('stats.wallTime'), fmtMs(summary.performance.wallMs), undefined, t('tip.wallTime'))}
            {stat(t('stats.decode'), fmtMs(summary.performance.decodeMs), undefined, t('tip.decode'))}
            {stat(t('stats.throughput'), fmtRate(summary.performance.throughputPerSec), undefined, t('tip.throughput'))}
          </SummaryCard>

          <SummaryCard title={t('summary.tokens')}>
            {stat(t('stats.input'), fmtCount(summary.tokens.input))}
            {stat(t('stats.output'), fmtCount(summary.tokens.output))}
            {stat(t('stats.cacheRead'), fmtCount(summary.tokens.cacheRead))}
            {stat(t('stats.reasoning'), fmtCount(summary.tokens.reasoning))}
            {stat(t('stats.cacheReuse'), fmtPct(summary.tokens.cacheReusePct), undefined, t('tip.cacheReuse'))}
          </SummaryCard>
        </div>

        {/* turn / step timeline */}
        <div className={css.turns} key={session.id}>
          {turns.map((turn, idx) => (
            <TurnCard key={turn.seq} turn={turn} t={t} defaultOpen={defaultOpen(turn, idx, turns.length)} />
          ))}
        </div>

        {/* hooks */}
        <div className={css.card}>
          <div className={css.cardTitle}>{t('hooks.title')}</div>
          {hooks.length === 0
            ? (
              <div className={css.hooksNone}>
                <div>{t('hooks.none')}</div>
                <div className={css.hooksNoneHint}>{t('hooks.noneHint')}</div>
              </div>
            )
            : (
              <div className={css.hookTable}>
                {hooks.map((hook) => (
                  <div key={hook.seq} className={css.hookRow}>
                    <span className={css.hookName}>{hook.name ?? `hook#${hook.seq}`}</span>
                    {hook.plugin !== undefined ? <span className={css.hookPlugin}>{hook.plugin}</span> : null}
                    <span className={css.hookTime}>{fmtTime(hook.at)}</span>
                    <span className={css.hookDur}>{fmtMs(hook.durationMs)}</span>
                    {hook.error === true ? <span className={css.hookErr}>ERR</span> : null}
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className={css.footer}>{t('footer.note')}</div>
      </div>
    )
  })
}

/* ------------------------------------------------------------------ */
/* Stat primitives                                                     */
/* ------------------------------------------------------------------ */

function stat(label: string, value: string, sub?: string, tip?: string): JSX.Element {
  return (
    <div className={css.stat} title={tip}>
      <b className={css.statValue}>{value}</b>
      <span className={css.statLabel}>{label}</span>
      {sub !== undefined ? <span className={css.statSub}>{sub}</span> : null}
    </div>
  )
}

/** One of the three summary group cards. */
function SummaryCard(props: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className={css.summaryCard}>
      <div className={css.summaryTitle}>{props.title}</div>
      <div className={css.statsGrid}>{props.children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sticky runtime status bar                                           */
/* ------------------------------------------------------------------ */

function StatusBar(props: {
  stats: TraceSnapshot['stats']
  turns: readonly TurnWire[]
  summary: ReturnType<typeof computeSummary>
  t: Translate
}): JSX.Element | null {
  const { stats, turns, summary, t } = props
  const last = turns.length > 0 ? turns[turns.length - 1] : undefined
  const turnNo = last !== undefined ? last.turn : 0
  const stepNo = last !== undefined ? last.steps.length : 0
  const reuse = summary.tokens.cacheReusePct
  return (
    <div className={css.statusBar}>
      <span className={css.statusBarItem}>
        <b>{t('stats.turns')}</b> {fmtCount(stats.turns)}
        <span className={css.statusBarSep}>·</span>
        <b>{t('stats.steps')}</b> {fmtCount(stats.steps)}
        {turnNo > 0 ? <span className={css.statusBarSep}>·</span> : null}
        {turnNo > 0 ? <span className={css.statusBarLive}>{t('statusbar.turnStep', { turn: turnNo, step: stepNo })}</span> : null}
      </span>
      <span className={css.statusBarItem}>
        <b>{t('stats.modelWall')}</b> {fmtMs(summary.performance.modelMs)}
      </span>
      <span className={css.statusBarItem}>
        <b>{t('stats.toolWall')}</b> {fmtMs(summary.performance.toolMs)}
      </span>
      <span className={`${css.statusBarItem} ${css.statusBarSec}`}>
        <b>{t('stats.avgFirst')}</b> {fmtMs(summary.performance.avgFirstMs)}
      </span>
      <span className={`${css.statusBarItem} ${css.statusBarSec}`}>
        <b>{t('stats.throughput')}</b> {fmtRate(summary.performance.throughputPerSec)}
      </span>
      <span className={`${css.statusBarItem} ${css.statusBarSec}`}>
        <b>{t('stats.cacheReuse')}</b> {fmtPct(reuse)}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Turn card with collapse/expand                                      */
/* ------------------------------------------------------------------ */

/** One turn card with its steps. Collapse state is local and survives
 * polling refreshes; the `key` on the turns container resets it on session
 * switch. */
function TurnCard(props: { turn: TurnWire; t: Translate; defaultOpen: boolean }): JSX.Element {
  const { turn, t } = props
  const [collapsed, setCollapsed] = useState(!props.defaultOpen)
  const open = turn.reason === undefined
  const reasonCls = turn.reason !== undefined ? statusOf(turn.reason.kind).cls : css.statusRunning
  const sum = summarizeTurn(turn)
  const win = turnWindow(turn)
  const ticks = timelineTicks(win.tMin, win.tMax)
  return (
    <div className={css.card}>
      <div
        className={`${css.turnHeader} ${collapsed ? css.turnHeaderCollapsed : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(!collapsed) } }}
      >
        <span className={`${css.chevron} ${collapsed ? '' : css.chevronOpen}`} />
        <span className={css.turnTitle}>{t('turn.title')} {turn.turn}</span>
        {open
          ? <span className={`${css.badge} ${css.statusRunning}`}>{t('turn.open')}</span>
          : (
            <span className={`${css.badge} ${reasonCls}`}>
              {turn.reason?.kind ?? 'unknown'}
            </span>
          )}
        <span className={css.turnMeta} title={t('tip.turnTools')}>
          {t('turn.steps')} {sum.steps} · {t('turn.tools')} {sum.toolCalls}
        </span>
        {sum.wallMs !== undefined
          ? <span className={css.turnDur}>{fmtMs(sum.wallMs)}</span>
          : null}
      </div>
      {turn.reason?.detail !== undefined
        ? (
          <div className={`${css.turnDetailLine} ${turn.reason.kind === 'error' ? css.turnDetailLineError : ''}`} title={turn.reason.detail}>
            {turn.reason.detail}
          </div>
        )
        : null}
      {!collapsed
        ? (
          <div className={css.steps}>
            {ticks.length > 0
              ? (
                <div className={css.turnRuler}>
                  <div className={css.turnRulerTrack}>
                    {ticks.map((tick, i) => {
                      const first = i === 0
                      const last = i === ticks.length - 1
                      return (
                        <span
                          key={tick.at}
                          className={`${css.timelineTick} ${first ? css.timelineTickFirst : ''} ${last ? css.timelineTickLast : ''}`}
                          style={{ left: `${trackPct(tick.at, win.tMin, win.tMax)}%` }}
                        >
                          {tick.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
              : null}
            {turn.steps.map((step) => (
              <StepRow key={step.seq} step={step} t={t} window={win} ticks={ticks} />
            ))}
          </div>
        )
        : null}
    </div>
  )
}

/** Absolute [tMin, tMax] of a turn's known activity, for shared bar scaling. */
function turnWindow(turn: TurnWire): { tMin: number; tMax: number } {
  let tMin = turn.startAt
  let tMax = turn.startAt
  if (turn.endAt !== undefined) tMax = Math.max(tMax, turn.endAt)
  for (const s of turn.steps) {
    tMin = Math.min(tMin, s.startAt)
    if (s.endAt !== undefined) tMax = Math.max(tMax, s.endAt)
    for (const tool of s.tools) {
      tMax = Math.max(tMax, tool.callAt, tool.resultAt ?? tool.callAt)
    }
  }
  return { tMin, tMax }
}

/* ------------------------------------------------------------------ */
/* Step row with runtime timeline                                      */
/* ------------------------------------------------------------------ */

/** One step row: outcome, latency, usage, tools, retries + duration bars. */
function StepRow(props: {
  step: StepWire
  t: Translate
  window: { tMin: number; tMax: number }
  ticks: readonly TimelineTick[]
}): JSX.Element {
  const { step, t, ticks } = props
  const win = props.window
  const st = statusOf(step.status)
  const running = step.status === 'running'
  const spans = stepSpans(step, win.tMax)
  const lanes = assignLanes(spans)
  const spanMax = win.tMax > win.tMin ? win.tMax : win.tMin + 1
  const pct = (at: number): number => trackPct(at, win.tMin, win.tMax)
  return (
    <div className={`${css.step} ${running ? css.stepRunning : ''}`}>
      <div className={css.stepHead}>
        <span className={css.stepId}>S{step.step}</span>
        <span className={`${css.badge} ${st.cls}`}>{t(st.label)}</span>
        {step.error !== undefined ? <span className={css.stepErr} title={step.error.message}>{step.error.code}</span> : null}
        {step.model !== undefined ? <span className={css.stepModel} title={step.model}>{step.model}</span> : null}
        <span className={css.stepTime}>{fmtTime(step.startAt)}</span>
        <span className={css.stepDur}>{fmtMs(step.wallMs)}</span>
      </div>

      {lanes.length > 0
        ? (
          <div className={css.timeline}>
            <div className={css.timelineBody}>
              {ticks.length > 0
                ? (
                  <div className={css.timelineGrid} aria-hidden="true">
                    {ticks.map((tick) => (
                      <span key={tick.at} className={css.timelineGridLine} style={{ left: `${pct(tick.at)}%` }} />
                    ))}
                  </div>
                )
                : null}
              {lanes.map(({ span: s, lane }) => {
                const g = barGeometry(s.start, s.end, win.tMin, spanMax)
                const label = s.kind === 'model'
                  ? `${t('step.model')} ${fmtMs(s.durationMs)}`
                  : `${s.toolName ?? '?'} ${fmtMs(s.durationMs)}`
                const tip = s.kind === 'model'
                  ? `${t('step.model')} ${fmtMs(s.durationMs)}${s.running ? ` (${t('status.running')})` : ''}`
                  : `${s.toolName ?? '?'} ${fmtMs(s.durationMs)}${s.running ? ` (${t('status.running')})` : ''}${s.error ? ' ERR' : ''}`
                return (
                  <div className={css.timelineLane} key={s.id}>
                    <div
                      className={[
                        css.timelineBar,
                        s.kind === 'model' ? css.barModel : css.barTool,
                        s.error ? css.barError : '',
                        s.running ? css.barRunning : '',
                      ].join(' ')}
                      style={{ left: `${g.leftPct}%`, width: `${g.widthPct}%` }}
                      title={tip}
                    >
                      <span className={css.barLabel}>{label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
        : null}

      <div className={css.stepLat}>
        <span className={css.latCell} title={t('tip.ttft')}><b>{t('step.ttft')}</b> {fmtMs(step.ttftMs)}</span>
        <span className={css.latCell} title={t('tip.modelWall')}><b>{t('step.model')}</b> {fmtMs(step.modelMs)}</span>
        <span className={css.latCell} title={t('tip.decode')}><b>{t('step.decode')}</b> {fmtMs(step.decodeMs)}</span>
        {step.usage !== undefined
          ? (
            <span className={css.latCell}>
              <b>{t('stats.input')}</b> {fmtCount(step.usage.inputTokens ?? 0)}
              {step.usage.cacheReadTokens !== undefined ? ` / ${t('stats.cacheRead')} ${fmtCount(step.usage.cacheReadTokens)}` : ''}
              {' · '}{t('stats.output')} {fmtCount(step.usage.outputTokens ?? 0)}
              {step.usage.reasoningTokens !== undefined && step.usage.reasoningTokens > 0 ? ` / ${t('stats.reasoning')} ${fmtCount(step.usage.reasoningTokens)}` : ''}
            </span>
          )
          : null}
      </div>
      {step.tools.length > 0
        ? (
          <div className={css.tools}>
            {step.tools.map((tool) => (
              <span key={tool.callId} className={`${css.toolChip} ${tool.error !== undefined || tool.isError === true ? css.toolChipErr : ''}`}>
                {tool.name}
                {tool.durationMs !== undefined ? <em>{fmtMs(tool.durationMs)}</em> : <em>…</em>}
                {tool.error !== undefined ? <b>{tool.error.code ?? 'ERR'}</b> : null}
                {tool.isError === true ? <b>ERR</b> : null}
              </span>
            ))}
          </div>
        )
        : null}
      {step.retries.length > 0
        ? (
          <div className={css.retries}>
            {step.retries.map((r, i) => (
              <span key={i} className={css.retryChip}>
                {t('step.retries')} {r.retry}/{r.maxRetries}{r.code !== undefined ? ` ${r.code}` : ''}{r.delayMs !== undefined ? ` +${Math.round(r.delayMs)}ms` : ''}
              </span>
            ))}
          </div>
        )
        : null}
      {step.assistantAt === undefined && step.status !== 'running'
        ? <div className={css.noMsg}>{t('step.noMessage')}</div>
        : null}
    </div>
  )
}
