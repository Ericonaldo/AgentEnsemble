# AGENTS.md

## Project Overview

AgentEnsemble (ae) - PTY proxy for AI agent orchestration with ensemble capabilities.

## Quick Reference

| Item | Value |
|------|-------|
| Language | TypeScript (ESM) |
| Entry | `src/index.ts` |
| Build | `npm run build` |
| Output | `dist/` |

## Directory Map

- `src/proxy/` - PTY proxy, intercepts `/ae:*` commands
- `src/ensemble/` - Parallel agent execution + LLM synthesis
- `src/adapters/` - Agent wrappers (claude-code.ts, codex.ts)
- `src/bridge/` - Injects config into CLAUDE.md/AGENTS.md
- `src/models/` - Anthropic SDK client, cost presets
- `src/config/` - TOML config loading
- `src/ui/` - Terminal status bar

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm start            # Run ae
```

## Key Files

- `ae.toml` - Configuration (agents, cost mode, bridge settings)
- `src/types.ts` - All type definitions
- `src/index.ts` - CLI and main AgentEnsemble class

## Codex Integration

This project uses Codex via `codex --quiet` flag for non-interactive execution. The adapter is in `src/adapters/codex.ts`.
