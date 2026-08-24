/**
 * Codex-style `/btw` for DeepSeek Harness.
 * @module dsh-btw-plugin
 */
/** Plugin identity: registered under the `dsh-btw-plugin` name. */
export declare const name: "dsh-btw-plugin";
/** Required services: the command registry and the subagent seam. */
export declare const inject: ["commands", "subagents"];
/** Validated plugin configuration. */
export interface Config {
	/** Subagent provider used for the side question. Defaults to `"fork"` (conversation-seeded). */
	provider?: string;
	/** Optional recursion-depth cap for the child; defaults to the harness default when omitted. */
	maxDepth?: number;
}
/**
 * Register `/btw` for every composed human-command adapter.
 * @param ctx - context carrying the command registry and the subagent seam.
 * @param config - validated plugin config.
 */
export declare function apply(ctx: any, config: Config): void;
export { Config as default };
