#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat << 'EOF'
📑 OMP Markdown Exporter Uninstaller

Usage:
  ./uninstall.sh [options]

Options:
  --global, -g           Uninstall globally from ~/.omp/agent/ (default)
  --project, -p <dir>    Uninstall locally from a specific project (<dir>/.omp/)
  --keep-cli             Do not remove the standalone 'omp2md' binary in ~/.local/bin/
  --help, -h             Show this help message
EOF
}

TARGET_MODE="global"
PROJECT_DIR=""
REMOVE_CLI=true

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
    --keep-cli)
      REMOVE_CLI=false
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
  TARGET_EXT="$HOME/.omp/agent/extensions/export-md.ts"
else
  TARGET_EXT="$PROJECT_DIR/.omp/extensions/export-md.ts"
fi

if [[ -f "$TARGET_EXT" ]]; then
  rm -v "$TARGET_EXT"
  echo "🗑️ Removed extension: $TARGET_EXT"
else
  echo "ℹ️ Extension not found at: $TARGET_EXT"
fi

if [[ "$REMOVE_CLI" == true && -f "$HOME/.local/bin/omp2md" ]]; then
  rm -v "$HOME/.local/bin/omp2md"
  echo "🗑️ Removed CLI tool: $HOME/.local/bin/omp2md"
fi

echo "✅ Uninstallation complete."
