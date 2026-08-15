/**
 * Number/duration formatting helpers for the DevTools view.
 *
 * @module dsh-devtools/client/format
 */

/** Format a millisecond duration into a compact human-readable string. */
export function fmtMs(ms: number | undefined): string {
  if (ms === undefined) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m${s}s`
}

/** Format a timestamp (ms epoch) as HH:MM:SS. */
export function fmtTime(ms: number | undefined): string {
  if (ms === undefined) return '—'
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** Format an integer count with grouping separators. */
export function fmtCount(n: number): string {
  return n.toLocaleString('en-US')
}

/** Format a rate (per second) as "12 tok/s" or a dash when unavailable. */
export function fmtRate(perSec: number | undefined): string {
  if (perSec === undefined || !Number.isFinite(perSec)) return '—'
  return `${Math.round(perSec)} tok/s`
}

/** Format a percentage (0-100) with one decimal, or a dash when unavailable. */
export function fmtPct(pct: number | undefined): string {
  if (pct === undefined || !Number.isFinite(pct)) return '—'
  return `${pct.toFixed(1)}%`
}
