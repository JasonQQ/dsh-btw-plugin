# Changelog

All notable changes to `@jasonqq/dsh-btw-plugin` are documented here.

## 0.1.2 — 2026-10-01

- Declared harness `0.2.0-rc.2` support: the harness peer ranges gained an
  explicit `|| ^0.2.0-rc.2` branch (`@deepseek-ai/dsh-commands`,
  `@deepseek-ai/dsh-subagent`). The `0.2.0` tuple needs its own prerelease
  branch for the same node-semver reason as in 0.1.1 — a range ending on the
  `0.1.x` lines does not reach `0.2.0-rc.2`.
- Verified against DSH Desktop 2.0.17 (harness `0.2.0-rc.2`, cordis 4.0.4,
  schemastery 3.18.4): every contract this plugin uses is unchanged, and `/btw`
  ran end-to-end — command dispatched, one-shot `fork` child started, answer
  returned as a `success` command result, nothing written to the main history.
  The only contract difference is `SubagentResult.output` tightened to
  `readonly ContentBlock[]`, which this plugin's `filter`/`map` usage already
  satisfies.
- No runtime changes.

## 0.1.1 — 2026-09-23

- Declared harness compatibility in `peerDependencies`: the harness services this
  plugin integrates with (`@deepseek-ai/dsh-commands`, `@deepseek-ai/dsh-subagent`)
  and `@deepseek-ai/cordis` are now listed, with each verified line spelled out
  explicitly (`0.1.1-rc.2`, `0.1.5-rc.2`) because npm's prerelease rule makes the
  usual union pattern miss `0.1.5-rc.2`. The harness peers are marked
  `peerDependenciesMeta.optional` so a package manager never installs the host
  harness itself — the profile injects those services at load time. Added
  `engines.node`. No runtime change.
- Documented a compatibility matrix in both READMEs: verified end-to-end on
  DSH Desktop 2.0.13 (harness `0.1.5-rc.2`, cordis 4.0.2, schemastery 3.18.2)
  and previously on DSH Desktop 2.0.3 (harness `0.1.1-rc.2`).

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
