# AgentEnsemble

> A transparent PTY proxy layer that wraps AI coding agents to provide ensemble capabilities.

## What is AgentEnsemble?

AgentEnsemble (ae) lets you run multiple AI coding agents together and synthesize their outputs. It wraps tools like **Claude Code** and **Codex**, providing:

- **Ensemble Execution** - Run tasks on multiple agents, get combined results
- **Transparent Proxy** - Works like your normal agent, with extra powers
- **No API Key Required** - Works with subscription-based login
- **Smart Synthesis** - AI-powered combination of agent outputs

## Quick Example

```bash
# Install and start
npm install && npm run build && npm link
ae

# Inside ae, run ensemble task
/ae:ensemble Explain the authentication flow in this codebase
```

ae runs your question on both Claude Code and Codex, then synthesizes a unified answer.

## Features

| Feature | Description |
|---------|-------------|
| **PTY Proxy** | Transparent passthrough to child agents |
| **Ensemble Mode** | Run tasks on multiple agents in parallel |
| **Config Bridge** | Auto-inject shared context into CLAUDE.md |
| **Cost Modes** | Switch between cheap/balanced/quality tiers |
| **CLI Synthesis** | Works without API key using Claude CLI |

## Why Use ae?

| Without ae | With ae |
|------------|---------|
| Run Claude Code OR Codex separately | Run both and synthesize results |
| Manually copy context between agents | Automatic bridge injection |
| No way to compare agent outputs | Side-by-side comparison |
| Fixed model selection | Dynamic cost mode switching |

## Get Started

1. [Install ae](installation.md)
2. [Quick Start Guide](quickstart.md)
3. [CLI Reference](cli.md)

## Links

- [GitHub Repository](https://github.com/Ericonaldo/AgentEnsemble)
- [Report Issues](https://github.com/Ericonaldo/AgentEnsemble/issues)
