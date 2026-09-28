# @jasonqq/dsh-btw-plugin v0.1.1

Compatibility-declaration release — **no runtime changes**.

## Compatibility

| Harness (`@deepseek-ai/dsh-*`) | cordis | schemastery | Status                                                       |
| ------------------------------ | ------ | ----------- | ------------------------------------------------------------ |
| `0.1.5-rc.2`                   | 4.0.2  | 3.18.2      | ✅ Verified — DSH Desktop 2.0.13, end-to-end `/btw` run       |
| `0.1.1-rc.2`                   | 4.0.1  | 3.18.1      | ✅ Verified — DSH Desktop 2.0.3                               |

`/btw` was exercised end-to-end on harness `0.1.5-rc.2`: the command dispatched,
a one-shot `fork` child started (label `btw`), the answer came back as a
`kind: "success"` command result, and nothing entered the main session history.

## Changes

- `peerDependencies` now declares the harness services this plugin integrates
  with — `@deepseek-ai/dsh-commands`, `@deepseek-ai/dsh-subagent` and
  `@deepseek-ai/cordis` — with each verified line spelled out explicitly
  (`0.1.1-rc.2`, `0.1.5-rc.2`). npm's prerelease rule makes the widespread
  pattern `^0.1.0-rc.8 || >=0.1.1-rc.0 <0.2.0` **miss** `0.1.5-rc.2`, so the
  union is explicit on purpose.
- The harness peers are marked `peerDependenciesMeta.optional`: a profile injects
  those services at load time, so no package manager installs the host harness.
- Added `engines.node: ">=22.19.0"`.
- Both READMEs gained a Compatibility section; the CHANGELOG records the above.

## Artifact

`jasonqq-dsh-btw-plugin-0.1.1.tgz` (attached to this release by the `Release`
workflow). Local build checksum, for reference:

```
size    7930 bytes
sha512  MzSS+5qjxyWQocRsxYOSxS7wCanjUQFAn4OF1q5WRvzao7tiU9gm36FrWL9Bf/n7y0nTlUSSnKJU+W04txzmBg==
```
