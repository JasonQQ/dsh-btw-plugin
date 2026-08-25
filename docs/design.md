# Design

How `/btw` works and why it is shaped this way.

## Flow

1. The user types `/btw <question>` in a session composer.
2. `@deepseek-ai/dsh-commands` parses the line, mints a `commandId`, and invokes
   the registered handler with `{ commandId, agent, rawInput, attachments, signal }`.
3. The handler delegates to `ctx.subagents.start("fork", …)`:

   - the `fork` provider creates a child agent **seeded with the parent's
     completed turns**, so the side question is answered with the main
     conversation as context;
   - the child's one turn answers the question and settles.

4. The child's final text blocks are joined and returned as a
   `{ kind: "success", text }` command result.

## Why the answer never pollutes the main context

Command results are rendered by the UI adapter and are **never appended to the
session log as model-visible messages**. `/btw` therefore shows the answer
without spending a single main-context token on it — that is the "no pollution"
guarantee, provided by the harness command architecture rather than by this
plugin.

## Provider choice

- `fork` (default): the child is seeded with the parent's completed turns — the
  side question is answered "with context".
- `spawn`: fully standalone child with zero inherited context.

`maxDepth` caps the child's own subagent delegation depth; it is passed through
only when configured.

## Failure mapping

Non-`completed` stop reasons (`max-tokens` / `aborted` / `refusal` / `error`)
map to concise human errors, and any preserved partial output is appended so no
work is lost. Start failures, missing providers, empty answers, and run
disposal failures are surfaced as `error` results — the handler never throws
out of the command boundary.

## Tests

`test/index.test.js` exercises the handler against a stubbed `ctx.subagents`
seam — no live model or harness host is required. Run with `npm test`.
