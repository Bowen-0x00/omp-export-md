# 📑 omp-export-md

**智能优雅的 Oh My Pi (OMP) 会话 Markdown 导出工具**  
*Clean, Intelligent Markdown Session Exporter for Oh My Pi (OMP)*

[English](README_EN.md) | [中文说明](README.md)

---

## 🌟 核心特性

- 🧠 **智能主题命名 (`{name}`)**：默认在后台以极轻推理（`minimizeEffort: true`）提炼会话核心议题作为文件名，无需人工命名；离线或无网时自动提取对话首句关键短语优雅降级。
- 🕒 **本地化时间戳规范**：采用清晰规范的本地时区时间戳 `YYYYMMDD_HHmmss`（例如：`20261021_144009`），彻底去除 UTC 8小时时区偏差与 ISO 留下的突兀 `T` 字符。
- 📑 **专属图标与 TUI 视觉重构**：
  - 突破 OMP 对扩展命令默认显示拼图图标（`🧩`）的限制，在终端补全菜单中动态适配为专属文档图标（`📑` / Nerd Font `\uF15C`）。
  - 全面升级思考过程（`🧠`）、工具调用（`🛠️`）和执行产物（`📦`）视觉标签。
- 🧼 **纯净阅读模式 (`--clean`)**：彻底剔除工具调用中间轮次产生的空白 `## 🤖 Assistant` 标题与多余空行，聚合连续发言，篇幅缩减近半，完美契合 Obsidian / Notion 沉淀。
- 🔖 **会话 ID 头部持久化**：完整记录会话 ID 于 Markdown 文件头部元数据中，随时支持使用 `omp --resume <id>` 恢复对应历史。
- ⚡ **离线命令行工具 (`omp2md`)**：附带独立的 Shell 命令 `omp2md`，即使退出了 omp，也能在终端一键将当前目录或全局最近的会话导出为规范 Markdown。
- 📖 **完善的内置帮助与补全**：内置 `/md help` 与 `/md -h` 帮助拦截分发（绝不误导出多余文件），支持 TUI 参数实时补全提示。

---

## 🆚 功能对比

| 特性 | OMP 原生 `/export` | OMP 原生 `omp render` | **omp-export-md (`/md`)** |
| :--- | :---: | :---: | :---: |
| **输出格式** | 单文件 HTML | 终端 ANSI 控制台文本 | **规范 GitHub Flavored Markdown** |
| **笔记软件兼容性** | ❌ 仅供浏览器查看，难二次编辑 | ❌ 纯文本，无结构化大纲 | **✅ 完美适配 Obsidian / Notion / Logseq** |
| **文件名生成** | 用户指定或默认 | 控制台 stdout 抓取 | **✅ 智能提取主题 + 本地时间戳** |
| **中间中继噪音** | 带有全部 Web 节点 | 带有大量原始控制符 | **✅ 支持 `--clean` 纯净阅读模式** |
| **思维链 (Thinking)** | 折叠 HTML 块 | 控制台展开 | **✅ 原生 `<details>` 折叠语法** |
| **离线独立 CLI** | 需指定完整 session 路径 | 需通过 omp 调用 | **✅ `omp2md` 自动扫描最近会话一键导出** |

---

## 🚀 快速安装

### 方式一：OMP 原生命令一键安装（最简推荐 ⭐️）

在任何终端中直接运行 OMP 原生包管理命令：
```bash
omp install github:Bowen-0x00/omp-export-md
```
> 或通过完整 URL 安装：
> ```bash
> omp install https://github.com/Bowen-0x00/omp-export-md
> ```

### 方式二：Git 克隆一键安装（含离线命令行工具 omp2md）

如果你同时需要安装独立的终端离线命令 `omp2md`（可直接在 shell 中导出刚退出的会话）：
```bash
git clone https://github.com/Bowen-0x00/omp-export-md.git
cd omp-export-md
./install.sh
```

### 方式三：单项目级安装
如果你希望仅在特定工程目录下生效：
```bash
./install.sh -p /path/to/your/project
```
---

## 📖 使用指南

### 1. 会话内命令：`/md` (`/export-md`)

```text
用法：
  /md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]
  /export-md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]
  /md help
```

#### 常用示例
- **智能主题导出（默认推荐）**：
  ```bash
  /md
  # 自动调用模型提炼主题，输出: omp-chat-CXL内存池缓存设计-20261021_144009.md
  ```
- **纯净阅读模式（剔除工具执行详情与折叠思考）**：
  ```bash
  /md --clean
  # 或使用简写：
  /md -c
  ```
- **指定自定义文件名**：
  ```bash
  /md my_analysis --clean
  # 输出: my_analysis.md
  ```
- **导出文件名附带会话 ID**：
  ```bash
  /md --clean --full-id
  # 输出: omp-chat-CXL内存池缓存设计-01a15c9c-20261021_144009.md
  ```
- **查看帮助文档**：
  ```bash
  /md help
  # 或 /md -h / /md --help
  ```

#### 参数选项说明
| 参数 | 简写 | 功能说明 |
| :--- | :---: | :--- |
| `[filename]` | 无 | 指定导出文件名（可带或不带 `.md` 后缀） |
| `--clean` | `-c` | **纯净模式**：隐藏工具调用、工具返回和折叠思考，合并连续发言 |
| `--no-tools` | `-T` | **隐藏工具**：仅隐藏工具调用与返回报文，保留思维链折叠块 |
| `--no-thinking`| 无 | **隐藏思考**：仅隐藏思维链（Thinking），保留工具调用 |
| `--full-id` | 无 | 在导出的文件名中附加会话短 ID 前缀 |
| `--help` | `-h` | 显示命令帮助文档与详细用法 |

---

### 2. 终端离线 CLI：`omp2md`

当你已经退出了 omp 会话，无需重新启动 omp，直接在终端执行 `omp2md` 即可：

```bash
# 自动定位当前工作目录（或最近工程）最近的一次会话并导出
omp2md

# 以纯净模式导出
omp2md --clean

# 指定输出文件名
omp2md -o research_summary.md

# 导出指定 session.jsonl 路径
omp2md ~/.omp/agent/sessions/--path--/session.jsonl
```

---

## 📂 项目结构

```text
omp-export-md/
├── extensions/
│   └── export-md.ts       # OMP /md & /export-md 扩展核心实现
├── bin/
│   └── omp2md             # 独立离线命令行工具
├── install.sh             # 一键安装脚本（支持全局与项目级）
├── uninstall.sh           # 一键卸载脚本
├── package.json           # 项目元数据声明
├── LICENSE                # MIT 开源许可证
├── README.md              # 中文使用文档
└── README_EN.md           # 英文使用文档
```

---

## 🗑️ 卸载
```bash
# 如果是通过 omp install 安装：
omp plugin uninstall omp-export-md

# 如果是通过 install.sh 脚本安装：
./uninstall.sh

# 保留 omp2md 独立命令行工具，仅卸载 omp 扩展
./uninstall.sh --keep-cli
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 开源。
