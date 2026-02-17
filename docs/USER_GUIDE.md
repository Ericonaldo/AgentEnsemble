# AgentEnsemble User Guide

Complete documentation for using AgentEnsemble (ae).

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [CLI Reference](#cli-reference)
- [In-Session Commands](#in-session-commands)
- [Configuration](#configuration)
- [Ensemble Mode](#ensemble-mode)
- [Bridge System](#bridge-system)
- [Cost Modes](#cost-modes)
- [Synthesis Providers](#synthesis-providers)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Introduction

AgentEnsemble (ae) is a transparent wrapper for AI coding agents like Claude Code and Codex. It lets you:

- **Use multiple agents together** - Run the same task on Claude Code and Codex, get synthesized results
- **Switch between agents easily** - One command to switch from Claude to Codex
- **Share configuration** - Bridge your project context to any agent
- **Control costs** - Switch between cheap/balanced/quality modes

### Why Use ae?

| Without ae | With ae |
|------------|---------|
| Run Claude Code OR Codex separately | Run both and synthesize results |
| Manually copy context between agents | Automatic bridge injection |
| No way to compare agent outputs | Side-by-side comparison |
| Fixed model selection | Dynamic cost mode switching |

---

## Installation

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **At least one AI coding agent:**
   - **Claude Code**: https://docs.anthropic.com/en/docs/claude-code
   - **Codex**: https://github.com/openai/codex

### Install ae

```bash
# Clone the repository
git clone git@github.com:Ericonaldo/AgentEnsemble.git
cd AgentEnsemble

# Install dependencies
npm install

# Build
npm run build

# Link globally (makes 'ae' command available)
npm link
```

### Verify Installation

```bash
# Check version
ae --version

# Show help
ae --help

# Test startup (Ctrl+C to exit)
ae
```

---

## Getting Started

### Your First Session

```bash
# Start ae (uses Claude Code by default)
ae
```

You'll see a status bar at the top and Claude Code starts normally. Everything works as usual - ae is transparent.

### Try Ensemble Mode

Inside your ae session:

```
/ae:ensemble What does this codebase do?
```

This runs the question on both Claude Code and Codex (if installed), then synthesizes the results.

### Check Status

```
/ae:status
```

Shows current agent, status, cost mode, and bridge status.

---

## CLI Reference

### Synopsis

```
ae [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--agent <type>` | `-a` | Agent to use: `claude-code` or `codex` | `claude-code` |
| `--cost-mode <mode>` | `-c` | Cost mode: `cheap`, `balanced`, `quality` | `balanced` |
| `--synthesis-provider <p>` | `-s` | Synthesis: `auto`, `sdk`, `cli`, `none` | `auto` |
| `--debug` | `-d` | Enable debug logging | `false` |
| `--version` | `-V` | Show version number | - |
| `--help` | `-h` | Show help | - |

### Examples

```bash
# Use Codex as the primary agent
ae --agent codex

# Use quality mode (Opus models)
ae --cost-mode quality

# Use cheap mode (Haiku models)
ae --cost-mode cheap

# Debug mode - shows detailed logs
ae --debug

# Combine options
ae --agent codex --cost-mode quality --debug

# Disable synthesis (just show raw results)
ae --synthesis-provider none
```

---

## In-Session Commands

While running inside ae, these commands are available:

### /ae:ensemble

Run a task on all enabled agents and synthesize results.

```
/ae:ensemble <your task here>
```

**Examples:**
```
/ae:ensemble Explain the authentication system
/ae:ensemble Find potential bugs in src/api/
/ae:ensemble Suggest improvements for the database schema
```

### /ae:status

Show current status.

```
/ae:status
```

**Output:**
```
AgentEnsemble Status
──────────────────────────────
Agent: claude-code
Status: idle
Ensemble: idle
Cost Mode: balanced
──────────────────────────────
```

### /ae:config

Show current configuration.

```
/ae:config
```

**Output:**
```
Current Configuration
──────────────────────────────
Default Agent: claude-code
Cost Mode: balanced
Debug: false

Agents:
  claude-code: enabled
  codex: enabled

Ensemble:
  Strategy: parallel
  Timeout: 300s
  Synthesis Provider: auto
──────────────────────────────
```

### /ae:bridge

Show bridge status and content.

```
/ae:bridge
```

### /ae:help

Show available commands.

```
/ae:help
```

---

## Configuration

### Config File Locations

ae looks for config files in this order:

1. `./ae.toml` (current directory)
2. `./.ae.toml` (hidden, current directory)
3. `~/.config/ae/ae.toml` (XDG config)
4. `~/.ae.toml` (home directory)

### Full Configuration Reference

```toml
# ae.toml - AgentEnsemble Configuration

[general]
# Default agent to use: "claude-code" or "codex"
default_agent = "claude-code"

# Cost mode: "cheap", "balanced", or "quality"
cost_mode = "balanced"

# Enable debug logging
debug = false

[agents.claude-code]
# Command to run Claude Code
command = "claude"

# Flag for non-interactive mode (used in ensemble)
print_flag = "--print"

# Enable/disable this agent
enabled = true

[agents.codex]
# Command to run Codex
command = "codex"

# Flag for non-interactive mode
quiet_flag = "--quiet"

# Enable/disable this agent
enabled = true

[ensemble]
# Execution strategy: "parallel" or "sequential"
strategy = "parallel"

# Timeout in seconds for each agent
timeout = 300

# Model for synthesis (overrides cost mode)
synthesis_model = "claude-sonnet-4-5-20250929"

# Synthesis provider: "auto", "sdk", "cli", or "none"
synthesis_provider = "auto"

[bridge]
# Files to inject bridge content into
target_files = ["CLAUDE.md", "AGENTS.md"]

# Auto-inject on startup
auto_inject = true

# Auto-cleanup on exit
auto_cleanup = true

[ui]
# Show status bar
status_bar = true

# Status bar refresh rate in milliseconds
status_bar_refresh = 1000

# Theme: "default", "minimal", or "verbose"
theme = "default"

[models.cheap]
# Haiku models for cheap mode
primary = "claude-haiku-4-5-20251001"
synthesis = "claude-haiku-4-5-20251001"

[models.balanced]
# Sonnet models for balanced mode
primary = "claude-sonnet-4-5-20250929"
synthesis = "claude-sonnet-4-5-20250929"

[models.quality]
# Opus models for quality mode
primary = "claude-opus-4-5-20251101"
synthesis = "claude-opus-4-5-20251101"
```

### Minimal Configuration

For most users, you don't need a config file. Defaults work well. If you want to customize:

```toml
# Minimal ae.toml
[general]
cost_mode = "quality"  # Use best models

[agents.codex]
enabled = false  # Disable Codex
```

---

## Ensemble Mode

Ensemble mode runs your task on multiple agents and synthesizes their outputs.

### How It Works

1. You type `/ae:ensemble <task>`
2. ae sends the task to all enabled agents (in parallel by default)
3. Each agent works independently
4. ae collects all outputs
5. A synthesis LLM combines them into a unified response

### Synthesis Strategies

Configure in `ae.toml`:

```toml
[ensemble]
strategy = "parallel"  # or "sequential"
```

| Strategy | Description |
|----------|-------------|
| `parallel` | Run all agents simultaneously (faster) |
| `sequential` | Run agents one after another (uses less resources) |

### Synthesis Modes

The synthesis LLM can combine results in different ways:

- **merge** (default) - Combine best elements from each agent
- **best** - Pick the best response, explain why
- **consensus** - Only include points both agents agree on

---

## Bridge System

The bridge auto-injects shared context into your project's CLAUDE.md or AGENTS.md.

### What Gets Injected

```markdown
<!-- ae:bridge:start -->
## AgentEnsemble Active

This project is being developed with AgentEnsemble.
- Agents: claude-code, codex
- Cost Mode: balanced
- Ensemble: available via /ae:ensemble

<!-- ae:bridge:end -->
```

### Controlling Bridge

In config:
```toml
[bridge]
auto_inject = true   # Inject on startup
auto_cleanup = true  # Remove on exit
target_files = ["CLAUDE.md", "AGENTS.md"]
```

Or disable entirely:
```toml
[bridge]
auto_inject = false
```

---

## Cost Modes

Control model selection across the tool.

| Mode | Primary Model | Synthesis Model | Best For |
|------|--------------|-----------------|----------|
| `cheap` | Haiku | Haiku | Quick tasks, high volume |
| `balanced` | Sonnet | Sonnet | Most tasks (default) |
| `quality` | Opus | Opus | Complex reasoning |

### Switch Cost Mode

**CLI:**
```bash
ae --cost-mode quality
```

**Config:**
```toml
[general]
cost_mode = "quality"
```

---

## Synthesis Providers

For ensemble synthesis, ae needs to call an LLM. Options:

### auto (Recommended)

```bash
ae --synthesis-provider auto
```

Automatically detects:
1. If `ANTHROPIC_API_KEY` is set, uses SDK
2. Otherwise, if Claude Code CLI is installed, uses it
3. Otherwise, shows raw results without synthesis

### sdk

```bash
ae --synthesis-provider sdk
```

Requires `ANTHROPIC_API_KEY` environment variable. Fastest option.

### cli

```bash
ae --synthesis-provider cli
```

Uses `claude --print` command. Works with subscription login (no API key needed).

### none

```bash
ae --synthesis-provider none
```

Skips synthesis entirely. Shows raw output from each agent.

---

## Examples

### Example 1: Code Review with Multiple Perspectives

```bash
ae --cost-mode quality
```

Then:
```
/ae:ensemble Review this PR for security issues, performance problems, and code quality
```

### Example 2: Compare Agent Approaches

```bash
ae --synthesis-provider none
```

Then:
```
/ae:ensemble How would you implement caching for this API?
```

This shows raw output from each agent without synthesis, letting you compare approaches.

### Example 3: Quick Answers with Cheap Mode

```bash
ae --cost-mode cheap
```

Then:
```
/ae:ensemble What's the main entry point of this app?
```

### Example 4: Debug Session

```bash
ae --debug
```

Shows detailed logs of what ae is doing internally.

---

## Troubleshooting

### "Command 'claude' not found"

Claude Code CLI is not installed or not in PATH.

**Fix:** Install Claude Code from https://docs.anthropic.com/en/docs/claude-code

### "Command 'codex' not found"

Codex CLI is not installed or not in PATH.

**Fix:** Install Codex from https://github.com/openai/codex

Or disable it in config:
```toml
[agents.codex]
enabled = false
```

### "No synthesis provider available"

Neither API key nor Claude CLI is available for synthesis.

**Fix (Option 1):** Set API key:
```bash
export ANTHROPIC_API_KEY=your-key-here
ae
```

**Fix (Option 2):** Install Claude Code with subscription login.

**Fix (Option 3):** Use without synthesis:
```bash
ae --synthesis-provider none
```

### Status bar looks garbled

Some terminals don't support the ANSI escape codes used.

**Fix:** Use debug mode (disables status bar):
```bash
ae --debug
```

Or disable in config:
```toml
[ui]
status_bar = false
```

### Ensemble takes too long

Agents have a default timeout of 300 seconds.

**Fix:** Reduce timeout in config:
```toml
[ensemble]
timeout = 60  # 1 minute
```

### Bridge content not removed on exit

If ae crashes or is killed with SIGKILL, bridge content may remain.

**Fix:** Manually remove the bridge markers from CLAUDE.md:
```markdown
<!-- ae:bridge:start -->
...content...
<!-- ae:bridge:end -->
```

---

## FAQ

### Q: Does ae work without an API key?

**A:** Yes! If you have Claude Code installed with subscription login, ae uses it for synthesis automatically.

### Q: Can I use ae with just one agent?

**A:** Yes. Disable the agent you don't have:
```toml
[agents.codex]
enabled = false
```

### Q: Does ae modify my code?

**A:** No. ae only injects temporary content into CLAUDE.md/AGENTS.md (bridge), which is cleaned up on exit. Your actual code is never modified by ae itself.

### Q: What's the difference between ae and just using Claude Code?

**A:** ae adds:
- Ensemble mode (multiple agents)
- Automatic synthesis of results
- Configuration bridging
- Cost mode presets

If you only use Claude Code and don't need ensemble features, you don't need ae.

### Q: Can I add other agents?

**A:** Currently only Claude Code and Codex are supported. See BUGS_AND_IMPROVEMENTS.md for planned features including support for Cursor, Copilot CLI, and Aider.

---

## Getting Help

- **GitHub Issues:** https://github.com/Ericonaldo/AgentEnsemble/issues
- **In-app help:** `/ae:help`
- **Debug mode:** `ae --debug`
