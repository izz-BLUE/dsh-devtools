//#region src/fold.ts
/** Default retention: 1000 steps / 200 hooks. */
const DEFAULT_TRACE_CAPS = {
	maxSteps: 1e3,
	maxHooks: 200
};
/** Fresh fold state for one session. */
function createFold(caps = DEFAULT_TRACE_CAPS) {
	return {
		n: 0,
		caps,
		turns: [],
		steps: [],
		hooks: [],
		hookStack: [],
		meta: {},
		droppedSteps: 0
	};
}
/** Pluck a string field from an unknown payload, or undefined. */
function str(data, key) {
	if (data === null || typeof data !== "object") return void 0;
	const v = data[key];
	return typeof v === "string" ? v : void 0;
}
/** Pluck a number field from an unknown payload, or undefined. */
function num(data, key) {
	if (data === null || typeof data !== "object") return void 0;
	const v = data[key];
	return typeof v === "number" && Number.isFinite(v) ? v : void 0;
}
/** Attribute a turn outcome to its in-flight/unknown steps. */
function applyTurnOutcome(st, turnNo, kind, error) {
	const targets = st.steps.filter((s) => s.turn === turnNo && (s.status === "running" || s.status === "unknown"));
	for (const step of targets) {
		const record = {
			...step,
			status: kind,
			...error === void 0 ? {} : { error }
		};
		const idx = st.steps.indexOf(step);
		st.steps[idx] = record;
		if (st.openStep === step) st.openStep = record;
	}
}
/**
* Advance the fold over every event not yet folded. Mutates `st` in place.
* Pure structural consumption: never reads or stores message content.
*/
function foldInto(st, events) {
	for (let e = st.n; e < events.length; e++) {
		const ev = events[e];
		if (ev === null || typeof ev !== "object") continue;
		const data = ev.data ?? {};
		const time = typeof ev.time === "number" ? ev.time : 0;
		switch (ev.type) {
			case "turn/start": {
				const turn = num(data, "turn");
				if (turn === void 0) break;
				st.openStep = void 0;
				const record = {
					seq: ev.seq,
					turn,
					startAt: time
				};
				st.openTurn = record;
				st.turns.push(record);
				break;
			}
			case "step/start": {
				const turn = num(data, "turn");
				const step = num(data, "step");
				if (turn === void 0 || step === void 0) break;
				const record = {
					seq: ev.seq,
					turn,
					step,
					startAt: time,
					retries: [],
					tools: [],
					status: "running",
					...st.meta.model === void 0 ? {} : { model: st.meta.model },
					...st.meta.provider === void 0 ? {} : { provider: st.meta.provider }
				};
				st.openStep = record;
				st.steps.push(record);
				break;
			}
			case "assistant/chunk": {
				const step = st.openStep;
				if (step === void 0) break;
				const chunk = data.chunk ?? null;
				if (chunk === null || typeof chunk !== "object") break;
				if (chunk.type === "block-start" && step.firstChunkAt === void 0) {
					const next = {
						...step,
						firstChunkAt: time
					};
					st.steps[st.steps.indexOf(step)] = next;
					st.openStep = next;
				} else if (chunk.type === "usage") {
					const usage = chunk.usage;
					if (usage !== void 0 && typeof usage === "object") {
						const next = {
							...step,
							usage
						};
						st.steps[st.steps.indexOf(step)] = next;
						st.openStep = next;
					}
				} else if (chunk.type === "finish") {
					const reason = chunk.reason;
					if (reason !== void 0 && typeof reason === "object") {
						const status = reason.kind === "max-tokens" ? "max-tokens" : step.status;
						const next = {
							...step,
							finish: reason,
							status
						};
						st.steps[st.steps.indexOf(step)] = next;
						st.openStep = next;
					}
				}
				break;
			}
			case "assistant/message": {
				const step = st.openStep;
				if (step === void 0) break;
				const usage = data.usage ?? void 0;
				const next = {
					...step,
					assistantAt: time,
					status: step.status === "max-tokens" ? "max-tokens" : step.status === "running" ? "ok" : step.status,
					...usage !== void 0 && typeof usage === "object" ? { usage } : {}
				};
				st.steps[st.steps.indexOf(step)] = next;
				st.openStep = next;
				break;
			}
			case "tool/call": {
				const step = st.openStep;
				if (step === void 0) break;
				const callId = str(data, "callId");
				const name = str(data, "name");
				if (callId === void 0) break;
				const tool = {
					callId,
					name: name ?? "?",
					callAt: time
				};
				const next = {
					...step,
					tools: [...step.tools, tool]
				};
				st.steps[st.steps.indexOf(step)] = next;
				st.openStep = next;
				break;
			}
			case "tool/result": {
				const step = st.openStep;
				if (step === void 0) break;
				const message = data.message ?? null;
				const callId = str(message?.source, "callId");
				if (callId === void 0) break;
				const tools = step.tools.map((t) => {
					if (t.callId !== callId) return t;
					const error = data.error;
					const block = Array.isArray(message?.content) ? message.content[0] : void 0;
					const isError = block !== void 0 && typeof block === "object" && block.isError === true;
					return {
						...t,
						resultAt: time,
						durationMs: Math.max(0, time - t.callAt),
						...error !== void 0 && typeof error === "object" ? { error: {
							...typeof error.name === "string" ? { name: error.name } : {},
							...typeof error.code === "string" ? { code: error.code } : {}
						} } : {},
						...isError ? { isError: true } : {}
					};
				});
				const next = {
					...step,
					tools
				};
				st.steps[st.steps.indexOf(step)] = next;
				st.openStep = next;
				break;
			}
			case "llm/retry": {
				const step = st.openStep;
				if (step === void 0) break;
				const failure = data.failure ?? null;
				const retry = {
					retry: num(data, "retry") ?? 0,
					maxRetries: num(data, "maxRetries") ?? 0,
					at: time,
					...num(data, "delayMs") === void 0 ? {} : { delayMs: num(data, "delayMs") },
					...typeof failure?.code === "string" ? { code: failure.code } : {},
					...typeof failure?.message === "string" ? { message: failure.message } : {}
				};
				const next = {
					...step,
					retries: [...step.retries, retry]
				};
				st.steps[st.steps.indexOf(step)] = next;
				st.openStep = next;
				break;
			}
			case "step/end": {
				const step = st.openStep;
				if (step === void 0) break;
				const turn = num(data, "turn");
				const stepNo = num(data, "step");
				if (turn !== step.turn || stepNo !== step.step) break;
				const status = step.status === "running" ? step.assistantAt !== void 0 ? "ok" : "unknown" : step.status;
				const next = {
					...step,
					endAt: time,
					status
				};
				st.steps[st.steps.indexOf(step)] = next;
				st.openStep = void 0;
				if (st.openTurn !== void 0) {
					const nextTurn = {
						...st.openTurn,
						stepCount: (st.openTurn.stepCount ?? 0) + 1
					};
					const ti = st.turns.indexOf(st.openTurn);
					if (ti >= 0) st.turns[ti] = nextTurn;
					st.openTurn = nextTurn;
				}
				break;
			}
			case "turn/end": {
				const turn = st.openTurn;
				if (turn === void 0) break;
				const reason = data.reason ?? null;
				const kind = typeof reason?.kind === "string" ? reason.kind : "unknown";
				const error = reason?.kind === "error" ? reason.error : void 0;
				const closed = {
					...turn,
					endAt: time,
					reason: {
						kind,
						...error !== void 0 && typeof error === "object" && typeof error.message === "string" ? { detail: error.message } : {}
					}
				};
				const idx = st.turns.indexOf(turn);
				st.turns[idx] = closed;
				st.openTurn = void 0;
				const failure = error !== void 0 && typeof error === "object" ? {
					message: typeof error.message === "string" ? error.message : String(error),
					code: typeof error.code === "string" ? error.code : "UNKNOWN"
				} : void 0;
				applyTurnOutcome(st, turn.turn, kind, failure);
				break;
			}
			case "request/header": {
				const config = (data.header ?? null)?.config;
				if (config !== null && config !== void 0 && typeof config === "object") {
					const provider = typeof config.provider === "string" ? config.provider : void 0;
					const model = typeof config.model === "string" ? config.model : void 0;
					if (provider !== void 0 || model !== void 0) {
						st.meta = {
							...st.meta,
							...provider === void 0 ? {} : { provider },
							...model === void 0 ? {} : { model }
						};
						const step = st.openStep;
						if (step !== void 0) {
							let changed = false;
							const next = { ...step };
							if (provider !== void 0 && step.provider !== provider) {
								next.provider = provider;
								changed = true;
							}
							if (model !== void 0 && step.model !== model) {
								next.model = model;
								changed = true;
							}
							if (changed) {
								st.steps[st.steps.indexOf(step)] = next;
								st.openStep = next;
							}
						}
					}
				}
				break;
			}
			case "request/context": {
				const provider = str(data, "provider");
				const model = str(data, "model");
				const contextWindow = num(data, "contextWindow");
				if (provider !== void 0 || model !== void 0 || contextWindow !== void 0) st.meta = {
					...st.meta,
					...provider === void 0 ? {} : { provider },
					...model === void 0 ? {} : { model },
					...contextWindow === void 0 ? {} : { contextWindow }
				};
				break;
			}
			case "subagent/descriptor":
				st.meta = {
					...st.meta,
					subagent: {
						...str(data, "label") === void 0 ? {} : { label: str(data, "label") },
						...str(data, "mode") === void 0 ? {} : { mode: str(data, "mode") },
						...str(data, "agentModel") === void 0 ? {} : { agentModel: str(data, "agentModel") }
					}
				};
				break;
			case "hook/invoked": {
				const record = {
					seq: ev.seq,
					at: time,
					...str(data, "plugin") === void 0 ? {} : { plugin: str(data, "plugin") },
					...str(data, "name") === void 0 ? {} : { name: str(data, "name") }
				};
				st.hooks.push(record);
				st.hookStack.push({ record });
				break;
			}
			case "hook/result": {
				const open = st.hookStack.pop();
				if (open === void 0) break;
				const error = data.error === true;
				const durationMs = num(data, "durationMs");
				const record = {
					...open.record,
					...durationMs === void 0 ? {} : { durationMs },
					...error ? { error: true } : {}
				};
				const idx = st.hooks.indexOf(open.record);
				st.hooks[idx] = record;
				break;
			}
			default: break;
		}
	}
	st.n = events.length;
	if (st.steps.length > st.caps.maxSteps) {
		const dropped = st.steps.length - st.caps.maxSteps;
		st.steps.splice(0, dropped);
		st.droppedSteps += dropped;
	}
	if (st.hooks.length > st.caps.maxHooks) {
		const dropped = st.hooks.length - st.caps.maxHooks;
		st.hooks.splice(0, dropped);
	}
}
//#endregion
//#region src/trace.ts
/** Derive the per-step latency figures. */
function stepWire(step) {
	const ttftMs = step.firstChunkAt !== void 0 ? Math.max(0, step.firstChunkAt - step.startAt) : void 0;
	const modelMs = step.assistantAt !== void 0 ? Math.max(0, step.assistantAt - step.startAt) : void 0;
	const decodeMs = step.firstChunkAt !== void 0 && step.assistantAt !== void 0 ? Math.max(0, step.assistantAt - step.firstChunkAt) : void 0;
	const wallMs = step.endAt !== void 0 ? Math.max(0, step.endAt - step.startAt) : void 0;
	return {
		...step,
		...ttftMs === void 0 ? {} : { ttftMs },
		...modelMs === void 0 ? {} : { modelMs },
		...decodeMs === void 0 ? {} : { decodeMs },
		...wallMs === void 0 ? {} : { wallMs }
	};
}
/** Compute whole-window aggregates from the folded records. */
function computeStats(steps, turns) {
	let errors = 0;
	let aborted = 0;
	let maxTokens = 0;
	let retries = 0;
	let toolCalls = 0;
	let toolErrors = 0;
	let modelMs = 0;
	let toolMs = 0;
	let inputTokens = 0;
	let outputTokens = 0;
	let cacheReadTokens = 0;
	let reasoningTokens = 0;
	for (const s of steps) {
		if (s.status === "error") errors++;
		else if (s.status === "aborted") aborted++;
		else if (s.status === "max-tokens") maxTokens++;
		retries += s.retries.length;
		toolCalls += s.tools.length;
		for (const t of s.tools) {
			if (t.durationMs !== void 0) toolMs += t.durationMs;
			if (t.error !== void 0 || t.isError === true) toolErrors++;
		}
		if (s.assistantAt !== void 0) modelMs += Math.max(0, s.assistantAt - s.startAt);
		const u = s.usage;
		if (u !== void 0) {
			inputTokens += u.inputTokens ?? 0;
			outputTokens += u.outputTokens ?? 0;
			cacheReadTokens += u.cacheReadTokens ?? 0;
			reasoningTokens += u.reasoningTokens ?? 0;
		}
	}
	const started = turns.length > 0 ? turns[0].startAt : void 0;
	const ended = turns.length > 0 && turns[turns.length - 1].endAt !== void 0 ? turns[turns.length - 1].endAt : void 0;
	return {
		turns: turns.length,
		steps: steps.length,
		errors,
		aborted,
		maxTokens,
		retries,
		toolCalls,
		toolErrors,
		...started === void 0 ? {} : { startedAt: started },
		...ended === void 0 ? {} : { endedAt: ended },
		modelMs,
		toolMs,
		inputTokens,
		outputTokens,
		cacheReadTokens,
		reasoningTokens
	};
}
/** Build the wire snapshot from the folded state. */
function buildTrace(st, sessionId, live) {
	const turns = [];
	for (const turn of st.turns) {
		const steps = st.steps.filter((s) => s.turn === turn.turn).map(stepWire);
		turns.push({
			...turn,
			steps
		});
	}
	return {
		ok: true,
		session: {
			id: sessionId,
			meta: st.meta
		},
		stats: computeStats(st.steps, st.turns),
		turns,
		hooks: st.hooks.slice(-st.caps.maxHooks),
		droppedSteps: st.droppedSteps,
		live
	};
}
//#endregion
//#region src/index.ts
/** Cordis plugin name. */
const name = "dsh-devtools";
/** Required services: the generic Connection RPC registry and the session store. */
const inject = ["connection", "sessions"];
/** Build one trace snapshot for a session, folding incrementally. */
function computeTrace(ctx, states, sessionId) {
	let st = states.get(sessionId);
	if (st === void 0) {
		st = {
			fold: createFold(),
			count: -1,
			result: null
		};
		states.set(sessionId, st);
	}
	const sessions = ctx.get("sessions");
	const sessionQuery = ctx.get("sessionQuery");
	const live = sessions !== void 0 ? sessions.get(sessionId) : void 0;
	if (live !== void 0) {
		const events = live.events;
		if (events.length === st.count && st.result !== null) return Promise.resolve(st.result);
		if (events.length < st.fold.n) st.fold = createFold();
		foldInto(st.fold, events);
		st.count = events.length;
		st.result = buildTrace(st.fold, sessionId, true);
		return Promise.resolve(st.result);
	}
	if (sessionQuery === void 0) return Promise.reject(/* @__PURE__ */ new Error("session is not live and sessionQuery is unavailable"));
	return (async () => {
		if (st.result !== null && st.count >= 0) {
			if ((await sessionQuery.listEvents(sessionId)).length === st.count) return st.result;
		}
		const snapshot = await sessionQuery.readSession(sessionId);
		const events = snapshot !== void 0 && Array.isArray(snapshot.events) ? snapshot.events : [];
		if (events.length === st.count && st.result !== null) return st.result;
		if (events.length < st.fold.n) st.fold = createFold();
		foldInto(st.fold, events);
		st.count = events.length;
		st.result = buildTrace(st.fold, sessionId, false);
		return st.result;
	})();
}
/**
* Register the /dsh-devtools RPC channel.
* @param ctx - plugin context carrying connection + sessions.
*/
function apply(ctx) {
	const states = /* @__PURE__ */ new Map();
	ctx.effect(() => {
		const rpc = ctx.get("connection")?.rpc;
		if (rpc === void 0) {
			ctx.logger.warn("dsh-devtools: connection.rpc unavailable; trace channel not mounted");
			return () => void 0;
		}
		const handler = async (endpoint, payload) => {
			try {
				if (endpoint !== "trace") return {
					ok: false,
					error: {
						code: "internal",
						message: `unknown endpoint: ${endpoint}`,
						details: {}
					}
				};
				const sessionId = payload !== null && typeof payload === "object" ? payload.sessionId : void 0;
				if (typeof sessionId !== "string" || sessionId === "") return {
					ok: false,
					error: {
						code: "internal",
						message: "missing sessionId",
						details: {}
					}
				};
				return {
					ok: true,
					value: await computeTrace(ctx, states, sessionId)
				};
			} catch (err) {
				return {
					ok: false,
					error: {
						code: "internal",
						message: err instanceof Error ? err.message : String(err),
						details: {}
					}
				};
			}
		};
		return rpc.handle("/dsh-devtools", handler, { authority: "trusted-host" });
	}, "dsh-devtools: rpc channel");
}
//#endregion
export { apply, buildTrace, createFold, foldInto, inject, name };
