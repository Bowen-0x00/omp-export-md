# 📑 omp-export-md

**Clean, Intelligent Markdown Session Exporter for Oh My Pi (OMP)**  
*智能优雅的 Oh My Pi (OMP) 会话 Markdown 导出工具*

[English](README_EN.md) | [中文说明](README.md)

---

## 🌟 Key Features

- 🧠 **Intelligent Topic Naming (`{name}`)**: Leverages background ephemeral reasoning (`minimizeEffort: true`) with the active model to synthesize concise, meaningful topic names without user manual intervention. Gracefully falls back to extracting the first user clause if offline.
- 🕒 **Standardized Local Timestamp**: Formats filenames using local timezone timestamps: `YYYYMMDD_HHmmss` (e.g. `20261021_144009`), eliminating the UTC 8-hour gap and the awkward ISO `T` delimiter.
- 📑 **Dedicated Icon & TUI Autocomplete Integration**:
  - Overcomes OMP's default generic puzzle piece icon (`🧩`) for extension commands by dynamically injecting a dedicated document icon (`📑` / Nerd Font `\uF15C`) in the terminal autocomplete popup.
  - Upgrades visual glyphs for thinking blocks (`🧠`), tool invocations (`🛠️`), and execution outputs (`📦`).
- 🧼 **Clean Reading Mode (`--clean`)**: Strips empty `## 🤖 Assistant` headers and redundant blank lines produced by intermediate tool turns, condensing dialogues by ~45% for effortless note-taking in Obsidian and Notion.
- 🔖 **Session ID Header Persistence**: Clearly documents the full Session ID in the Markdown header metadata, allowing quick resumption via `omp --resume <id>`.
- ⚡ **Offline Standalone CLI (`omp2md`)**: Includes an independent terminal utility `omp2md` that scans and converts recent sessions directly from the shell without launching OMP.
- 📖 **Comprehensive Built-in Help & Autocomplete**: Intercepts `/md help` and `/md -h` to output interactive documentation without generating unwanted files, accompanied by real-time argument autocompletions.

---

## 🆚 Feature Comparison

| Feature | OMP Native `/export` | OMP Native `omp render` | **omp-export-md (`/md`)** |
| :--- | :---: | :---: | :---: |
| **Output Format** | Single-file HTML | ANSI Terminal Text | **Standard GitHub Flavored Markdown** |
| **Notes App Compatibility** | ❌ Browser-viewable only; hard to edit | ❌ Plain text; lacks structured hierarchy | **✅ Optimized for Obsidian, Notion, Logseq** |
| **Filename Resolution** | Fixed or manual | Stdout redirection | **✅ AI Topic Synthesis + Local Timestamp** |
| **Intermediate Log Bloat** | Preserves all DOM nodes | Raw terminal escape logs | **✅ Clean mode (`--clean`) supported** |
| **Thinking Chains** | HTML collapsed blocks | Expanded terminal output | **✅ Native collapsible `<details>` blocks** |
| **Offline CLI** | Requires exact session path | Requires OMP wrapper | **✅ `omp2md` auto-detects recent sessions** |

---

## 🚀 Quick Installation

### Method 1: Git Clone Installation (Recommended)

```bash
# 1. Clone this repository
git clone https://github.com/Bowen-0x00/omp-export-md.git
cd omp-export-md

# 2. Run the global installer (installs to ~/.omp/agent/extensions & ~/.local/bin)
./install.sh
```

### Method 2: Project-Scoped Installation
If you prefer enabling this extension only within a specific project directory:
```bash
./install.sh -p /path/to/your/project
```

---

## 📖 Usage Guide

### 1. In-Session Command: `/md` (`/export-md`)

```text
Usage:
  /md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]
  /export-md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]
  /md help
```

#### Examples
- **Smart Topic Export (Default)**:
  ```bash
  /md
  # Automatically infers topic: omp-chat-CXL-Cache-Hierarchy-20261021_144009.md
  ```
- **Clean Mode (Hides intermediate tool calls and thinking details)**:
  ```bash
  /md --clean
  # Shorthand:
  /md -c
  ```
- **Custom Filename**:
  ```bash
  /md my_analysis --clean
  # Output: my_analysis.md
  ```
- **Append Session ID to Filename**:
  ```bash
  /md --clean --full-id
  # Output: omp-chat-CXL-Cache-Hierarchy-01a15c9c-20261021_144009.md
  ```
- **View Help Documentation**:
  ```bash
  /md help
  # or /md -h / /md --help
  ```

#### Command Options
| Option | Shorthand | Description |
| :--- | :---: | :--- |
| `[filename]` | None | Custom export filename (with or without `.md` extension) |
| `--clean` | `-c` | **Clean Mode**: Strips tool executions and thinking blocks; consolidates replies |
| `--no-tools` | `-T` | **Hide Tools**: Only hides tool calls and results, keeping thinking details |
| `--no-thinking`| None | **Hide Thinking**: Only hides reasoning chain, keeping tool execution logs |
| `--full-id` | None | Appends session short ID to the generated filename |
| `--help` | `-h` | Displays interactive help documentation and usage examples |

---

### 2. Standalone Shell CLI: `omp2md`

When you have already exited your OMP session, run `omp2md` directly in your terminal without re-opening OMP:

```bash
# Auto-detects and exports the latest session in current or recent workspaces
omp2md

# Export in clean reading mode
omp2md --clean

# Export with custom output file
omp2md -o research_summary.md

# Convert an explicit session.jsonl file
omp2md ~/.omp/agent/sessions/--path--/session.jsonl
```

---

## 📂 Repository Structure

```text
omp-export-md/
├── extensions/
│   └── export-md.ts       # OMP /md & /export-md extension implementation
├── bin/
│   └── omp2md             # Standalone offline terminal utility
├── install.sh             # One-click installation script
├── uninstall.sh           # One-click uninstallation script
├── package.json           # Package metadata declaration
├── LICENSE                # MIT Open Source License
├── README.md              # Chinese Documentation
└── README_EN.md           # English Documentation
```

---

## 🗑️ Uninstallation

```bash
# Global uninstallation
./uninstall.sh

# Keep the standalone omp2md tool while removing the OMP extension
./uninstall.sh --keep-cli
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
