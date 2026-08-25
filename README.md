# dsh-windows-tool-fix

`dsh-windows-tool-fix` 是一个面向 DeepSeek Harness（DSH）Desktop 的 Windows 配置插件。
它解决 Windows 上默认 `minimal` Agent preset 使用持久 PTY 时触发的错误：

```text
subprocess-local: terminal inspection is unsupported on platform win32
```

插件不修改 DSH 安装目录，不改写 `app.asar` 或官方 shipped preset；它只在 profile
patch 层把 `minimal-gitbash` 设置为新的 Agent preset 默认值。新建会话会自动使用
Git Bash 变体，因此不需要每次手动切换 preset。

## 功能特性

- **Windows 默认 preset 修复**：将 `agent-presets.default` 设置为 `minimal-gitbash`。
- **不修改官方文件**：不写入 DSH Desktop 安装目录，也不覆盖官方 preset。
- **保留原有工具入口**：实际执行由已安装的 `minimal-gitbash` preset 提供，模型仍使用
  `bash` 和 `str_replace_editor` 工具。
- **复用 DSH subprocess seam**：Git Bash 执行器使用 DSH 的子进程、输出收集、超时和
  进程清理机制。
- **保留沙箱边界**：插件不绕过 DSH 审批或 sandbox policy。
- **可回滚**：删除插件并恢复 settings 中的默认 preset 即可撤销配置。

## 环境要求

- Windows 系统上的 DSH Desktop。
- Node.js `>=20`（由 `package.json` 声明）。
- 当前 profile 已安装 `@icelily/dsh-gitbash-preset`，并且用户 preset 目录中存在
  `minimal-gitbash`。
- Git for Windows，默认探测路径包括：
  `C:\Program Files\Git\bin\bash.exe`。
- DSH Desktop 能够加载 profile bundle patch。

## 安装

### 从 GitHub 安装

将 `<owner>/<repo>` 替换为本仓库地址：

```cmd
dsh plugin --profile desktop add <owner>/<repo>
```

也可以安装仓库中的本地目录：

```cmd
dsh plugin --profile desktop add file:C:/path/to/dsh-windows-tool-fix
```

安装完成后重启 DSH Desktop。

### 前置安装 Git Bash preset

本插件只负责选择默认 preset，不会把 `minimal-gitbash` 的执行器复制到 DSH 安装目录。
请先安装并确认以下 preset 可用：

```cmd
dsh plugin --profile desktop add @icelily/dsh-gitbash-preset
```

然后安装本插件：

```cmd
dsh plugin --profile desktop add <owner>/<repo>
```

## 使用方法

1. 安装 `@icelily/dsh-gitbash-preset`。
2. 安装 `dsh-windows-tool-fix`。
3. 完全重启 DSH Desktop。
4. 新建会话，不需要手动选择 preset。
5. 使用 `bash` 工具执行简单命令，例如：

   ```bash
   pwd
   echo hello
   ```

已有会话会保存创建时的 Agent preset，不会被插件自动迁移。请新建会话验证修复效果。

## 沙箱与权限

Git for Windows 使用 MSYS 运行时。根据 `minimal-gitbash` preset 的限制，MSYS 在
Windows 受限令牌沙箱中可能无法创建 signal pipe。因此命令执行可能要求：

- 将会话切换到 `danger-full-access`；或
- 对单次工具调用使用 DSH 提供的 `sandbox_permissions: "danger-full-access"`，并提供理由。

这是执行后端的兼容性限制，不是本插件绕过安全策略。插件不会自动提升权限。

## 工作原理

插件包通过 `package.json` 中的 `dsh.bundle.patch` 声明
`cordis.patch.yml`。补丁包含两部分：

```yaml
- insert:
    - id: dsh-windows-tool-fix
      name: dsh-windows-tool-fix

- id: agent-presets
  config:
    default: minimal-gitbash
```

其中 `agent-presets` 的用户设置优先级高于 profile 默认值。如果 settings 中已经存在
`agent-presets.default`，需要将它改为 `minimal-gitbash`，否则 DSH 会继续使用旧的
`minimal` preset。

## 验证

查看 profile 中是否出现插件：

```cmd
dsh plugin --profile desktop list
```

检查 profile 配置是否成功解析：

```cmd
dsh --profile desktop --dump-config
```

输出中应能看到：

```yaml
default: minimal-gitbash
```

## 回滚

移除插件：

```cmd
dsh plugin --profile desktop remove dsh-windows-tool-fix
```

如果此前手动修改过 settings，请将：

```yaml
agent-presets:
  default: minimal-gitbash
```

恢复为原来的 preset，例如：

```yaml
agent-presets:
  default: minimal
```

修改后重启 DSH Desktop。

## 已知限制

- 只处理 DSH profile 的默认 Agent preset，不修改已经创建的会话。
- 依赖 `minimal-gitbash` preset；没有安装该 preset 时，默认值会指向一个不可用的
  preset。
- 依赖 Git for Windows；插件不会安装 Git，也不会自动选择 WSL Bash。
- Git Bash 变体是按次启动 shell，不保证跨调用保持 `cd`、`export` 等交互状态。
- Git Bash 在受限 Windows sandbox 中的 MSYS signal pipe 限制仍然存在。

## 许可证

MIT License

本插件仅包含 DSH profile patch；`minimal-gitbash` preset 及其依赖包遵循各自的许可证。
