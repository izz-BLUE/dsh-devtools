window.__ModuleLoader__.load({
	id: "dsh-devtools",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		const zh = {
			"tab.label": "DevTools",
			"tab.loading": "正在加载执行轨迹…",
			"tab.error": "加载失败：",
			"summary.execution": "执行",
			"summary.performance": "性能",
			"summary.tokens": "Token",
			"stats.turns": "Turns",
			"stats.steps": "Steps",
			"stats.stepsDetail": "{completed} 已完成 · {running} 进行中",
			"stats.errors": "错误",
			"stats.aborted": "中断",
			"stats.maxTokens": "超限",
			"stats.retries": "重试",
			"stats.toolCalls": "工具调用",
			"stats.toolErrors": "工具错误",
			"stats.turnErrors": "Turn 错误",
			"stats.interrupted": "中断 / 中止",
			"stats.modelWall": "Model Wall",
			"stats.toolWall": "Tool Wall",
			"stats.avgFirst": "平均首活动",
			"stats.wallTime": "总时长",
			"stats.decode": "解码",
			"stats.throughput": "吞吐",
			"stats.input": "输入",
			"stats.output": "输出",
			"stats.cacheRead": "缓存读",
			"stats.reasoning": "推理",
			"stats.cacheReuse": "缓存复用",
			"meta.model": "模型",
			"meta.provider": "Provider",
			"meta.window": "上下文窗口",
			"meta.subagent": "子代理",
			"meta.cwd": "工作目录",
			"trace.complete": "Trace 完整",
			"trace.partial": "部分 Trace · 已省略更早的 {count} 个步骤",
			"turn.title": "Turn",
			"turn.reason": "结束",
			"turn.steps": "步骤",
			"turn.tools": "工具",
			"turn.open": "进行中",
			"turn.wall": "Wall",
			"step.ttft": "TTFT",
			"step.model": "模型",
			"step.decode": "解码",
			"step.wall": "总时长",
			"step.tools": "工具",
			"step.retries": "重试",
			"step.noMessage": "无模型输出",
			"status.ok": "完成",
			"status.error": "错误",
			"status.aborted": "中断",
			"status.max-tokens": "超限",
			"status.running": "进行中",
			"status.blocked": "阻塞",
			"status.interrupted": "中断",
			"status.unknown": "未知",
			"hooks.title": "Hook 执行",
			"hooks.none": "当前会话未记录 Hook Trace 事件。",
			"hooks.noneHint": "Hook 事件的生产取决于当前 Harness / 插件组合。",
			"hooks.plugin": "插件",
			"hooks.duration": "耗时",
			"empty.title": "暂无执行轨迹",
			"empty.hint": "向该会话发送消息后，这里将展示 Turn / Step 执行时间线。",
			"footer.note": "只读观测：数据来自 durable session log，未修改任何行为。",
			"tip.ttft": "从 step/start 到首个持久化 block-start 的时间（非 Provider 官方上报的 TTFT）。",
			"tip.modelWall": "模型侧 Wall 时间：assistantAt - startAt 之和（仅统计有模型输出的步骤）。",
			"tip.toolWall": "Measured from tool/call to tool/result. Includes any time between invocation and result.",
			"tip.avgFirst": "各步骤 TTFT（step/start 到首个持久化 block-start）的平均值。",
			"tip.decode": "assistantAt - firstChunkAt 之和（仅统计有完整流式区间的步骤）。",
			"tip.wallTime": "会话 Wall 时间：最后结束时间 - 最早开始时间。",
			"tip.throughput": "输出 Token / 会话 Wall 秒数。",
			"tip.cacheReuse": "缓存复用率 = 缓存读 / (输入 + 缓存读)。为内部派生指标，非 Provider 官方缓存命中率。",
			"tip.errors": "步骤级错误为 step status = error；Turn 级错误为 turn/end reason = error；工具错误为 tool/result 失败。三者独立统计，不混淆。",
			"tip.interrupted": "统计对象为 Turn：turn/end reason 为 aborted 或 interrupted。",
			"tip.stepsDetail": "Steps 为保留窗口内的步骤总数；completed 为已结束步骤；running 为进行中；其余为待定。",
			"tip.turnTools": "该 Turn 内的工具调用次数。",
			"statusbar.turnStep": "Turn {turn} · Step {step}"
		};
		const en = {
			"tab.label": "DevTools",
			"tab.loading": "Loading runtime trace…",
			"tab.error": "Failed to load: ",
			"summary.execution": "Execution",
			"summary.performance": "Performance",
			"summary.tokens": "Tokens",
			"stats.turns": "Turns",
			"stats.steps": "Steps",
			"stats.stepsDetail": "{completed} completed · {running} running",
			"stats.errors": "Errors",
			"stats.aborted": "Aborted",
			"stats.maxTokens": "Max tokens",
			"stats.retries": "Retries",
			"stats.toolCalls": "Tool calls",
			"stats.toolErrors": "Tool errors",
			"stats.turnErrors": "Turn errors",
			"stats.interrupted": "Interrupted / Aborted",
			"stats.modelWall": "Model Wall",
			"stats.toolWall": "Tool Wall",
			"stats.avgFirst": "Avg First Activity",
			"stats.wallTime": "Wall Time",
			"stats.decode": "Decode",
			"stats.throughput": "Throughput",
			"stats.input": "Input",
			"stats.output": "Output",
			"stats.cacheRead": "Cache read",
			"stats.reasoning": "Reasoning",
			"stats.cacheReuse": "Cache reuse",
			"meta.model": "Model",
			"meta.provider": "Provider",
			"meta.window": "Context window",
			"meta.subagent": "Subagent",
			"meta.cwd": "Workspace",
			"trace.complete": "Trace complete",
			"trace.partial": "Partial trace · {count} earlier steps omitted",
			"turn.title": "Turn",
			"turn.reason": "Ended",
			"turn.steps": "Steps",
			"turn.tools": "Tools",
			"turn.open": "Running",
			"turn.wall": "Wall",
			"step.ttft": "TTFT",
			"step.model": "Model",
			"step.decode": "Decode",
			"step.wall": "Wall",
			"step.tools": "Tools",
			"step.retries": "Retries",
			"step.noMessage": "no model output",
			"status.ok": "ok",
			"status.error": "error",
			"status.aborted": "aborted",
			"status.max-tokens": "max tokens",
			"status.running": "running",
			"status.blocked": "blocked",
			"status.interrupted": "interrupted",
			"status.unknown": "unknown",
			"hooks.title": "Hook executions",
			"hooks.none": "No hook trace events recorded.",
			"hooks.noneHint": "Hook event production depends on the active Harness/plugin composition.",
			"hooks.plugin": "Plugin",
			"hooks.duration": "Duration",
			"empty.title": "No runtime trace yet",
			"empty.hint": "Send a message in this session and the Turn / Step execution timeline appears here.",
			"footer.note": "Read-only observability: data comes from the durable session log; nothing is modified.",
			"tip.ttft": "Derived from step start to the first persisted block-start event.",
			"tip.modelWall": "Sum of model-side wall time (assistantAt - startAt) over steps with an assistant message.",
			"tip.toolWall": "Measured from tool/call to tool/result. Includes any time between invocation and result.",
			"tip.avgFirst": "Mean TTFT (step/start to first persisted block-start) across steps.",
			"tip.decode": "Sum of assistantAt - firstChunkAt over steps with a full stream window.",
			"tip.wallTime": "Session wall: last end time - first start time.",
			"tip.throughput": "Output tokens per session-wall second.",
			"tip.cacheReuse": "Cache reuse = cache read / (input + cache read). Internal derived figure, not the provider official cache hit rate.",
			"tip.errors": "Step errors count step status = error; turn errors count turn/end reason = error; tool errors count failed tool results. Kept separate on purpose.",
			"tip.interrupted": "Counts turns whose turn/end reason is aborted or interrupted.",
			"tip.stepsDetail": "Steps is the total in the retained window; completed counts closed steps; running counts in-flight; the rest are pending.",
			"tip.turnTools": "Tool calls inside this turn.",
			"statusbar.turnStep": "Turn {turn} · Step {step}"
		};
		//#endregion
		//#region src/client/api.ts
		/**
		* Fetch the runtime trace for one session.
		* @param rpc - the client connection RPC face.
		* @param sessionId - the session whose trace is requested.
		* @returns the trace snapshot, or throws with the RPC error message.
		*/
		async function fetchTrace(rpc, sessionId) {
			const res = await rpc.call("/dsh-devtools", "trace", { sessionId });
			if (res.ok && res.value !== void 0) return res.value;
			throw new Error(res.error?.message ?? res.error?.code ?? "rpc failed");
		}
		//#endregion
		//#region src/client/format.ts
		/**
		* Number/duration formatting helpers for the DevTools view.
		*
		* @module dsh-devtools/client/format
		*/
		/** Format a millisecond duration into a compact human-readable string. */
		function fmtMs(ms) {
			if (ms === void 0) return "—";
			if (ms < 1e3) return `${Math.round(ms)}ms`;
			if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
			return `${Math.floor(ms / 6e4)}m${Math.round(ms % 6e4 / 1e3)}s`;
		}
		/** Format a timestamp (ms epoch) as HH:MM:SS. */
		function fmtTime(ms) {
			if (ms === void 0) return "—";
			const d = new Date(ms);
			const p = (n) => String(n).padStart(2, "0");
			return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
		}
		/** Format an integer count with grouping separators. */
		function fmtCount(n) {
			return n.toLocaleString("en-US");
		}
		/** Format a rate (per second) as "12 tok/s" or a dash when unavailable. */
		function fmtRate(perSec) {
			if (perSec === void 0 || !Number.isFinite(perSec)) return "—";
			return `${Math.round(perSec)} tok/s`;
		}
		/** Format a percentage (0-100) with one decimal, or a dash when unavailable. */
		function fmtPct(pct) {
			if (pct === void 0 || !Number.isFinite(pct)) return "—";
			return `${pct.toFixed(1)}%`;
		}
		//#endregion
		//#region src/client/derive.ts
		/** Count steps by outcome semantics (completed = anything closed). */
		function countStepStatuses(steps) {
			let completed = 0;
			let running = 0;
			let pending = 0;
			for (const s of steps) if (s.status === "running") running++;
			else if (s.status === "unknown") pending++;
			else completed++;
			return {
				total: steps.length,
				completed,
				running,
				pending
			};
		}
		/**
		* Cache reuse ratio — an internal, derived figure.
		* cacheRead / (input + cacheRead). Undefined when the denominator is 0.
		* This is NOT the provider's official cache hit rate.
		*/
		function cacheReuse(input, cacheRead) {
			const denom = input + cacheRead;
			if (!Number.isFinite(denom) || denom <= 0) return void 0;
			const r = cacheRead / denom;
			return Number.isFinite(r) ? r : void 0;
		}
		/** Mean step TTFT over steps that persisted a block-start. */
		function meanFirstActivity(steps) {
			let sum = 0;
			let n = 0;
			for (const s of steps) if (s.ttftMs !== void 0) {
				sum += s.ttftMs;
				n++;
			}
			return n === 0 ? void 0 : sum / n;
		}
		/** Summed decode time over steps that have it. */
		function sumDecode(steps) {
			let sum = 0;
			let n = 0;
			for (const s of steps) if (s.decodeMs !== void 0) {
				sum += s.decodeMs;
				n++;
			}
			return n === 0 ? void 0 : sum;
		}
		/** Session wall time from the stats window, when both edges exist. */
		function sessionWall(stats) {
			if (stats.startedAt === void 0 || stats.endedAt === void 0) return void 0;
			return Math.max(0, stats.endedAt - stats.startedAt);
		}
		/** Compute the three summary groups from the wire snapshot. */
		function computeSummary(stats, turns) {
			const steps = turns.flatMap((t) => t.steps);
			const stepCounts = countStepStatuses(steps);
			let turnErrors = 0;
			let turnInterrupted = 0;
			for (const t of turns) {
				const kind = t.reason?.kind;
				if (kind === "error") turnErrors++;
				else if (kind === "aborted" || kind === "interrupted") turnInterrupted++;
			}
			const wall = sessionWall(stats);
			const tokens = stats.outputTokens;
			const throughput = wall !== void 0 && wall > 0 ? tokens / (wall / 1e3) : void 0;
			const avgFirst = meanFirstActivity(steps);
			const decode = sumDecode(steps);
			const reuse = cacheReuse(stats.inputTokens, stats.cacheReadTokens);
			return {
				execution: {
					turns: stats.turns,
					steps: stepCounts.total,
					stepsCompleted: stepCounts.completed,
					stepsRunning: stepCounts.running,
					stepsPending: stepCounts.pending,
					toolCalls: stats.toolCalls,
					toolErrors: stats.toolErrors,
					retries: stats.retries,
					stepErrors: stats.errors,
					turnErrors,
					turnInterrupted,
					maxTokens: stats.maxTokens
				},
				performance: {
					modelMs: stats.modelMs,
					toolMs: stats.toolMs,
					...avgFirst === void 0 ? {} : { avgFirstMs: avgFirst },
					...wall === void 0 ? {} : { wallMs: wall },
					...decode === void 0 ? {} : { decodeMs: decode },
					...throughput !== void 0 && Number.isFinite(throughput) ? { throughputPerSec: throughput } : {}
				},
				tokens: {
					input: stats.inputTokens,
					output: stats.outputTokens,
					cacheRead: stats.cacheReadTokens,
					reasoning: stats.reasoningTokens,
					...reuse === void 0 ? {} : { cacheReusePct: reuse * 100 }
				}
			};
		}
		/** Minimum visible bar width as a fraction of the full track (e.g. 0.004). */
		const MIN_BAR_FRACTION = .004;
		/**
		* Slice a step into absolute-time activity spans:
		* one model span [startAt, assistantAt] plus one span per tool call
		* [callAt, resultAt]. In-flight spans extend to `tMax` (the current visible
		* window edge) so a running model/tool is still visible.
		*/
		function stepSpans(step, tMax) {
			const spans = [];
			const running = step.status === "running";
			if (step.assistantAt !== void 0) spans.push({
				id: `m${step.seq}`,
				kind: "model",
				start: step.startAt,
				end: step.assistantAt,
				durationMs: Math.max(0, step.assistantAt - step.startAt)
			});
			else if (running && step.firstChunkAt !== void 0) spans.push({
				id: `m${step.seq}`,
				kind: "model",
				start: step.startAt,
				end: Math.max(tMax, step.startAt),
				durationMs: Math.max(0, tMax - step.startAt),
				running: true
			});
			for (const tool of step.tools) {
				const end = tool.resultAt ?? Math.max(tMax, tool.callAt);
				spans.push({
					id: `t${tool.callId}`,
					kind: "tool",
					start: tool.callAt,
					end,
					durationMs: tool.durationMs ?? Math.max(0, end - tool.callAt),
					toolName: tool.name,
					error: tool.error !== void 0 || tool.isError === true,
					running: tool.resultAt === void 0
				});
			}
			return spans;
		}
		/**
		* Greedy interval partitioning into lanes so parallel tool calls render side
		* by side instead of being stacked serially. Returns the lane index per span.
		*/
		function assignLanes(spans) {
			const sorted = [...spans].sort((a, b) => a.start - b.start);
			const laneEnds = [];
			const out = [];
			for (const span of sorted) {
				let lane = laneEnds.findIndex((end) => end <= span.start);
				if (lane === -1) {
					lane = laneEnds.length;
					laneEnds.push(span.end);
				} else laneEnds[lane] = span.end;
				out.push({
					span,
					lane
				});
			}
			return out;
		}
		/**
		* Map an absolute [start, end] onto the [tMin, tMax] track as percentages.
		* Degenerate tracks (tMax === tMin) yield a full-width bar; bars shorter
		* than MIN_BAR_FRACTION are clamped to stay visible.
		*/
		function barGeometry(start, end, tMin, tMax) {
			const span = Math.max(0, tMax - tMin);
			if (span === 0) return {
				leftPct: 0,
				widthPct: 100
			};
			const left = Math.max(0, Math.min(100, (start - tMin) / span * 100));
			const rawWidth = Math.max(0, Math.min(100 - left, (end - start) / span * 100));
			return {
				leftPct: left,
				widthPct: Math.max(rawWidth, Math.min(MIN_BAR_FRACTION * 100, 100 - left))
			};
		}
		function summarizeTurn(turn) {
			let toolCalls = 0;
			for (const s of turn.steps) toolCalls += s.tools.length;
			return {
				steps: turn.steps.length,
				toolCalls,
				...turn.endAt === void 0 ? {} : { wallMs: Math.max(0, turn.endAt - turn.startAt) },
				running: turn.reason === void 0,
				...turn.reason === void 0 ? {} : { reason: turn.reason.kind }
			};
		}
		/** Default fold policy: the running turn and the newest turn stay open. */
		function defaultOpen(turn, idx, len) {
			return turn.reason === void 0 || idx === len - 1;
		}
		//#endregion
		//#region \0dsh-css:packages/dsh-devtools/src/client/devtools.module.css.mjs
		const css = ".sThFIq_root{box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-menu,var(--dsw-alias-bg-base,transparent));border:1px solid var(--dsw-alias-border-l2);backdrop-filter:blur(10px)saturate(1.15);border-radius:14px;flex-direction:column;gap:12px;width:100%;max-width:clamp(680px,100vw - 48px,1720px);margin:0 auto;padding:16px clamp(16px,3vw,40px) 48px;display:flex}.sThFIq_empty{border:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-tertiary);text-align:center;border-radius:12px;padding:32px 24px;font-size:13px;line-height:22px}.sThFIq_emptyTitle{color:var(--dsw-alias-label-primary);margin-bottom:6px;font-size:15px;font-weight:600}.sThFIq_emptyHint{color:var(--dsw-alias-label-tertiary);font-size:12px}.sThFIq_footer{color:var(--dsw-alias-label-tertiary);text-align:center;font-size:11px;line-height:18px}.sThFIq_statusBar{background:var(--dsw-specific-menu,var(--dsw-alias-bg-base,transparent));border:1px solid var(--dsw-alias-border-l2);z-index:20;backdrop-filter:blur(10px);border-radius:10px;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:6px 12px;font-size:11px;line-height:18px;display:flex;position:sticky;top:8px;box-shadow:0 2px 12px #0000002e}.sThFIq_statusBarItem{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}.sThFIq_statusBarItem b{color:var(--dsw-alias-label-tertiary);margin-right:4px;font-weight:500}.sThFIq_statusBarSep{color:var(--dsw-alias-border-l3);margin:0 7px}.sThFIq_statusBarLive{color:var(--dsw-static-blue-500,#0091ff);font-weight:600}@media (width<=900px){.sThFIq_statusBarSec{display:none}}.sThFIq_banner{border-radius:8px;padding:4px 10px;font-size:11px;font-weight:600;line-height:18px}.sThFIq_bannerFull{background:var(--dsw-static-green-500,#30a46c);color:#fff}.sThFIq_bannerPartial{background:var(--dsw-static-orange-500,#f76b15);color:#fff}.sThFIq_metaRow{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.sThFIq_metaChip{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);border-radius:6px;padding:2px 8px;font-size:11px;line-height:18px}.sThFIq_metaChip b{color:var(--dsw-alias-label-tertiary);margin-right:4px;font-weight:500}.sThFIq_summaryGroups{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;display:grid}@media (width<=1280px){.sThFIq_summaryGroups{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}}@media (width<=700px){.sThFIq_summaryGroups{grid-template-columns:minmax(0,1fr)}}.sThFIq_summaryCard{border:1px solid var(--dsw-alias-border-l3);border-radius:12px;overflow:hidden}.sThFIq_summaryTitle{background:var(--dsw-alias-interactive-bg-hover);border-bottom:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);padding:8px 12px;font-size:12px;font-weight:600;line-height:20px}.sThFIq_statsGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;display:grid}@media (width>=1500px){.sThFIq_statsGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}.sThFIq_stat{background:var(--dsw-specific-menu,var(--dsw-alias-bg-base,transparent));flex-direction:column;gap:2px;padding:8px 10px;display:flex}.sThFIq_statLabel{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.04em;font-size:10px;line-height:14px}.sThFIq_statValue{font-variant-numeric:tabular-nums;font-size:15px;font-weight:600;line-height:20px}.sThFIq_statSub{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px}.sThFIq_card{border:1px solid var(--dsw-alias-border-l3);border-radius:12px;overflow:hidden}.sThFIq_cardTitle{color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover);padding:10px 14px;font-size:12px;font-weight:600;line-height:20px}.sThFIq_turns{flex-direction:column;gap:12px;display:flex}.sThFIq_turnHeader{cursor:pointer;border-bottom:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover);user-select:none;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 14px;display:flex}.sThFIq_turnHeader:hover{background:var(--dsw-alias-interactive-bg-active)}.sThFIq_turnHeaderCollapsed{border-bottom:none}.sThFIq_chevron{border-left:4px solid var(--dsw-alias-label-tertiary);border-bottom:4px solid var(--dsw-alias-label-tertiary);box-sizing:border-box;width:8px;height:8px;margin:0 2px;transition:transform .12s;transform:rotate(-45deg)}.sThFIq_chevronOpen{transform:rotate(45deg)}.sThFIq_turnTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px}.sThFIq_turnMeta{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px;line-height:18px}.sThFIq_turnDetail{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;max-width:40%;font-size:11px;line-height:18px;overflow:hidden}.sThFIq_steps{flex-direction:column;display:flex}.sThFIq_step{border-bottom:1px solid var(--dsw-alias-border-l2);padding:8px 14px}.sThFIq_step:last-child{border-bottom:none}.sThFIq_stepRunning{background:color-mix(in srgb, var(--dsw-static-blue-500,#0091ff) 6%, transparent)}.sThFIq_stepHead{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.sThFIq_stepId{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;min-width:28px;font-size:12px;font-weight:600;line-height:18px}.sThFIq_stepErr{background:var(--dsw-static-red-500,#e5484d);color:#fff;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;line-height:14px}.sThFIq_stepModel{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px}.sThFIq_stepTime{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-left:auto;font-size:11px;line-height:18px}.sThFIq_stepDur{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11px;line-height:18px}.sThFIq_timeline{background:var(--dsw-alias-bg-base,transparent);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;flex-direction:column;gap:2px;margin-top:6px;padding:4px 2px;display:flex;position:relative;overflow:hidden}.sThFIq_timelineLane{height:16px;position:relative}.sThFIq_timelineBar{box-sizing:border-box;font-variant-numeric:tabular-nums;white-space:nowrap;border-radius:3px;align-items:center;height:14px;padding:0 5px;font-size:10px;line-height:14px;display:flex;position:absolute;top:1px;overflow:hidden}.sThFIq_barModel{background:var(--dsw-static-blue-500,#0091ff);color:#fff}.sThFIq_barTool{background:var(--dsw-static-green-500,#30a46c);color:#fff}.sThFIq_barError{background:repeating-linear-gradient(-45deg, var(--dsw-static-red-500,#e5484d), var(--dsw-static-red-500,#e5484d) 4px, #8f2327 4px, #8f2327 8px);border:1px solid #a33a3f}.sThFIq_barRunning{animation:1.2s ease-in-out infinite sThFIq_barPulse}@keyframes sThFIq_barPulse{0%,to{opacity:1}50%{opacity:.55}}.sThFIq_barLabel{text-overflow:ellipsis;overflow:hidden}.sThFIq_stepLat{flex-wrap:wrap;align-items:center;gap:14px;margin-top:4px;display:flex}.sThFIq_latCell{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11px;line-height:18px}.sThFIq_latCell b{color:var(--dsw-alias-label-tertiary);margin-right:4px;font-weight:500}.sThFIq_badge{border-radius:999px;padding:0 8px;font-size:10px;font-weight:600;line-height:16px}.sThFIq_statusOk{background:var(--dsw-static-green-500,#30a46c);color:#fff}.sThFIq_statusError{background:var(--dsw-static-red-500,#e5484d);color:#fff}.sThFIq_statusAborted{background:var(--dsw-static-orange-500,#f76b15);color:#fff}.sThFIq_statusMax{background:var(--dsw-static-amber-500,#f5a623);color:#222}.sThFIq_statusRunning{background:var(--dsw-static-blue-500,#0091ff);color:#fff}.sThFIq_statusBlocked{background:var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary)}.sThFIq_statusUnknown{background:var(--dsw-alias-border-l3);color:var(--dsw-alias-label-tertiary)}.sThFIq_tools{flex-wrap:wrap;gap:6px;margin-top:6px;display:flex}.sThFIq_toolChip{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);border-radius:6px;align-items:center;gap:6px;padding:1px 8px;font-size:11px;line-height:18px;display:inline-flex}.sThFIq_toolChip em{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-style:normal}.sThFIq_toolChip b{color:var(--dsw-static-red-500,#e5484d);font-weight:700}.sThFIq_toolChipErr{border:1px solid var(--dsw-static-red-500,#e5484d)}.sThFIq_retries{flex-wrap:wrap;gap:6px;margin-top:6px;display:flex}.sThFIq_retryChip{background:var(--dsw-static-amber-500,#f5a623);color:#222;font-variant-numeric:tabular-nums;border-radius:6px;padding:0 8px;font-size:10px;line-height:16px}.sThFIq_noMsg{color:var(--dsw-alias-label-tertiary);margin-top:4px;font-size:11px;line-height:18px}.sThFIq_hooksNone{color:var(--dsw-alias-label-tertiary);padding:10px 14px;font-size:12px;line-height:20px}.sThFIq_hooksNoneHint{color:var(--dsw-alias-label-tertiary);opacity:.75;margin-top:2px;font-size:11px;line-height:18px}.sThFIq_hookTable{flex-direction:column;display:flex}.sThFIq_hookRow{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:10px;padding:6px 14px;font-size:11px;line-height:18px;display:flex}.sThFIq_hookRow:last-child{border-bottom:none}.sThFIq_hookName{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.sThFIq_hookPlugin{color:var(--dsw-alias-label-tertiary)}.sThFIq_hookTime{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-left:auto}.sThFIq_hookDur{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;text-align:right;min-width:48px}.sThFIq_hookErr{color:var(--dsw-static-red-500,#e5484d);font-weight:700}@media (width<=700px){.sThFIq_root{max-width:100%;padding-left:12px;padding-right:12px}.sThFIq_turnDetail{max-width:100%}}";
		const tagId = "dsh-devtools/devtools.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-devtools";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var devtools_module_css_default = {
			"badge": "sThFIq_badge",
			"banner": "sThFIq_banner",
			"bannerFull": "sThFIq_bannerFull",
			"bannerPartial": "sThFIq_bannerPartial",
			"barError": "sThFIq_barError",
			"barLabel": "sThFIq_barLabel",
			"barModel": "sThFIq_barModel",
			"barPulse": "sThFIq_barPulse",
			"barRunning": "sThFIq_barRunning",
			"barTool": "sThFIq_barTool",
			"card": "sThFIq_card",
			"cardTitle": "sThFIq_cardTitle",
			"chevron": "sThFIq_chevron",
			"chevronOpen": "sThFIq_chevronOpen",
			"empty": "sThFIq_empty",
			"emptyHint": "sThFIq_emptyHint",
			"emptyTitle": "sThFIq_emptyTitle",
			"footer": "sThFIq_footer",
			"hookDur": "sThFIq_hookDur",
			"hookErr": "sThFIq_hookErr",
			"hookName": "sThFIq_hookName",
			"hookPlugin": "sThFIq_hookPlugin",
			"hookRow": "sThFIq_hookRow",
			"hookTable": "sThFIq_hookTable",
			"hookTime": "sThFIq_hookTime",
			"hooksNone": "sThFIq_hooksNone",
			"hooksNoneHint": "sThFIq_hooksNoneHint",
			"latCell": "sThFIq_latCell",
			"metaChip": "sThFIq_metaChip",
			"metaRow": "sThFIq_metaRow",
			"noMsg": "sThFIq_noMsg",
			"retries": "sThFIq_retries",
			"retryChip": "sThFIq_retryChip",
			"root": "sThFIq_root",
			"stat": "sThFIq_stat",
			"statLabel": "sThFIq_statLabel",
			"statSub": "sThFIq_statSub",
			"statValue": "sThFIq_statValue",
			"statsGrid": "sThFIq_statsGrid",
			"statusAborted": "sThFIq_statusAborted",
			"statusBar": "sThFIq_statusBar",
			"statusBarItem": "sThFIq_statusBarItem",
			"statusBarLive": "sThFIq_statusBarLive",
			"statusBarSec": "sThFIq_statusBarSec",
			"statusBarSep": "sThFIq_statusBarSep",
			"statusBlocked": "sThFIq_statusBlocked",
			"statusError": "sThFIq_statusError",
			"statusMax": "sThFIq_statusMax",
			"statusOk": "sThFIq_statusOk",
			"statusRunning": "sThFIq_statusRunning",
			"statusUnknown": "sThFIq_statusUnknown",
			"step": "sThFIq_step",
			"stepDur": "sThFIq_stepDur",
			"stepErr": "sThFIq_stepErr",
			"stepHead": "sThFIq_stepHead",
			"stepId": "sThFIq_stepId",
			"stepLat": "sThFIq_stepLat",
			"stepModel": "sThFIq_stepModel",
			"stepRunning": "sThFIq_stepRunning",
			"stepTime": "sThFIq_stepTime",
			"steps": "sThFIq_steps",
			"summaryCard": "sThFIq_summaryCard",
			"summaryGroups": "sThFIq_summaryGroups",
			"summaryTitle": "sThFIq_summaryTitle",
			"timeline": "sThFIq_timeline",
			"timelineBar": "sThFIq_timelineBar",
			"timelineLane": "sThFIq_timelineLane",
			"toolChip": "sThFIq_toolChip",
			"toolChipErr": "sThFIq_toolChipErr",
			"tools": "sThFIq_tools",
			"turnDetail": "sThFIq_turnDetail",
			"turnHeader": "sThFIq_turnHeader",
			"turnHeaderCollapsed": "sThFIq_turnHeaderCollapsed",
			"turnMeta": "sThFIq_turnMeta",
			"turnTitle": "sThFIq_turnTitle",
			"turns": "sThFIq_turns"
		};
		//#endregion
		//#region src/client/trace-view.tsx
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
		/** Bounded per-session snapshot cache (stale-while-revalidate). */
		const CACHE_MAX = 10;
		const sessionCache = /* @__PURE__ */ new Map();
		function cacheGet(id) {
			return sessionCache.get(id);
		}
		function cachePut(id, snap) {
			sessionCache.set(id, snap);
			if (sessionCache.size > CACHE_MAX) {
				const oldest = sessionCache.keys().next().value;
				if (oldest !== void 0) sessionCache.delete(oldest);
			}
		}
		/** Status badge class + label key. */
		function statusOf(status) {
			switch (status) {
				case "ok": return {
					cls: devtools_module_css_default.statusOk,
					label: "status.ok"
				};
				case "error": return {
					cls: devtools_module_css_default.statusError,
					label: "status.error"
				};
				case "aborted": return {
					cls: devtools_module_css_default.statusAborted,
					label: "status.aborted"
				};
				case "max-tokens": return {
					cls: devtools_module_css_default.statusMax,
					label: "status.max-tokens"
				};
				case "running": return {
					cls: devtools_module_css_default.statusRunning,
					label: "status.running"
				};
				case "blocked": return {
					cls: devtools_module_css_default.statusBlocked,
					label: "status.blocked"
				};
				case "interrupted": return {
					cls: devtools_module_css_default.statusBlocked,
					label: "status.interrupted"
				};
				default: return {
					cls: devtools_module_css_default.statusUnknown,
					label: "status.unknown"
				};
			}
		}
		/**
		* Build the DevTools view bound to a client context.
		* @param ctx - client root context (RPC face).
		* @param t - bound translate function.
		*/
		function makeTraceView(ctx, t) {
			const rpc = ctx.connection?.rpc;
			return (0, react.memo)(function DevToolsView(props) {
				const sessionId = props.sessionId;
				const [data, setData] = (0, react.useState)(typeof sessionId === "string" && sessionId !== "" ? cacheGet(sessionId) ?? null : null);
				const [error, setError] = (0, react.useState)(null);
				const dataRef = (0, react.useRef)(data);
				(0, react.useEffect)(() => {
					dataRef.current = data;
				}, [data]);
				(0, react.useEffect)(() => {
					if (typeof sessionId !== "string" || sessionId === "" || rpc === void 0) return void 0;
					let alive = true;
					const load = () => {
						fetchTrace(rpc, sessionId).then((snap) => {
							if (!alive) return;
							cachePut(sessionId, snap);
							setData(snap);
							setError(null);
						}).catch((err) => {
							if (alive && dataRef.current === null) setError(err instanceof Error ? err.message : String(err));
						});
					};
					load();
					const timerId = setInterval(() => {
						if (document.visibilityState !== "hidden") load();
					}, 2e3);
					const onVisible = () => {
						if (document.visibilityState === "visible") load();
					};
					document.addEventListener("visibilitychange", onVisible);
					return () => {
						alive = false;
						clearInterval(timerId);
						document.removeEventListener("visibilitychange", onVisible);
					};
				}, [sessionId, rpc]);
				if (error !== null && data === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: devtools_module_css_default.root,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: devtools_module_css_default.empty,
						children: [t("tab.error"), error]
					})
				});
				if (data === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: devtools_module_css_default.root,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.empty,
						children: t("tab.loading")
					})
				});
				const { stats, turns, hooks, session } = data;
				const meta = session.meta;
				const summary = computeSummary(stats, turns);
				if (stats.steps === 0 && stats.turns === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: devtools_module_css_default.root,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: devtools_module_css_default.empty,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: devtools_module_css_default.emptyTitle,
							children: t("empty.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: devtools_module_css_default.emptyHint,
							children: t("empty.hint")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.footer,
						children: t("footer.note")
					})]
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: devtools_module_css_default.root,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(StatusBar, {
							stats,
							turns,
							summary,
							t
						}),
						data.droppedSteps > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `${devtools_module_css_default.banner} ${devtools_module_css_default.bannerPartial}`,
							children: t("trace.partial", { count: data.droppedSteps })
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `${devtools_module_css_default.banner} ${devtools_module_css_default.bannerFull}`,
							children: t("trace.complete")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: devtools_module_css_default.metaRow,
							children: [
								meta.model !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: devtools_module_css_default.metaChip,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("meta.model") }),
										" ",
										meta.model
									]
								}) : null,
								meta.provider !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: devtools_module_css_default.metaChip,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("meta.provider") }),
										" ",
										meta.provider
									]
								}) : null,
								meta.contextWindow !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: devtools_module_css_default.metaChip,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("meta.window") }),
										" ",
										fmtCount(meta.contextWindow)
									]
								}) : null,
								meta.subagent !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: devtools_module_css_default.metaChip,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("meta.subagent") }),
										" ",
										meta.subagent.label ?? meta.subagent.mode ?? "?"
									]
								}) : null
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: devtools_module_css_default.summaryGroups,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SummaryCard, {
									title: t("summary.execution"),
									children: [
										stat(t("stats.turns"), fmtCount(summary.execution.turns)),
										stat(t("stats.steps"), fmtCount(summary.execution.steps), summary.execution.stepsRunning > 0 || summary.execution.stepsPending > 0 ? t("stats.stepsDetail", {
											completed: summary.execution.stepsCompleted,
											running: summary.execution.stepsRunning
										}) : void 0, t("tip.stepsDetail")),
										stat(t("stats.toolCalls"), fmtCount(summary.execution.toolCalls), summary.execution.toolErrors > 0 ? `${summary.execution.toolErrors} ${t("stats.toolErrors")}` : void 0),
										stat(t("stats.retries"), fmtCount(summary.execution.retries)),
										stat(t("stats.errors"), fmtCount(summary.execution.stepErrors), summary.execution.turnErrors > 0 || summary.execution.toolErrors > 0 ? `turn ${summary.execution.turnErrors} · tool ${summary.execution.toolErrors}` : void 0, t("tip.errors")),
										stat(t("stats.interrupted"), fmtCount(summary.execution.turnInterrupted), void 0, t("tip.interrupted"))
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SummaryCard, {
									title: t("summary.performance"),
									children: [
										stat(t("stats.modelWall"), fmtMs(summary.performance.modelMs), void 0, t("tip.modelWall")),
										stat(t("stats.toolWall"), fmtMs(summary.performance.toolMs), void 0, t("tip.toolWall")),
										stat(t("stats.avgFirst"), fmtMs(summary.performance.avgFirstMs), void 0, t("tip.avgFirst")),
										stat(t("stats.wallTime"), fmtMs(summary.performance.wallMs), void 0, t("tip.wallTime")),
										stat(t("stats.decode"), fmtMs(summary.performance.decodeMs), void 0, t("tip.decode")),
										stat(t("stats.throughput"), fmtRate(summary.performance.throughputPerSec), void 0, t("tip.throughput"))
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SummaryCard, {
									title: t("summary.tokens"),
									children: [
										stat(t("stats.input"), fmtCount(summary.tokens.input)),
										stat(t("stats.output"), fmtCount(summary.tokens.output)),
										stat(t("stats.cacheRead"), fmtCount(summary.tokens.cacheRead)),
										stat(t("stats.reasoning"), fmtCount(summary.tokens.reasoning)),
										stat(t("stats.cacheReuse"), fmtPct(summary.tokens.cacheReusePct), void 0, t("tip.cacheReuse"))
									]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: devtools_module_css_default.turns,
							children: turns.map((turn, idx) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TurnCard, {
								turn,
								t,
								defaultOpen: defaultOpen(turn, idx, turns.length)
							}, turn.seq))
						}, session.id),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: devtools_module_css_default.card,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: devtools_module_css_default.cardTitle,
								children: t("hooks.title")
							}), hooks.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: devtools_module_css_default.hooksNone,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: t("hooks.none") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: devtools_module_css_default.hooksNoneHint,
									children: t("hooks.noneHint")
								})]
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: devtools_module_css_default.hookTable,
								children: hooks.map((hook) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: devtools_module_css_default.hookRow,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: devtools_module_css_default.hookName,
											children: hook.name ?? `hook#${hook.seq}`
										}),
										hook.plugin !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: devtools_module_css_default.hookPlugin,
											children: hook.plugin
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: devtools_module_css_default.hookTime,
											children: fmtTime(hook.at)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: devtools_module_css_default.hookDur,
											children: fmtMs(hook.durationMs)
										}),
										hook.error === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: devtools_module_css_default.hookErr,
											children: "ERR"
										}) : null
									]
								}, hook.seq))
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: devtools_module_css_default.footer,
							children: t("footer.note")
						})
					]
				});
			});
		}
		function stat(label, value, sub, tip) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: devtools_module_css_default.stat,
				title: tip,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: devtools_module_css_default.statLabel,
						children: label
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", {
						className: devtools_module_css_default.statValue,
						children: value
					}),
					sub !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: devtools_module_css_default.statSub,
						children: sub
					}) : null
				]
			});
		}
		/** One of the three summary group cards. */
		function SummaryCard(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: devtools_module_css_default.summaryCard,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: devtools_module_css_default.summaryTitle,
					children: props.title
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: devtools_module_css_default.statsGrid,
					children: props.children
				})]
			});
		}
		function StatusBar(props) {
			const { stats, turns, summary, t } = props;
			const last = turns.length > 0 ? turns[turns.length - 1] : void 0;
			const turnNo = last !== void 0 ? last.turn : 0;
			const stepNo = last !== void 0 ? last.steps.length : 0;
			const reuse = summary.tokens.cacheReusePct;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: devtools_module_css_default.statusBar,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: devtools_module_css_default.statusBarItem,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.turns") }),
							" ",
							fmtCount(stats.turns),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.statusBarSep,
								children: "·"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.steps") }),
							" ",
							fmtCount(stats.steps),
							turnNo > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.statusBarSep,
								children: "·"
							}) : null,
							turnNo > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.statusBarLive,
								children: t("statusbar.turnStep", {
									turn: turnNo,
									step: stepNo
								})
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: devtools_module_css_default.statusBarItem,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.modelWall") }),
							" ",
							fmtMs(summary.performance.modelMs)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: devtools_module_css_default.statusBarItem,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.toolWall") }),
							" ",
							fmtMs(summary.performance.toolMs)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: `${devtools_module_css_default.statusBarItem} ${devtools_module_css_default.statusBarSec}`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.avgFirst") }),
							" ",
							fmtMs(summary.performance.avgFirstMs)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: `${devtools_module_css_default.statusBarItem} ${devtools_module_css_default.statusBarSec}`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.throughput") }),
							" ",
							fmtRate(summary.performance.throughputPerSec)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: `${devtools_module_css_default.statusBarItem} ${devtools_module_css_default.statusBarSec}`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.cacheReuse") }),
							" ",
							fmtPct(reuse)
						]
					})
				]
			});
		}
		/** One turn card with its steps. Collapse state is local and survives
		* polling refreshes; the `key` on the turns container resets it on session
		* switch. */
		function TurnCard(props) {
			const { turn, t } = props;
			const [collapsed, setCollapsed] = (0, react.useState)(!props.defaultOpen);
			const open = turn.reason === void 0;
			const reasonCls = turn.reason !== void 0 ? statusOf(turn.reason.kind).cls : devtools_module_css_default.statusRunning;
			const sum = summarizeTurn(turn);
			const win = turnWindow(turn);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: devtools_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: `${devtools_module_css_default.turnHeader} ${collapsed ? devtools_module_css_default.turnHeaderCollapsed : ""}`,
					role: "button",
					tabIndex: 0,
					"aria-expanded": !collapsed,
					onClick: () => setCollapsed(!collapsed),
					onKeyDown: (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setCollapsed(!collapsed);
						}
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `${devtools_module_css_default.chevron} ${collapsed ? "" : devtools_module_css_default.chevronOpen}` }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: devtools_module_css_default.turnTitle,
							children: [
								t("turn.title"),
								" ",
								turn.turn
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: devtools_module_css_default.turnMeta,
							children: fmtTime(turn.startAt)
						}),
						open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: `${devtools_module_css_default.badge} ${devtools_module_css_default.statusRunning}`,
							children: t("turn.open")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: `${devtools_module_css_default.badge} ${reasonCls}`,
							children: turn.reason?.kind ?? "unknown"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: devtools_module_css_default.turnMeta,
							title: t("tip.turnTools"),
							children: [
								t("turn.steps"),
								" ",
								sum.steps,
								" · ",
								t("turn.tools"),
								" ",
								sum.toolCalls
							]
						}),
						turn.endAt !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: devtools_module_css_default.turnMeta,
							children: fmtMs(turn.endAt - turn.startAt)
						}) : null,
						turn.reason?.detail !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: devtools_module_css_default.turnDetail,
							title: turn.reason.detail,
							children: turn.reason.detail.slice(0, 120)
						}) : null
					]
				}), !collapsed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: devtools_module_css_default.steps,
					children: turn.steps.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StepRow, {
						step,
						t,
						window: win
					}, step.seq))
				}) : null]
			});
		}
		/** Absolute [tMin, tMax] of a turn's known activity, for shared bar scaling. */
		function turnWindow(turn) {
			let tMin = turn.startAt;
			let tMax = turn.startAt;
			if (turn.endAt !== void 0) tMax = Math.max(tMax, turn.endAt);
			for (const s of turn.steps) {
				tMin = Math.min(tMin, s.startAt);
				if (s.endAt !== void 0) tMax = Math.max(tMax, s.endAt);
				for (const tool of s.tools) tMax = Math.max(tMax, tool.callAt, tool.resultAt ?? tool.callAt);
			}
			return {
				tMin,
				tMax
			};
		}
		/** One step row: outcome, latency, usage, tools, retries + duration bars. */
		function StepRow(props) {
			const { step, t } = props;
			const win = props.window;
			const st = statusOf(step.status);
			const running = step.status === "running";
			const lanes = assignLanes(stepSpans(step, win.tMax));
			const spanMax = win.tMax > win.tMin ? win.tMax : win.tMin + 1;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${devtools_module_css_default.step} ${running ? devtools_module_css_default.stepRunning : ""}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: devtools_module_css_default.stepHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: devtools_module_css_default.stepId,
								children: ["S", step.step]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `${devtools_module_css_default.badge} ${st.cls}`,
								children: t(st.label)
							}),
							step.error !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.stepErr,
								title: step.error.message,
								children: step.error.code
							}) : null,
							step.model !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.stepModel,
								children: step.model
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.stepTime,
								children: fmtTime(step.startAt)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: devtools_module_css_default.stepDur,
								children: fmtMs(step.wallMs)
							})
						]
					}),
					lanes.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.timeline,
						children: lanes.map(({ span, lane }) => {
							const g = barGeometry(span.start, span.end, win.tMin, spanMax);
							const label = span.kind === "model" ? `${t("step.model")} ${fmtMs(span.durationMs)}` : `${span.toolName ?? "?"} ${fmtMs(span.durationMs)}`;
							const tip = span.kind === "model" ? `${t("step.model")} ${fmtMs(span.durationMs)}${span.running ? ` (${t("status.running")})` : ""}` : `${span.toolName ?? "?"} ${fmtMs(span.durationMs)}${span.running ? ` (${t("status.running")})` : ""}${span.error ? " ERR" : ""}`;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: devtools_module_css_default.timelineLane,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: [
										devtools_module_css_default.timelineBar,
										span.kind === "model" ? devtools_module_css_default.barModel : devtools_module_css_default.barTool,
										span.error ? devtools_module_css_default.barError : "",
										span.running ? devtools_module_css_default.barRunning : ""
									].join(" "),
									style: {
										left: `${g.leftPct}%`,
										width: `${g.widthPct}%`
									},
									title: tip,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: devtools_module_css_default.barLabel,
										children: label
									})
								})
							}, span.id);
						})
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: devtools_module_css_default.stepLat,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: devtools_module_css_default.latCell,
								title: t("tip.ttft"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("step.ttft") }),
									" ",
									fmtMs(step.ttftMs)
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: devtools_module_css_default.latCell,
								title: t("tip.modelWall"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("step.model") }),
									" ",
									fmtMs(step.modelMs)
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: devtools_module_css_default.latCell,
								title: t("tip.decode"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("step.decode") }),
									" ",
									fmtMs(step.decodeMs)
								]
							}),
							step.usage !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: devtools_module_css_default.latCell,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: t("stats.input") }),
									" ",
									fmtCount(step.usage.inputTokens ?? 0),
									step.usage.cacheReadTokens !== void 0 ? ` / ${t("stats.cacheRead")} ${fmtCount(step.usage.cacheReadTokens)}` : "",
									" · ",
									t("stats.output"),
									" ",
									fmtCount(step.usage.outputTokens ?? 0),
									step.usage.reasoningTokens !== void 0 && step.usage.reasoningTokens > 0 ? ` / ${t("stats.reasoning")} ${fmtCount(step.usage.reasoningTokens)}` : ""
								]
							}) : null
						]
					}),
					step.tools.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.tools,
						children: step.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: `${devtools_module_css_default.toolChip} ${tool.error !== void 0 || tool.isError === true ? devtools_module_css_default.toolChipErr : ""}`,
							children: [
								tool.name,
								tool.durationMs !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: fmtMs(tool.durationMs) }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: "…" }),
								tool.error !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: tool.error.code ?? "ERR" }) : null,
								tool.isError === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: "ERR" }) : null
							]
						}, tool.callId))
					}) : null,
					step.retries.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.retries,
						children: step.retries.map((r, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: devtools_module_css_default.retryChip,
							children: [
								t("step.retries"),
								" ",
								r.retry,
								"/",
								r.maxRetries,
								r.code !== void 0 ? ` ${r.code}` : "",
								r.delayMs !== void 0 ? ` +${Math.round(r.delayMs)}ms` : ""
							]
						}, i))
					}) : null,
					step.assistantAt === void 0 && step.status !== "running" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: devtools_module_css_default.noMsg,
						children: t("step.noMessage")
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace this plugin owns. */
		const NS = "devtools";
		/** Required services (fiber inject waiting — the runtime must be up first). */
		const inject = [
			"connection",
			"slots",
			"locale"
		];
		/**
		* Mount the DevTools view.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, "zh", zh), "devtools: zh dictionary");
			ctx.effect(() => ctx.locale.register(NS, "en", en), "devtools: en dictionary");
			const t = ctx.locale.bind(NS);
			const DevToolsView = makeTraceView(ctx, t);
			ctx.slots.inject("conversation.view", () => {
				return ctx.slots.register({
					name: "conversation.view",
					id: "devtools",
					order: 30,
					label: () => t("tab.label"),
					locale: NS
				}, DevToolsView);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map