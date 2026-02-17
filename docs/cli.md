# CLI Reference

Complete reference for ae command line options.

## Synopsis

```bash
ae [options]
```

## Options

### -a, --agent \<type\>

Specify which agent to use as the primary agent.

**Values:** `claude-code`, `codex`
**Default:** `claude-code`

```bash
# Use Claude Code
ae --agent claude-code

# Use Codex
ae --agent codex

# Short form
ae -a codex
```

### -c, --cost-mode \<mode\>

Set the cost mode, which determines which models are used.

**Values:** `cheap`, `balanced`, `quality`
**Default:** `balanced`

| Mode | Models Used | Best For |
|------|-------------|----------|
| `cheap` | Haiku | Quick tasks, high volume |
| `balanced` | Sonnet | Most tasks |
| `quality` | Opus | Complex reasoning |

```bash
# Use cheapest models
ae --cost-mode cheap

# Use best models
ae --cost-mode quality

# Short form
ae -c quality
```

### -s, --synthesis-provider \<provider\>

Set how ensemble results are synthesized.

**Values:** `auto`, `sdk`, `cli`, `none`
**Default:** `auto`

| Provider | Description |
|----------|-------------|
| `auto` | Auto-detect best option |
| `sdk` | Use Anthropic SDK (requires API key) |
| `cli` | Use Claude CLI (works with subscription) |
| `none` | Skip synthesis, show raw results |

```bash
# Auto-detect
ae --synthesis-provider auto

# Force CLI mode
ae --synthesis-provider cli

# No synthesis
ae -s none
```

### -d, --debug

Enable debug logging. Shows detailed internal logs.

```bash
ae --debug
ae -d
```

Debug mode outputs:
- Config loading details
- Synthesis provider selection
- Agent spawn information
- Command interception logs

### -V, --version

Show version number and exit.

```bash
ae --version
ae -V
```

### -h, --help

Show help message and exit.

```bash
ae --help
ae -h
```

## Combining Options

Options can be combined:

```bash
# Codex with quality mode and debug
ae --agent codex --cost-mode quality --debug

# Short form
ae -a codex -c quality -d

# CLI synthesis with cheap mode
ae -s cli -c cheap
```

## Environment Variables

### ANTHROPIC_API_KEY

If set, enables SDK synthesis mode.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
ae
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Normal exit |
| 1 | Error (agent not found, config error, etc.) |

## Examples

### Daily Development

```bash
# Standard usage
ae
```

### Code Review Session

```bash
# Quality mode for thorough review
ae --cost-mode quality
```

### Quick Questions

```bash
# Cheap mode for fast answers
ae -c cheap
```

### Debugging Issues

```bash
# See what's happening internally
ae --debug
```

### Testing Without Synthesis

```bash
# See raw agent outputs
ae --synthesis-provider none
```
