# AgentEnsemble (ae)

A transparent PTY proxy layer that wraps AI coding agents to provide ensemble capabilities and unified configuration.

## Features

- **PTY Proxy** - Transparent passthrough to child agents (Claude Code, Codex)
- **Input Interception** - Capture `/ae:*` commands while forwarding everything else
- **Ensemble Execution** - Run tasks on multiple agents in parallel, synthesize results
- **Configuration Bridge** - Auto-inject shared config into CLAUDE.md/AGENTS.md
- **Cost Mode Presets** - Switch between cheap/balanced/quality model tiers
- **No API Key Required** - Works with account-based auth (subscription login)

## Quick Start

```bash
# Install
git clone git@github.com:Ericonaldo/AgentEnsemble.git
cd AgentEnsemble
npm install && npm run build && npm link

# Run (wraps Claude Code by default)
ae

# Once inside, use /ae: commands
/ae:ensemble Fix the bug in auth.js    # Run on multiple agents
/ae:status                              # Show status
/ae:help                                # Show all commands
```

## Documentation

**[View Full Documentation](https://ericonaldo.github.io/AgentEnsemble/)**

- [Installation](https://ericonaldo.github.io/AgentEnsemble/#/installation)
- [Quick Start](https://ericonaldo.github.io/AgentEnsemble/#/quickstart)
- [CLI Reference](https://ericonaldo.github.io/AgentEnsemble/#/cli)
- [Configuration](https://ericonaldo.github.io/AgentEnsemble/#/configuration)
- [Ensemble Mode](https://ericonaldo.github.io/AgentEnsemble/#/ensemble)
- [Troubleshooting](https://ericonaldo.github.io/AgentEnsemble/#/troubleshooting)

## Installation

### Prerequisites

- Node.js 18+
- At least one AI coding agent installed:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`claude` CLI)
  - [Codex](https://github.com/openai/codex) (`codex` CLI)

### Install from Source

```bash
git clone git@github.com:Ericonaldo/AgentEnsemble.git
cd AgentEnsemble
npm install
npm run build
npm link  # Makes 'ae' command available globally
```

### Verify Installation

```bash
ae --version  # Should show version number
ae --help     # Show CLI options
```

## Usage

### Basic Usage

```bash
# Start with Claude Code (default)
ae

# Start with Codex
ae --agent codex

# Start with debug logging
ae --debug
```

### Inside ae Session

Once ae starts, you're in a normal Claude Code (or Codex) session. All your regular commands work. Use `/ae:*` commands for ensemble features:

```
You: /ae:ensemble Explain the authentication flow in this codebase

[ae runs task on both Claude Code and Codex in parallel]
[ae synthesizes results into a unified answer]

You: /ae:status
Agent: claude-code | Status: idle | Cost: $$ | Bridge: active

You: How do I fix the login bug?
[This goes directly to Claude Code as normal]
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-a, --agent <type>` | Default agent: `claude-code` or `codex` |
| `-c, --cost-mode <mode>` | Cost mode: `cheap`, `balanced`, `quality` |
| `-s, --synthesis-provider <p>` | Synthesis: `auto`, `sdk`, `cli`, `none` |
| `-d, --debug` | Enable debug logging |
| `-V, --version` | Show version |
| `-h, --help` | Show help |

### In-Session Commands

| Command | Description |
|---------|-------------|
| `/ae:ensemble <task>` | Run task on all enabled agents, synthesize results |
| `/ae:status` | Show current agent and ensemble status |
| `/ae:config` | Show current configuration |
| `/ae:bridge` | Show bridge injection status |
| `/ae:help` | Show available commands |

## Configuration

Create `ae.toml` in your project directory or `~/.config/ae/ae.toml`:

```toml
[general]
default_agent = "claude-code"  # or "codex"
cost_mode = "balanced"         # cheap, balanced, quality
debug = false

[agents.claude-code]
command = "claude"
print_flag = "--print"
enabled = true

[agents.codex]
command = "codex"
quiet_flag = "--quiet"
enabled = true

[ensemble]
strategy = "parallel"          # or "sequential"
timeout = 300                  # seconds
synthesis_provider = "auto"    # auto, sdk, cli, none

[bridge]
target_files = ["CLAUDE.md", "AGENTS.md"]
auto_inject = true
auto_cleanup = true
```

## Synthesis Providers

For combining results from multiple agents:

| Provider | Requirement | Best For |
|----------|-------------|----------|
| `auto` | Auto-detect | Most users (recommended) |
| `sdk` | `ANTHROPIC_API_KEY` | API key users |
| `cli` | Claude Code installed | Subscription users |
| `none` | Nothing | Raw output only |

**No API key?** No problem! If you have Claude Code installed with subscription login, ae automatically uses it for synthesis.

## How It Works

```
┌─────────────────────────────────────────┐
│                   ae                     │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ Interceptor │───▶│ /ae:* commands │  │
│  └─────────────┘    └────────────────┘  │
│         │                    │          │
│         ▼                    ▼          │
│  ┌─────────────┐    ┌────────────────┐  │
│  │  PTY Proxy  │    │    Ensemble    │  │
│  └─────────────┘    │     Engine     │  │
│         │           └────────────────┘  │
│         ▼                    │          │
│  ┌─────────────┐             │          │
│  │ Child Agent │◀────────────┘          │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
```

1. **ae** starts and spawns your chosen agent in a PTY
2. User input flows through the **Interceptor**
3. `/ae:*` commands are handled by ae; everything else passes through
4. `/ae:ensemble` runs tasks on multiple agents and synthesizes results
5. **Bridge** injects shared config on startup, cleans up on exit

## Examples

### Run ensemble task
```bash
ae
> /ae:ensemble Review the error handling in src/api/
```

### Use quality mode for complex tasks
```bash
ae --cost-mode quality
> /ae:ensemble Design a caching strategy for this application
```

### Debug mode to see what's happening
```bash
ae --debug
```

## Troubleshooting

### "Command 'claude' not found"
Install Claude Code: https://docs.anthropic.com/en/docs/claude-code

### "No synthesis provider available"
Either:
- Set `ANTHROPIC_API_KEY` environment variable, or
- Install Claude Code with subscription login

### Status bar looks garbled
Try: `ae --debug` to disable status bar, or check terminal compatibility.

## License

MIT
