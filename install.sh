#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
  cat << 'EOF'
📑 OMP Markdown Exporter Installer

Usage:
  ./install.sh [options]

Options:
  --global, -g           Install globally for all omp sessions (default: ~/.omp/agent/)
  --project, -p <dir>    Install locally for a specific project (<dir>/.omp/)
  --no-cli               Do not install the standalone 'omp2md' CLI tool to ~/.local/bin/
  --help, -h             Show this help message

Examples:
  ./install.sh                     # Install globally to ~/.omp/agent/ & ~/.local/bin/
  ./install.sh -p /path/to/project # Install locally for a specific project
EOF
}

TARGET_MODE="global"
PROJECT_DIR=""
INSTALL_CLI=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    -g|--global)
      TARGET_MODE="global"
      shift
      ;;
    -p|--project)
      TARGET_MODE="project"
      PROJECT_DIR="${2:-}"
      if [[ -z "$PROJECT_DIR" ]]; then
        echo "❌ Error: --project requires a directory path." >&2
        exit 1
      fi
      shift 2
      ;;
    --no-cli)
      INSTALL_CLI=false
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1" >&2
      show_help
      exit 1
      ;;
  esac
done

if [[ "$TARGET_MODE" == "global" ]]; then
  DEST_EXT="$HOME/.omp/agent/extensions"
  echo "📦 Installing extension globally to ~/.omp/agent/extensions/..."
else
  DEST_EXT="$PROJECT_DIR/.omp/extensions"
  echo "📦 Installing extension locally to $PROJECT_DIR/.omp/extensions/..."
fi

mkdir -p "$DEST_EXT"
cp -v "$SCRIPT_DIR/extensions/export-md.ts" "$DEST_EXT/"

if [[ "$INSTALL_CLI" == true && -f "$SCRIPT_DIR/bin/omp2md" ]]; then
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
  cp -v "$SCRIPT_DIR/bin/omp2md" "$BIN_DIR/omp2md"
  chmod +x "$BIN_DIR/omp2md"
  echo "⚙️ Installed standalone CLI tool to $BIN_DIR/omp2md"
fi

cat << 'EOF'

✨ Installation complete!

Available commands:
  1. Inside OMP interactive chat:
     /md                     # Export with smart AI topic & local timestamp
     /md --clean             # Clean mode (concise text, no intermediate tool logs)
     /md my-notes            # Export with custom filename
     /md help                # View full help guide and options

  2. In Linux / macOS terminal:
     omp2md                  # One-click offline export of recent session to Markdown
     omp2md --clean          # Clean offline export
EOF
