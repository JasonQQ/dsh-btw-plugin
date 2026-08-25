import { test } from "node:test";
import assert from "node:assert/strict";

import { apply, inject, name, Config } from "../lib/index.js";

/** Minimal command-registry stand-in: captures the registered definition. */
function stubCommands() {
	const definitions = [];
	return {
		definitions,
		register(definition) {
			definitions.push(definition);
			return () => {
				const i = definitions.indexOf(definition);
				if (i !== -1) definitions.splice(i, 1);
			};
		}
	};
}

/** Fake subagent run with a configurable terminal result. */
function stubRun(resultValue) {
	return {
		id: "run-1",
		disposed: false,
		result: Promise.resolve(resultValue),
		async dispose() {
			this.disposed = true;
		}
	};
}

/** Build a stub `ctx` with the services `/btw` needs. */
function stubCtx({ provider = "fork", start } = {}) {
	return {
		commands: stubCommands(),
		subagents: {
			getProvider(name) {
				return name === provider ? { name } : void 0;
			},
			async start(usedProvider, request) {
				assert.equal(usedProvider, provider);
				return start(request);
			}
		},
		effect(generator) {
			// Run the generator body synchronously, collecting yielded disposers.
			const iter = generator();
			const disposables = [];
			let step = iter.next();
			while (!step.done) {
				disposables.push(step.value);
				step = iter.next();
			}
			return () => {
				for (const dispose of disposables) dispose();
				iter.return?.();
			};
		}
	};
}

/** Invoke the registered `/btw` handler like the command registry would. */
async function invoke(ctx, rawInput, agent = { session: {} }) {
	const [definition] = ctx.commands.definitions;
	return definition.handler({
		commandId: "cmd-1",
		agent,
		rawInput,
		attachments: [],
		signal: new AbortController().signal
	});
}

test("plugin identity", () => {
	assert.equal(name, "dsh-btw-plugin");
	assert.deepEqual(inject, ["commands", "subagents"]);
	assert.ok(typeof apply === "function");
});

test("config schema applies defaults and rejects invalid values", () => {
	const validate = (value) => Config["~standard"].validate(value);
	assert.deepEqual(validate({}).value, { provider: "fork" });
	assert.deepEqual(validate({ provider: "spawn", maxDepth: 2 }).value, { provider: "spawn", maxDepth: 2 });
	assert.ok(validate({ maxDepth: -1 }).issues);
	assert.ok(validate({ maxDepth: 1.5 }).issues);
});

test("registers the /btw command with an input hint", () => {
	const ctx = stubCtx({ start: () => stubRun({ stopReason: "completed", output: [] }) });
	apply(ctx, { provider: "fork" });
	const [definition] = ctx.commands.definitions;
	assert.equal(definition.name, "btw");
	assert.equal(definition.input.hint, "<question>");
	assert.equal(typeof definition.description, "string");
	assert.ok(definition.description.length > 0);
	assert.equal(typeof definition.handler, "function");
});

test("empty input returns a usage error", async () => {
	const ctx = stubCtx({ start: () => stubRun({ stopReason: "completed", output: [] }) });
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "   ");
	assert.equal(result.kind, "error");
	assert.match(result.text, /Usage: \/btw/);
});

test("missing provider returns a friendly error without starting", async () => {
	const ctx = stubCtx({ provider: "missing", start: () => { throw new Error("should not start"); } });
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "some question");
	assert.equal(result.kind, "error");
	assert.match(result.text, /No subagent provider "fork"/);
});

test("returns the subagent answer as a success result", async () => {
	const calls = [];
	const ctx = stubCtx({
		start: (request) => {
			calls.push(request);
			return stubRun({
				stopReason: "completed",
				output: [{ type: "text", text: "The answer." }]
			});
		}
	});
	apply(ctx, { provider: "fork" });
	const agent = { session: {} };
	const result = await invoke(ctx, "what does the code do?", agent);
	assert.equal(result.kind, "success");
	assert.equal(result.text, "The answer.");
	assert.equal(calls.length, 1);
	assert.equal(calls[0].parent, agent);
	assert.equal(calls[0].label, "btw");
	assert.equal(calls[0].signal.constructor.name, "AbortSignal");
	assert.match(calls[0].prompt[0].text, /what does the code do\?/);
	assert.match(calls[0].prompt[0].text, /conversation history above/);
});

test("multi-block output is joined", async () => {
	const ctx = stubCtx({
		start: () => stubRun({
			stopReason: "completed",
			output: [{ type: "text", text: "part1 " }, { type: "text", text: "part2" }]
		})
	});
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.deepEqual(result, { kind: "success", text: "part1 part2" });
});

test("non-completed stop reasons map to errors with partial output", async () => {
	for (const [stopReason, expected] of [
		["max-tokens", /token limit/],
		["aborted", /cancelled/],
		["refusal", /declined/],
		["error", /failed/]
	]) {
		const ctx = stubCtx({
			start: () => stubRun({
				stopReason,
				output: [{ type: "text", text: "partial" }]
			})
		});
		apply(ctx, { provider: "fork" });
		const result = await invoke(ctx, "q?");
		assert.equal(result.kind, "error");
		assert.match(result.text, expected);
		assert.match(result.text, /partial/);
	}
});

test("disposes the run after collecting the result", async () => {
	const run = stubRun({ stopReason: "completed", output: [{ type: "text", text: "ok" }] });
	const ctx = stubCtx({ start: () => run });
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.equal(result.kind, "success");
	assert.equal(run.disposed, true);
});

test("start rejection returns an error result", async () => {
	const ctx = stubCtx({
		start: async () => { throw new Error("boom"); }
	});
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.equal(result.kind, "error");
	assert.match(result.text, /Could not start/);
});

test("passes maxDepth through when configured", async () => {
	const calls = [];
	const ctx = stubCtx({
		start: (request) => {
			calls.push(request);
			return stubRun({ stopReason: "completed", output: [{ type: "text", text: "ok" }] });
		}
	});
	apply(ctx, { provider: "fork", maxDepth: 2 });
	await invoke(ctx, "q?");
	assert.equal(calls[0].maxDepth, 2);
});

test("omits maxDepth when not configured", async () => {
	const calls = [];
	const ctx = stubCtx({
		start: (request) => {
			calls.push(request);
			return stubRun({ stopReason: "completed", output: [{ type: "text", text: "ok" }] });
		}
	});
	apply(ctx, { provider: "fork" });
	await invoke(ctx, "q?");
	assert.equal("maxDepth" in calls[0], false);
});

test("empty answer from a completed run returns an error", async () => {
	const ctx = stubCtx({
		start: () => stubRun({ stopReason: "completed", output: [] })
	});
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.equal(result.kind, "error");
	assert.match(result.text, /empty answer/);
});

test("run.result rejection returns an error and still disposes", async () => {
	const run = {
		id: "run-1",
		disposed: false,
		result: Promise.reject(new Error("boom")),
		async dispose() {
			this.disposed = true;
		}
	};
	const ctx = stubCtx({ start: () => run });
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.equal(result.kind, "error");
	assert.match(result.text, /failed: boom/);
	assert.equal(run.disposed, true);
});

test("disposal failure does not discard a collected answer", async () => {
	const run = {
		id: "run-1",
		result: Promise.resolve({ stopReason: "completed", output: [{ type: "text", text: "ok" }] }),
		async dispose() {
			throw new Error("dispose boom");
		}
	};
	const ctx = stubCtx({ start: () => run });
	apply(ctx, { provider: "fork" });
	const result = await invoke(ctx, "q?");
	assert.deepEqual(result, { kind: "success", text: "ok" });
});

test("forwards the invocation abort signal to the subagent", async () => {
	const calls = [];
	const controller = new AbortController();
	const ctx = stubCtx({
		start: (request) => {
			calls.push(request);
			return stubRun({ stopReason: "completed", output: [{ type: "text", text: "ok" }] });
		}
	});
	apply(ctx, { provider: "fork" });
	const [definition] = ctx.commands.definitions;
	await definition.handler({
		commandId: "cmd-1",
		agent: { session: {} },
		rawInput: "q?",
		attachments: [],
		signal: controller.signal
	});
	assert.equal(calls[0].signal, controller.signal);
});

test("already-aborted invocation settles as an error without a child turn", async () => {
	const started = [];
	const controller = new AbortController();
	controller.abort();
	const ctx = stubCtx({
		start: async (request) => {
			started.push(request);
			throw new Error("subagent request was aborted before child publication");
		}
	});
	apply(ctx, { provider: "fork" });
	const [definition] = ctx.commands.definitions;
	const result = await definition.handler({
		commandId: "cmd-1",
		agent: { session: {} },
		rawInput: "q?",
		attachments: [],
		signal: controller.signal
	});
	// The provider driver rejects pre-publication; the plugin surfaces it.
	assert.equal(started.length, 1);
	assert.equal(result.kind, "error");
	assert.match(result.text, /aborted before child publication/);
});
