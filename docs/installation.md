# Installation

## Prerequisites

### Node.js 18+

AgentEnsemble requires Node.js version 18 or higher.

```bash
node --version  # Should be v18.0.0 or higher
```

If you need to install or update Node.js, visit [nodejs.org](https://nodejs.org/).

### AI Coding Agent

You need at least one AI coding agent installed:

<!-- tabs:start -->

#### **Claude Code (Recommended)**

Claude Code is Anthropic's official CLI for Claude.

1. Visit [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
2. Follow installation instructions
3. Login with your Anthropic account

Verify installation:
```bash
claude --version
```

#### **Codex**

Codex is OpenAI's coding assistant.

1. Visit [Codex Repository](https://github.com/openai/codex)
2. Follow installation instructions
3. Configure authentication

Verify installation:
```bash
codex --version
```

<!-- tabs:end -->

## Install AgentEnsemble

### From Source

```bash
# Clone the repository
git clone git@github.com:Ericonaldo/AgentEnsemble.git

# Enter directory
cd AgentEnsemble

# Install dependencies
npm install

# Build the project
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
```

You should see:
```
Usage: ae [options]

AgentEnsemble - AI agent orchestration layer

Options:
  -V, --version                        output the version number
  -a, --agent <type>                   default agent (claude-code or codex)
  -c, --cost-mode <mode>               cost mode (cheap, balanced, or quality)
  -s, --synthesis-provider <provider>  synthesis provider (auto, sdk, cli, none)
  -d, --debug                          enable debug logging
  -h, --help                           display help for command
```

## Alternative Run Methods

If you don't want to install globally:

```bash
# Run directly
node dist/index.js

# Run via npm
npm start

# Run via npx (after npm link)
npx agent-ensemble
```

## Next Steps

- [Quick Start Guide](quickstart.md) - Get running in 2 minutes
- [CLI Reference](cli.md) - All command line options
- [Configuration](configuration.md) - Customize ae behavior
