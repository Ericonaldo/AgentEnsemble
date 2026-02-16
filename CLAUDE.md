# CLAUDE.md

## Project Overview

AgentEnsemble (ae) is a transparent PTY proxy layer that wraps AI coding agents (Claude Code, Codex) to provide ensemble capabilities and configuration bridging.

## Tech Stack

- **Runtime**: Node.js 18+, TypeScript 5.7, ESM modules
- **PTY**: node-pty for terminal emulation
- **LLM**: @anthropic-ai/sdk for synthesis
- **CLI**: Commander.js
- **Config**: TOML format (ae.toml)

## Project Structure

```
src/
├── index.ts           # CLI entry, AgentEnsemble class
├── types.ts           # Global types
├── config/            # Config loading & validation
├── proxy/             # PTY proxy, input interception
├── models/            # LLM client, cost presets
├── adapters/          # Agent adapters (claude-code, codex)
├── bridge/            # Config bridging injection
├── ensemble/          # Parallel execution & synthesis
└── ui/                # Status bar, result rendering
```

## Build & Run

```bash
npm install && npm run build
node dist/index.js --help
```

## Code Conventions

- Use `.js` extension in imports (ESM requirement)
- Prefer async/await over callbacks
- Export types from types.ts, implementations from module index.ts
- Use EventEmitter for component communication

## Key Patterns

- **InputInterceptor**: Byte-by-byte buffering to detect `/ae:` prefix
- **Bridge markers**: `<!-- ae:bridge:start -->` / `<!-- ae:bridge:end -->`
- **Adapters**: BaseAdapter abstract class, per-agent implementations
- **Cost modes**: cheap (Haiku), balanced (Sonnet), quality (Opus)
