/**
 * Number/duration formatting helpers for the DevTools view.
 *
 * @module dsh-devtools/client/format
 */
/** Format a millisecond duration into a compact human-readable string. */
export declare function fmtMs(ms: number | undefined): string;
/** Format a timestamp (ms epoch) as HH:MM:SS. */
export declare function fmtTime(ms: number | undefined): string;
/** Format an integer count with grouping separators. */
export declare function fmtCount(n: number): string;
/** Format a rate (per second) as "12 tok/s" or a dash when unavailable. */
export declare function fmtRate(perSec: number | undefined): string;
/** Format a percentage (0-100) with one decimal, or a dash when unavailable. */
export declare function fmtPct(pct: number | undefined): string;
