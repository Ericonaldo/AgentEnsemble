# AgentEnsemble (ae)

A transparent PTY proxy layer that wraps AI coding agents to provide ensemble capabilities and unified configuration.

## Features

- **PTY Proxy** - Transparent passthrough to child agents (Claude Code, Codex)
- **Input Interception** - Capture `/ae:*` commands while forwarding everything else
- **Ensemble Execution** - Run tasks on multiple agents in parallel, synthesize results with LLM
- **Configuration Bridge** - Auto-inject shared config into CLAUDE.md/AGENTS.md
- **Cost Mode Presets** - Switch between cheap/balanced/quality model tiers
- **Status Bar** - Real-time display of agent state and ensemble status

## Installation

```bash
git clone git@github.com:Ericonaldo/AgentEnsemble.git
cd AgentEnsemble
npm install
npm run build
npm link  # Makes 'ae' command available globally
```

Alternative ways to run:
```bash
node dist/index.js        # Run directly
npm start                 # Via npm script
npx agent-ensemble        # Via npx (after npm link or global install)
```

## Usage

```bash
# Start with default agent (Claude Code)
ae

# Specify agent
ae --agent codex

# Set cost mode
ae --cost-mode quality  # Uses Opus
ae --cost-mode balanced # Uses Sonnet (default)
ae --cost-mode cheap    # Uses Haiku

# Set synthesis provider for ensemble
ae --synthesis-provider auto  # Auto-detect (default): SDK if API key, else CLI
ae --synthesis-provider sdk   # Use Anthropic SDK (requires ANTHROPIC_API_KEY)
ae --synthesis-provider cli   # Use Claude CLI (works with account-based auth)
ae --synthesis-provider none  # Disable synthesis, show raw results only

# Enable debug logging
ae --debug
```

## Commands

While running inside ae, use these commands:

| Command | Description |
|---------|-------------|
| `/ae:ensemble <task>` | Run task with multiple agents and synthesize results |
| `/ae:status` | Show current ae status |
| `/ae:bridge` | Show bridge configuration |
| `/ae:config` | Show current configuration |
| `/ae:help` | Show help |

## Configuration

Create `ae.toml` in your project or home directory:

```toml
[general]
default_agent = "claude-code"
cost_mode = "balanced"

[agents.claude-code]
command = "claude"
print_flag = "--print"
enabled = true

[agents.codex]
command = "codex"
quiet_flag = "--quiet"
enabled = true

[ensemble]
strategy = "parallel"
timeout = 300
synthesis_provider = "auto"  # auto, sdk, cli, or none

[bridge]
target_files = ["CLAUDE.md", "AGENTS.md"]
auto_inject = true
auto_cleanup = true
```

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
│  │ (claude/    │                        │
│  │  codex)     │                        │
│  └─────────────┘                        │
└─────────────────────────────────────────┘
```

1. **ae** starts and spawns the default agent in a PTY
2. User input flows through the **Interceptor**
3. `/ae:*` commands are handled by ae; everything else goes to the child agent
4. `/ae:ensemble` runs the task on multiple agents and synthesizes results
5. **Bridge** injects ae configuration into CLAUDE.md/AGENTS.md on startup and cleans up on exit

## Project Structure

```
src/
├── index.ts           # CLI entry point
├── types.ts           # Type definitions
├── config/            # Configuration loading
├── proxy/             # PTY proxy & input interception
├── models/            # LLM client & cost presets
├── adapters/          # Agent adapters
├── bridge/            # Config bridging
├── ensemble/          # Ensemble engine
└── ui/                # Terminal UI
```

## Requirements

- Node.js 18+
- Claude Code (`claude` CLI) and/or Codex (`codex` CLI) installed

### Ensemble Synthesis

For AI-powered synthesis of ensemble results, one of the following is needed:

| Provider | Requirement | Auth Method |
|----------|-------------|-------------|
| `sdk` | `ANTHROPIC_API_KEY` env var | API key |
| `cli` | Claude Code CLI installed | Account-based (subscription) |
| `auto` | Either of the above | Auto-detected |
| `none` | Nothing | Shows raw results without synthesis |

If you have Claude Code installed via subscription (no API key), the tool will automatically use `claude --print` for synthesis.

## License

MIT
