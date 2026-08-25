# @jasonqq/dsh-btw-plugin

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 实现 Codex 风格的 `/btw` 指令。

`/btw <question>` 会在**以主会话为上下文的子上下文中**回答一个附带问题，并把答案直接显示在对话里，**绝不写入主会话的模型历史**。想"顺便问一句"的时候尽管问——主上下文始终保持干净。

## 工作原理

- 指令通过 `@deepseek-ai/dsh-commands` 注册（与 `/compact`、`/goal`、`/plan` 同一注册表）。
- 问题通过 `ctx.subagents.start("fork", …)` 委派给子代理。`fork` 提供方会创建一个**以父会话已完成轮次为种子**的子代理，因此附带问题能基于完整的主会话上下文来回答。
- 子代理的答案以普通指令结果返回。指令结果由 UI 适配器直接渲染，**永远不会进入模型历史**——这就是"不污染上下文"的保证。

## 用法

在任意会话输入框中：

```
/btw <问题>
```

答案会以指令结果卡片的形式显示。它不会成为主模型可见的消息，你可以自己参考它而无需撑大上下文。

## 安装

本插件是一个 Cordis 插件，可接入任意挂载了 `@deepseek-ai/dsh-commands` 与 `@deepseek-ai/dsh-subagent` 的 profile（两者都在随附的 `@deepseek-ai/dsh-base` 组合中）。

1. 让包从 profile 可解析，例如链接到共享 profile 存储：

   ```bash
   mkdir -p ~/.dsh/profiles/node_modules/@jasonqq
   ln -s "$PWD" ~/.dsh/profiles/node_modules/@jasonqq/dsh-btw-plugin
   ```

2. 在 profile 补丁层（`~/.dsh/profiles/<profile>/cordis.patch.yml`）中加入：

   ```yaml
   - insert:
       - id: btw
         name: @jasonqq/dsh-btw-plugin
         config:
           provider: fork
   ```

   profile 补丁在启动时读取。桌面应用中，编辑后需要重启应用才能生效（CLI 的 `dsh web` 运行器会热重载补丁）。

## 配置

| 键         | 默认值   | 说明                                                                                              |
| ---------- | ------- | ------------------------------------------------------------------------------------------------- |
| `provider` | `"fork"` | 子代理提供方。`fork` 会以父会话已完成轮次作为子代理种子（能看到主上下文）；`spawn` 则创建完全独立的子代理。 |
| `maxDepth` | （未设）  | 可选的子代理递归深度上限；缺省时使用 harness 默认值。                                                |

## 开发

```bash
npm test
```

测试使用桩（stub）化的 `ctx.subagents` seam 来验证 handler，无需真实模型或宿主。

## License

MIT
