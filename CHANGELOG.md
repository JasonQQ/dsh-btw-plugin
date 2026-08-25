# Changelog

All notable changes to `@jasonqq/dsh-btw-plugin` are documented here.

## 0.1.0 — 2026-08-25

Initial release.

- `/btw <question>` command registered through the harness command registry
  (`@deepseek-ai/dsh-commands`).
- Side questions delegated to a conversation-seeded subagent
  (`ctx.subagents.start("fork", …)`), so the answer uses the main context
  without entering its model history.
- Config: `provider` (default `fork`, `spawn` supported) and optional
  `maxDepth`.
- Robust failure handling: empty input, missing provider, non-`completed`
  stop reasons (max-tokens / aborted / refusal / error) with partial-output
  preservation, start and disposal failures.
- 17 unit tests with a stubbed `ctx.subagents` seam.
- Published to GitHub Packages as `@jasonqq/dsh-btw-plugin@0.1.0` and
  installable from source via the `dsh.bundle` manifest.
