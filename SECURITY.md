# Security

The plugin has no network surface, no credentials, and no install-time scripts:
it registers one slash command that delegates to the harness's own subagent
seam.

- The command runs entirely in-process; the subagent child inherits the
  parent's existing sandbox and permission policy through the harness's
  delegation machinery (`applyChildComposition` / delegated policy overrides).
- The plugin never reads secrets, environment variables, or files. It forwards
  only the invocation's text to the configured subagent provider.
- Dependencies: a single `@deepseek-ai/schemastery` peer, which the harness
  runtime provides.

To report a vulnerability, open a GitHub issue on this repository (use a
private/security issue if available) or contact the maintainer directly.
