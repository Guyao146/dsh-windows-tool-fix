# dsh-windows-tool-fix

`dsh-windows-tool-fix` 是一个面向 DeepSeek Harness（DSH）Desktop 的 Windows 配置插件。
它针对 Windows 上 DSH 默认 `minimal` Agent preset 使用持久 PTY 时出现的错误：

```text
subprocess-local: terminal inspection is unsupported on platform win32
```

插件通过 DSH profile patch 将 `minimal-gitbash` 设置为新会话的默认 Agent preset，
让命令通过 Git for Windows Bash 的 subprocess 执行，而不是进入 Windows 不支持的
持久 PTY 检查路径。插件不修改 DSH 安装目录、`app.asar` 或官方 shipped preset。

## 功能特性

- Windows 环境下自动将新会话默认 preset 设置为 `minimal-gitbash`。
- 复用 `@icelily/dsh-gitbash-preset` 提供的 Git Bash 执行器。
- 保留 `bash` 与 `str_replace_editor` 工具入口，不要求每次手动切换 preset。
- 通过 DSH subprocess seam 处理命令执行、输出收集、超时和进程清理。
- 不绕过 DSH 的 sandbox、审批或单次权限升级机制。
- 不写入 DSH Desktop 安装目录，不覆盖官方 preset 文件。
- 支持通过移除插件和恢复默认设置回滚。

## 环境要求

- 已安装并能正常运行的 DSH Desktop。
- Windows 系统。
- Node.js `>=20`。
- DSH profile 能够加载本地插件和 `cordis.patch.yml`。
- 已安装 `@icelily/dsh-gitbash-preset`，并且用户 preset 目录中存在
  `minimal-gitbash`。
- 已安装 Git for Windows，并能找到 `bash.exe`。

Git Bash 的默认探测路径包括：

```text
C:\Program Files\Git\bin\bash.exe
```

## 安装

### 安装 Git Bash preset

先安装 Windows Git Bash preset：

```cmd
dsh plugin --profile desktop add @icelily/dsh-gitbash-preset
```

### 安装本插件

从 GitHub 安装：

```cmd
dsh plugin --profile desktop add Guyao146/dsh-windows-tool-fix
```

也可以安装本地目录或 Release 包：

```cmd
dsh plugin --profile desktop add file:C:/path/to/dsh-windows-tool-fix
```

或者使用 GitHub Release 中的 `.tgz` 包：

```cmd
dsh plugin --profile desktop add https://github.com/Guyao146/dsh-windows-tool-fix/releases/download/v0.2.0/dsh-windows-tool-fix-0.2.0.tgz
```

安装完成后，请完全重启 DSH Desktop。

## 使用方法

1. 安装 `@icelily/dsh-gitbash-preset`。
2. 安装 `dsh-windows-tool-fix`。
3. 完全重启 DSH Desktop。
4. 新建一个会话。
5. 不需要手动选择 preset，直接使用 `bash` 工具执行命令，例如：

   ```bash
   pwd
   echo hello
   ```

检查插件是否安装：

```cmd
dsh plugin --profile desktop list
```

检查 profile 是否能正常解析：

```cmd
dsh --profile desktop --dump-config
```

输出中的 `agent-presets` 配置应包含：

```yaml
default: minimal-gitbash
```

### 已有会话说明

DSH 会保存会话创建时使用的 Agent preset。已有的、仍然使用 `minimal` 的会话不会被
插件自动迁移。请新建会话测试；如果 settings 文件中显式保存了旧默认值，也需要将：

```yaml
agent-presets:
  default: minimal-gitbash
```

写入 `DSH_HOME/settings.yaml`。

## 沙箱与权限

`minimal-gitbash` 使用 Git for Windows 的 MSYS 运行时。在 Windows 受限令牌沙箱中，
MSYS 可能无法创建 signal pipe，因此命令执行可能需要：

- 将会话切换到 `danger-full-access`；或
- 对单次工具调用使用 DSH 的 `sandbox_permissions: "danger-full-access"`，并提供理由。

这是执行后端的兼容性限制。本插件不会自动提升权限，也不会绕过 DSH 的审批流程。

## 工作原理

插件通过 `package.json` 中的 `dsh.bundle.patch` 声明 `cordis.patch.yml`。补丁只覆盖
profile 中 `agent-presets` 行的默认配置：

```yaml
- insert:
    - id: dsh-windows-tool-fix
      name: dsh-windows-tool-fix

- id: agent-presets
  config:
    default: minimal-gitbash
```

实际执行器来自已经安装的 `minimal-gitbash` preset。插件自身不复制、不修改 DSH
安装目录中的 preset 文件。

## 已知限制

- 只处理 DSH profile 的默认 Agent preset，不会迁移已经创建的会话。
- 依赖 `@icelily/dsh-gitbash-preset`；未安装该 preset 时，默认值会指向不可用的
  preset。
- 依赖 Git for Windows；不会自动安装 Git，也不会使用 WSL Bash 作为替代品。
- Git Bash preset 按次启动 shell，跨调用不保证保持 `cd`、`export` 等交互状态。
- Git Bash 在 Windows 受限 sandbox 中的 MSYS signal pipe 限制仍然存在。
- Windows 以外的平台不会应用该插件的默认设置。

## 回滚

移除插件：

```cmd
dsh plugin --profile desktop remove dsh-windows-tool-fix
```

然后将 `settings.yaml` 中的默认 preset 恢复为原值，例如：

```yaml
agent-presets:
  default: minimal
```

最后重启 DSH Desktop。

## 许可证

本项目使用 **GNU Lesser General Public License, Version 2.1 or later（LGPL-2.1-or-later）**，完整文本见
仓库根目录的 [`LICENSE`](./LICENSE) 文件。

`@icelily/dsh-gitbash-preset` 及其依赖包遵循各自的许可证。

## About

DSH Windows Tool Fix：为 Windows 上的 DSH Desktop 提供不修改官方安装文件的默认
Git Bash preset 配置修复。

GitHub：<https://github.com/Guyao146/dsh-windows-tool-fix>