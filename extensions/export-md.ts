import type { ExtensionAPI, ExtensionCommandContext } from "@oh-my-pi/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

interface MessageContentItem {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  arguments?: Record<string, unknown>;
}

interface SessionMessage {
  role?: string;
  content?: string | MessageContentItem[];
  toolName?: string;
}

interface SessionEntry {
  type: string;
  message?: SessionMessage;
}

const HELP_TEXT = `# 📖 /md (/export-md) — 会话 Markdown 导出

将当前 OMP 会话记录导出为结构优雅、格式规范的 Markdown 文档，便于直接沉淀到个人笔记系统（如 Obsidian、Notion）或作为归档记录。

---

### 🚀 常用指令
- \`/md\`
  ➔ 使用当前模型在后台以轻量推理提炼核心主题，导出为 \`omp-chat-{name}-{YYYYMMDD_HHmmss}.md\`。
- \`/md [文件名]\`
  ➔ 指定自定义文件名导出（如 \`/md my-notes\` ➔ \`my-notes.md\`）。
- \`/md --clean\` 或 \`/md -c\`
  ➔ **纯净阅读模式**：合并连续发言，剔除工具执行中继与折叠思考，篇幅精炼 ~45%。
- \`/md --full-id\`
  ➔ 导出文件名中附加完整会话短 ID（如 \`omp-chat-{name}-01a15c9c-{time}.md\`）。
- \`/md help\` 或 \`/md -h\`
  ➔ 显示本帮助说明。

---

### ⚙️ 参数选项
| 参数 | 缩写 | 功能说明 |
| :--- | :--- | :--- |
| \`[filename]\` | 无 | 指定导出文件名（可带或不带 \`.md\` 后缀） |
| \`--clean\` | \`-c\` | **纯净模式**：隐藏工具调用、工具返回和折叠思考 |
| \`--no-tools\` | \`-T\` | **隐藏工具**：仅隐藏工具调用与工具返回，保留折叠思考 |
| \`--no-thinking\` | 无 | **隐藏思考**：仅隐藏思维链（Thinking），保留工具调用 |
| \`--full-id\` | 无 | 在导出的文件名中附加会话短 ID 前缀 |
| \`--help\` | \`-h\` | 显示帮助文档与使用示例 |

---

### 💡 智能命名与时间规则
1. **智能主题提取**：
   - 默认利用当前模型在后台发起临时轻量推理（\`minimizeEffort: true\`，不污染主会话），智能提炼 4~20 字符的核心主题。
   - 若模型调用失败或处于无网络环境，自动平滑降级为提取会话首条有效输入的关键短句。
2. **本地时间格式**：
   - 采用本地时区时间戳格式：\`YYYYMMDD_HHmmss\`（例如：\`20261021_144009\`）。
   - 彻底去除 UTC 8 小时时区偏差与 ISO \`T\` 字符。
3. **会话 ID 归档**：
   - 导出的 Markdown 文件头部元数据完整记录 \`会话 ID\`，随时支持使用 \`omp --resume <id>\` 恢复会话。
`;

function getEffectiveId(sessionId: string, sessionFile: string, full = false): string {
  if (sessionId && sessionId !== "session") {
    if (full) return sessionId;
    return sessionId.length > 8 ? sessionId.slice(0, 8) : sessionId;
  }
  if (sessionFile) {
    const base = path.basename(sessionFile, ".jsonl");
    const match = /_([a-zA-Z0-9-]+)$/.exec(base);
    if (match) {
      if (full) return match[1];
      return match[1].slice(0, 8);
    }
  }
  return "";
}

function formatLocalDateTime(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${mins}${secs}`;
}

function sanitizeTopicName(name: string): string {
  if (!name) return "";
  let clean = name
    .normalize("NFC")
    // 过滤文件系统不允许及 Shell 特殊符号（含中文全角标点）
    .replace(/[<>:"/\\|?*`'\p{Cc}\p{Cf}，。！？：；（）“”‘’【】《》、]+/gu, "-")
    .replace(/\s+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_")
    // 去除模型可能生成的重复前缀与后缀
    .replace(/^(omp[-_]chat|omp)[-_]/i, "")
    .replace(/\.md$/i, "")
    .replace(/^[.\s\-_]+|[.\s\-_]+$/gu, "");

  if (clean.length > 40) {
    clean = clean.slice(0, 40).replace(/[.\s\-_]+$/gu, "");
  }
  return clean;
}

function getFallbackTopic(branch: readonly unknown[]): string {
  for (const rawEntry of branch) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const entry = rawEntry as SessionEntry;
    if (entry.type === "message" && entry.message?.role === "user") {
      const content = entry.message.content;
      let text = "";
      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        text = content
          .filter(c => c.type === "text" && c.text)
          .map(c => c.text!)
          .join(" ");
      }
      text = text.trim();
      if (!text || text.startsWith("/")) continue;
      text = text.replace(/^#+\s*/, "").replace(/^[-*+]\s*/, "");
      const firstClause = text.split(/[，。！？\n,!?]/)[0].trim() || text.split("\n")[0].trim();
      const sanitized = sanitizeTopicName(firstClause);
      if (sanitized && sanitized.length >= 2) {
        return sanitized.slice(0, 30);
      }
    }
  }
  return "";
}

async function generateTopicWithModel(
  branch: readonly unknown[],
  ctx: ExtensionCommandContext
): Promise<string> {
  if (typeof ctx.runEphemeralTurn !== "function") {
    return getFallbackTopic(branch);
  }

  const hasUserMessage = branch.some(rawEntry => {
    if (!rawEntry || typeof rawEntry !== "object") return false;
    const entry = rawEntry as SessionEntry;
    return entry.type === "message" && entry.message?.role === "user";
  });
  if (!hasUserMessage) {
    return "";
  }

  try {
    const { replyText } = await ctx.runEphemeralTurn({
      tools: false,
      minimizeEffort: true,
      promptText: `请根据当前会话的上下文，提炼一个简短、准确的主题名称，用于导出 Markdown 文件的命名。
要求：
1. 提取本次对话的核心主题或解决的问题（如"优化omp导出命令"、"CXL内存池缓存设计"、"RISC-V仿真调试"）。
2. 简短精炼，建议 4 到 20 个字符，适合作为文件名的一部分。
3. 禁止包含 "omp"、"chat"、"对话"、"记录"、日期或文件扩展名。
4. 请直接输出符合以下格式的单个 JSON 对象，不要输出任何思考过程、额外解释或 Markdown 标记：
{"name": "简短主题"}`,
    });

    if (replyText) {
      let parsedName = "";
      const jsonMatch = replyText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.name === "string" && parsed.name.trim()) {
            parsedName = parsed.name.trim();
          } else if (typeof parsed.title === "string" && parsed.title.trim()) {
            parsedName = parsed.title.trim();
          }
        } catch {
          // ignore json parse error
        }
      }
      if (!parsedName) {
        const firstLine = replyText
          .split("\n")
          .map(l => l.trim())
          .find(l => l && !l.startsWith("```") && !l.startsWith("{") && !l.startsWith("}"));
        if (firstLine) {
          parsedName = firstLine.replace(/^["'`]+|["'`]+$/g, "");
        }
      }
      const sanitized = sanitizeTopicName(parsedName);
      if (sanitized) {
        return sanitized;
      }
    }
  } catch {
    // 模型不可用或网络异常时，优雅降级到本地规则提取
  }

  return getFallbackTopic(branch);
}

async function resolveTargetFileName(
  rawFileName: string,
  sessionId: string,
  sessionFile: string,
  branch: readonly unknown[],
  ctx: ExtensionCommandContext,
  useFullId = false
): Promise<string> {
  const effectiveId = getEffectiveId(sessionId, sessionFile, useFullId);
  const timeStr = formatLocalDateTime(new Date());

  if (rawFileName) {
    let clean = rawFileName;
    if (clean.endsWith(".md")) {
      clean = clean.slice(0, -3);
    }
    if (useFullId && effectiveId && !clean.includes(effectiveId)) {
      return `${clean}-${effectiveId}.md`;
    }
    return `${clean}.md`;
  }

  let topicName = await generateTopicWithModel(branch, ctx);
  if (!topicName) {
    topicName = effectiveId || "session";
  }

  if (useFullId && effectiveId && topicName !== effectiveId) {
    return `omp-chat-${topicName}-${effectiveId}-${timeStr}.md`;
  }

  return `omp-chat-${topicName}-${timeStr}.md`;
}

function formatMarkdown(
  branch: readonly unknown[],
  options: { includeTools: boolean; includeThinking: boolean }
): string {
  const sections: string[] = [];
  let currentRole: "user" | "assistant" | null = null;
  let currentContent: string[] = [];

  const flushRole = () => {
    if (currentRole && currentContent.length > 0) {
      const header = currentRole === "user" ? "## 👤 User" : "## 🤖 Assistant";
      const body = currentContent.join("\n\n").trim();
      if (body) {
        sections.push(`${header}\n\n${body}`);
      }
      currentContent = [];
    }
  };

  for (const rawEntry of branch) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const entry = rawEntry as SessionEntry;
    if (entry.type !== "message" || !entry.message) continue;
    const msg = entry.message;

    if (msg.role === "user") {
      const parts: string[] = [];
      if (typeof msg.content === "string" && msg.content.trim()) {
        parts.push(msg.content.trim());
      } else if (Array.isArray(msg.content)) {
        for (const item of msg.content) {
          if (item.type === "text" && item.text?.trim()) {
            parts.push(item.text.trim());
          }
        }
      }
      if (parts.length > 0) {
        flushRole();
        currentRole = "user";
        currentContent.push(...parts);
      }
    } else if (msg.role === "assistant") {
      const parts: string[] = [];
      if (typeof msg.content === "string" && msg.content.trim()) {
        parts.push(msg.content.trim());
      } else if (Array.isArray(msg.content)) {
        for (const item of msg.content) {
          if (item.type === "thinking" && options.includeThinking && item.thinking?.trim()) {
            parts.push(`<details>\n<summary>🧠 思考过程 (Thinking)</summary>\n\n${item.thinking.trim()}\n\n</details>`);
          } else if (item.type === "text" && item.text?.trim()) {
            parts.push(item.text.trim());
          } else if (item.type === "toolCall" && options.includeTools) {
            const argsStr = JSON.stringify(item.arguments || {}, null, 2);
            parts.push(`> 🛠️ **工具调用: \`${item.name}\`**\n>\n> \`\`\`json\n> ${argsStr.split("\n").join("\n> ")}\n> \`\`\``);
          }
        }
      }
      if (parts.length > 0) {
        if (currentRole !== "assistant") {
          flushRole();
          currentRole = "assistant";
        }
        currentContent.push(...parts);
      }
    } else if (msg.role === "toolResult" && options.includeTools) {
      let contentStr = "";
      if (typeof msg.content === "string") {
        contentStr = msg.content;
      } else if (Array.isArray(msg.content)) {
        contentStr = msg.content
          .map((c: unknown) => {
            if (typeof c === "string") return c;
            if (c && typeof c === "object" && "text" in c) {
              const textVal = c.text;
              if (typeof textVal === "string") return textVal;
            }
            return JSON.stringify(c);
          })
          .join("\n");
      }
      if (contentStr.trim()) {
        if (currentRole !== "assistant") {
          flushRole();
          currentRole = "assistant";
        }
        currentContent.push(`<details>\n<summary>📦 执行结果 (${msg.toolName || "tool"})</summary>\n\n\`\`\`\n${contentStr.trim()}\n\`\`\`\n\n</details>`);
      }
    }
  }

  flushRole();
  return sections.join("\n\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function showHelp(ctx: ExtensionCommandContext, pi: ExtensionAPI) {
  if (ctx.isIdle?.()) {
    pi.sendMessage({
      content: HELP_TEXT,
      display: true,
      attribution: "agent",
    }, { triggerTurn: false });
  }
  if (ctx.ui?.notify) {
    ctx.ui.notify("📖 已展示 /md 使用指南", "info");
  }
  console.log(HELP_TEXT);
}

function createExportHandler(pi: ExtensionAPI) {
  return async function handleExport(args: string, ctx: ExtensionCommandContext) {
    try {
      const tokens = (args || "").trim().split(/\s+/).filter(Boolean);

      // 完善的 help 机制：拦截 help, -h, --help，绝不误导成文件名
      if (tokens.some(t => t === "help" || t === "-h" || t === "--help")) {
        showHelp(ctx, pi);
        return;
      }

      const branch = ctx.sessionManager.getBranch();
      const sessionId = ctx.sessionManager.getSessionId?.() || "session";
      const sessionFile = ctx.sessionManager.getSessionFile?.() || "";

      let targetFileName = "";
      let includeTools = true;
      let includeThinking = true;
      let useFullId = false;

      for (const token of tokens) {
        if (token === "--no-tools" || token === "-T") {
          includeTools = false;
        } else if (token === "--no-thinking") {
          includeThinking = false;
        } else if (token === "--clean" || token === "-c") {
          includeTools = false;
          includeThinking = false;
        } else if (token === "--full-id") {
          useFullId = true;
        } else if (!token.startsWith("-") && !targetFileName) {
          targetFileName = token;
        }
      }

      if (!targetFileName && ctx.ui?.setStatus) {
        ctx.ui.setStatus("⏳ 正在提炼会话主题并导出 Markdown...");
      }

      const finalFileName = await resolveTargetFileName(
        targetFileName,
        sessionId,
        sessionFile,
        branch,
        ctx,
        useFullId
      );

      let targetPath = path.isAbsolute(finalFileName)
        ? finalFileName
        : path.join(ctx.cwd, finalFileName);

      if (fs.existsSync(targetPath)) {
        const dir = path.dirname(targetPath);
        const ext = path.extname(targetPath);
        const base = path.basename(targetPath, ext);
        let counter = 1;
        while (fs.existsSync(path.join(dir, `${base}-${counter}${ext}`))) {
          counter++;
        }
        targetPath = path.join(dir, `${base}-${counter}${ext}`);
      }

      const header = [
        `# 📑 OMP 对话记录导出`,
        `- **会话 ID**: \`${sessionId}\``,
        `- **导出时间**: ${new Date().toLocaleString()}`,
        `- **工作目录**: \`${ctx.cwd}\``,
        sessionFile ? `- **源文件**: \`${sessionFile}\`` : "",
        `\n---\n`,
      ].filter(Boolean).join("\n");

      const body = formatMarkdown(branch, { includeTools, includeThinking });
      fs.writeFileSync(targetPath, header + "\n" + (body ? body + "\n" : ""), "utf-8");

      const successMsg = `✅ 对话已导出到: ${targetPath}`;
      if (ctx.ui?.notify) {
        ctx.ui.notify(successMsg, "info");
      } else if (ctx.ui?.setStatus) {
        ctx.ui.setStatus(successMsg);
      }
      console.log(successMsg);
    } catch (err: unknown) {
      const errMsg = `❌ 导出失败: ${err instanceof Error ? err.message : String(err)}`;
      if (ctx.ui?.notify) {
        ctx.ui.notify(errMsg, "error");
      }
      console.error(errMsg);
    }
  };
}

function getArgumentCompletions(argumentPrefix: string) {
  if (argumentPrefix.includes(" ")) return null;
  const e = argumentPrefix.trim().toLowerCase();
  const completions = [
    { label: "--clean", value: "--clean", description: "纯净模式：合并发言，隐藏工具与思考" },
    { label: "-c", value: "-c", description: "纯净模式简写" },
    { label: "--no-tools", value: "--no-tools", description: "仅隐藏工具调用与执行结果" },
    { label: "-T", value: "-T", description: "隐藏工具调用简写" },
    { label: "--no-thinking", value: "--no-thinking", description: "仅隐藏思维链思考过程" },
    { label: "--full-id", value: "--full-id", description: "文件名中附带完整会话短 ID" },
    { label: "--help", value: "--help", description: "查看 /md 帮助文档" },
    { label: "-h", value: "-h", description: "查看帮助文档简写" },
    { label: "help", value: "help", description: "查看帮助文档" },
  ];
  if (!e) return completions;
  return completions.filter(item => item.value.toLowerCase().startsWith(e) || item.label.toLowerCase().startsWith(e));
}

export default function (pi: ExtensionAPI) {
  const handler = createExportHandler(pi);

  pi.registerCommand("export-md", {
    description: "导出当前会话为 Markdown: /export-md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]",
    getArgumentCompletions,
    handler,
  });

  pi.registerCommand("md", {
    description: "导出当前会话为 Markdown: /md [filename] [--clean] [--no-tools] [--no-thinking] [--full-id] [-h]",
    getArgumentCompletions,
    handler,
  });

  let autocompleteRegistered = false;
  pi.on("session_start", async (_event, ctx) => {
    if (autocompleteRegistered) return;
    if (ctx.ui?.addAutocompleteProvider) {
      autocompleteRegistered = true;
      ctx.ui.addAutocompleteProvider((baseProvider) => {
        return {
          async getSuggestions(lines, cursorLine, cursorCol, signal, ...rest) {
            const result = await baseProvider.getSuggestions(lines, cursorLine, cursorCol, signal, ...rest);
            if (result && Array.isArray(result.items)) {
              let icon = "📑";
              try {
                const preset = ctx.ui?.theme?.getSymbolPreset?.();
                if (preset === "ascii") {
                  icon = "";
                } else if (preset === "nerd") {
                  icon = "\uF15C"; // nf-fa-file_text
                }
              } catch {
                // 保持默认图标
              }

              for (const item of result.items) {
                const name = (item.value || item.label || "").replace(/^\//, "").toLowerCase();
                if (name === "md" || name === "export-md") {
                  item.icon = icon;
                  item.iconName = "document";
                }
              }
            }
            return result;
          },
          applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
            return baseProvider.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
          }
        };
      });
    }
  });
}
