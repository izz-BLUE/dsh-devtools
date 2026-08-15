/**
 * Locale dictionaries for the DevTools view.
 *
 * @module dsh-devtools/client/locales
 */

export interface DevtoolsKey {
  'tab.label': string
  'tab.loading': string
  'tab.error': string
  'summary.execution': string
  'summary.performance': string
  'summary.tokens': string
  'stats.turns': string
  'stats.steps': string
  'stats.stepsDetail': string
  'stats.errors': string
  'stats.aborted': string
  'stats.maxTokens': string
  'stats.retries': string
  'stats.toolCalls': string
  'stats.toolErrors': string
  'stats.turnErrors': string
  'stats.interrupted': string
  'stats.modelWall': string
  'stats.toolWall': string
  'stats.avgFirst': string
  'stats.wallTime': string
  'stats.decode': string
  'stats.throughput': string
  'stats.input': string
  'stats.output': string
  'stats.cacheRead': string
  'stats.reasoning': string
  'stats.cacheReuse': string
  'meta.model': string
  'meta.provider': string
  'meta.window': string
  'meta.subagent': string
  'meta.cwd': string
  'trace.complete': string
  'trace.partial': string
  'turn.title': string
  'turn.reason': string
  'turn.steps': string
  'turn.tools': string
  'turn.open': string
  'turn.wall': string
  'step.ttft': string
  'step.model': string
  'step.decode': string
  'step.wall': string
  'step.tools': string
  'step.retries': string
  'step.noMessage': string
  'status.ok': string
  'status.error': string
  'status.aborted': string
  'status.max-tokens': string
  'status.running': string
  'status.blocked': string
  'status.interrupted': string
  'status.unknown': string
  'hooks.title': string
  'hooks.none': string
  'hooks.noneHint': string
  'hooks.plugin': string
  'hooks.duration': string
  'empty.title': string
  'empty.hint': string
  'footer.note': string
  'tip.ttft': string
  'tip.modelWall': string
  'tip.toolWall': string
  'tip.avgFirst': string
  'tip.decode': string
  'tip.wallTime': string
  'tip.throughput': string
  'tip.cacheReuse': string
  'tip.errors': string
  'tip.interrupted': string
  'tip.stepsDetail': string
  'tip.turnTools': string
  'statusbar.turnStep': string
}

export const zh: Record<keyof DevtoolsKey, string> = {
  'tab.label': 'DevTools',
  'tab.loading': '正在加载执行轨迹…',
  'tab.error': '加载失败：',
  'summary.execution': '执行',
  'summary.performance': '性能',
  'summary.tokens': 'Token',
  'stats.turns': 'Turns',
  'stats.steps': 'Steps',
  'stats.stepsDetail': '{completed} 已完成 · {running} 进行中',
  'stats.errors': '错误',
  'stats.aborted': '中断',
  'stats.maxTokens': '超限',
  'stats.retries': '重试',
  'stats.toolCalls': '工具调用',
  'stats.toolErrors': '工具错误',
  'stats.turnErrors': 'Turn 错误',
  'stats.interrupted': '中断 / 中止',
  'stats.modelWall': 'Model Wall',
  'stats.toolWall': 'Tool Wall',
  'stats.avgFirst': '平均首活动',
  'stats.wallTime': '总时长',
  'stats.decode': '解码',
  'stats.throughput': '吞吐',
  'stats.input': '输入',
  'stats.output': '输出',
  'stats.cacheRead': '缓存读',
  'stats.reasoning': '推理',
  'stats.cacheReuse': '缓存复用',
  'meta.model': '模型',
  'meta.provider': 'Provider',
  'meta.window': '上下文窗口',
  'meta.subagent': '子代理',
  'meta.cwd': '工作目录',
  'trace.complete': 'Trace 完整',
  'trace.partial': '部分 Trace · 已省略更早的 {count} 个步骤',
  'turn.title': 'Turn',
  'turn.reason': '结束',
  'turn.steps': '步骤',
  'turn.tools': '工具',
  'turn.open': '进行中',
  'turn.wall': 'Wall',
  'step.ttft': 'TTFT',
  'step.model': '模型',
  'step.decode': '解码',
  'step.wall': '总时长',
  'step.tools': '工具',
  'step.retries': '重试',
  'step.noMessage': '无模型输出',
  'status.ok': '完成',
  'status.error': '错误',
  'status.aborted': '中断',
  'status.max-tokens': '超限',
  'status.running': '进行中',
  'status.blocked': '阻塞',
  'status.interrupted': '中断',
  'status.unknown': '未知',
  'hooks.title': 'Hook 执行',
  'hooks.none': '当前会话未记录 Hook Trace 事件。',
  'hooks.noneHint': 'Hook 事件的生产取决于当前 Harness / 插件组合。',
  'hooks.plugin': '插件',
  'hooks.duration': '耗时',
  'empty.title': '暂无执行轨迹',
  'empty.hint': '向该会话发送消息后，这里将展示 Turn / Step 执行时间线。',
  'footer.note': '只读观测：数据来自 durable session log，未修改任何行为。',
  'tip.ttft': '从 step/start 到首个持久化 block-start 的时间（非 Provider 官方上报的 TTFT）。',
  'tip.modelWall': '模型侧 Wall 时间：assistantAt - startAt 之和（仅统计有模型输出的步骤）。',
  'tip.toolWall': 'Measured from tool/call to tool/result. Includes any time between invocation and result.',
  'tip.avgFirst': '各步骤 TTFT（step/start 到首个持久化 block-start）的平均值。',
  'tip.decode': 'assistantAt - firstChunkAt 之和（仅统计有完整流式区间的步骤）。',
  'tip.wallTime': '会话 Wall 时间：最后结束时间 - 最早开始时间。',
  'tip.throughput': '输出 Token / 会话 Wall 秒数。',
  'tip.cacheReuse': '缓存复用率 = 缓存读 / (输入 + 缓存读)。为内部派生指标，非 Provider 官方缓存命中率。',
  'tip.errors': '步骤级错误为 step status = error；Turn 级错误为 turn/end reason = error；工具错误为 tool/result 失败。三者独立统计，不混淆。',
  'tip.interrupted': '统计对象为 Turn：turn/end reason 为 aborted 或 interrupted。',
  'tip.stepsDetail': 'Steps 为保留窗口内的步骤总数；completed 为已结束步骤；running 为进行中；其余为待定。',
  'tip.turnTools': '该 Turn 内的工具调用次数。',
  'statusbar.turnStep': 'Turn {turn} · Step {step}',
}

export const en: Record<keyof DevtoolsKey, string> = {
  'tab.label': 'DevTools',
  'tab.loading': 'Loading runtime trace…',
  'tab.error': 'Failed to load: ',
  'summary.execution': 'Execution',
  'summary.performance': 'Performance',
  'summary.tokens': 'Tokens',
  'stats.turns': 'Turns',
  'stats.steps': 'Steps',
  'stats.stepsDetail': '{completed} completed · {running} running',
  'stats.errors': 'Errors',
  'stats.aborted': 'Aborted',
  'stats.maxTokens': 'Max tokens',
  'stats.retries': 'Retries',
  'stats.toolCalls': 'Tool calls',
  'stats.toolErrors': 'Tool errors',
  'stats.turnErrors': 'Turn errors',
  'stats.interrupted': 'Interrupted / Aborted',
  'stats.modelWall': 'Model Wall',
  'stats.toolWall': 'Tool Wall',
  'stats.avgFirst': 'Avg First Activity',
  'stats.wallTime': 'Wall Time',
  'stats.decode': 'Decode',
  'stats.throughput': 'Throughput',
  'stats.input': 'Input',
  'stats.output': 'Output',
  'stats.cacheRead': 'Cache read',
  'stats.reasoning': 'Reasoning',
  'stats.cacheReuse': 'Cache reuse',
  'meta.model': 'Model',
  'meta.provider': 'Provider',
  'meta.window': 'Context window',
  'meta.subagent': 'Subagent',
  'meta.cwd': 'Workspace',
  'trace.complete': 'Trace complete',
  'trace.partial': 'Partial trace · {count} earlier steps omitted',
  'turn.title': 'Turn',
  'turn.reason': 'Ended',
  'turn.steps': 'Steps',
  'turn.tools': 'Tools',
  'turn.open': 'Running',
  'turn.wall': 'Wall',
  'step.ttft': 'TTFT',
  'step.model': 'Model',
  'step.decode': 'Decode',
  'step.wall': 'Wall',
  'step.tools': 'Tools',
  'step.retries': 'Retries',
  'step.noMessage': 'no model output',
  'status.ok': 'ok',
  'status.error': 'error',
  'status.aborted': 'aborted',
  'status.max-tokens': 'max tokens',
  'status.running': 'running',
  'status.blocked': 'blocked',
  'status.interrupted': 'interrupted',
  'status.unknown': 'unknown',
  'hooks.title': 'Hook executions',
  'hooks.none': 'No hook trace events recorded.',
  'hooks.noneHint': 'Hook event production depends on the active Harness/plugin composition.',
  'hooks.plugin': 'Plugin',
  'hooks.duration': 'Duration',
  'empty.title': 'No runtime trace yet',
  'empty.hint': 'Send a message in this session and the Turn / Step execution timeline appears here.',
  'footer.note': 'Read-only observability: data comes from the durable session log; nothing is modified.',
  'tip.ttft': 'Derived from step start to the first persisted block-start event.',
  'tip.modelWall': 'Sum of model-side wall time (assistantAt - startAt) over steps with an assistant message.',
  'tip.toolWall': 'Measured from tool/call to tool/result. Includes any time between invocation and result.',
  'tip.avgFirst': 'Mean TTFT (step/start to first persisted block-start) across steps.',
  'tip.decode': 'Sum of assistantAt - firstChunkAt over steps with a full stream window.',
  'tip.wallTime': 'Session wall: last end time - first start time.',
  'tip.throughput': 'Output tokens per session-wall second.',
  'tip.cacheReuse': 'Cache reuse = cache read / (input + cache read). Internal derived figure, not the provider official cache hit rate.',
  'tip.errors': 'Step errors count step status = error; turn errors count turn/end reason = error; tool errors count failed tool results. Kept separate on purpose.',
  'tip.interrupted': 'Counts turns whose turn/end reason is aborted or interrupted.',
  'tip.stepsDetail': 'Steps is the total in the retained window; completed counts closed steps; running counts in-flight; the rest are pending.',
  'tip.turnTools': 'Tool calls inside this turn.',
  'statusbar.turnStep': 'Turn {turn} · Step {step}',
}
