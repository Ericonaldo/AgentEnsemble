# Synthesis Providers

How ae combines results from multiple agents.

## Overview

When you use `/ae:ensemble`, ae needs an LLM to synthesize the results. The synthesis provider determines how this works.

## Available Providers

| Provider | Requirement | Speed | Best For |
|----------|-------------|-------|----------|
| `auto` | Auto-detect | Varies | Most users |
| `sdk` | API key | Fast | API key users |
| `cli` | Claude CLI | Moderate | Subscription users |
| `none` | Nothing | Instant | Raw comparison |

## Setting Provider

### Via CLI

```bash
ae --synthesis-provider auto
ae --synthesis-provider sdk
ae --synthesis-provider cli
ae --synthesis-provider none

# Short form
ae -s cli
```

### Via Config

```toml
[ensemble]
synthesis_provider = "auto"
```

## Provider Details

### auto (Recommended)

Automatically selects the best available provider:

1. If `ANTHROPIC_API_KEY` is set → uses SDK
2. If Claude CLI is installed → uses CLI
3. Otherwise → shows error or falls back to none

```bash
ae --synthesis-provider auto
```

This is the default and works for most users.

### sdk

Uses the Anthropic SDK directly. Requires `ANTHROPIC_API_KEY` environment variable.

**Setup:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
ae --synthesis-provider sdk
```

**Advantages:**
- Fastest synthesis
- Supports streaming
- Most reliable

**Disadvantages:**
- Requires API key
- Separate billing

### cli

Uses the Claude CLI (`claude --print`) for synthesis. Works with subscription-based login.

**Requirements:**
- Claude Code installed
- Logged in via subscription

```bash
ae --synthesis-provider cli
```

**Advantages:**
- No separate API key needed
- Uses your existing Claude subscription
- Works out of the box

**Disadvantages:**
- Slower than SDK
- No streaming (shows all at once)

### none

Skips synthesis entirely. Shows raw output from each agent.

```bash
ae --synthesis-provider none
```

**Output:**
```markdown
## Agent Results (No synthesis)

### claude-code [SUCCESS] (2340ms)
[raw response]

---

### codex [SUCCESS] (1890ms)
[raw response]

---

## Summary
- All succeeded: Yes
- Agreement level: medium
- Fastest agent: codex
```

**Use when:**
- Comparing agent approaches
- Debugging agent responses
- Synthesis isn't needed

## Checking Current Provider

Debug mode shows which provider is active:

```bash
ae --debug
```

Output:
```
[ae] Synthesis provider: cli
```

## Troubleshooting

### "No synthesis provider available"

Neither SDK nor CLI is available.

**Fixes:**
1. Set `ANTHROPIC_API_KEY`:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Or ensure Claude CLI is installed and logged in:
   ```bash
   claude --version
   ```

3. Or use without synthesis:
   ```bash
   ae --synthesis-provider none
   ```

### SDK provider not working

Check API key:
```bash
echo $ANTHROPIC_API_KEY
```

### CLI provider not working

Check Claude CLI:
```bash
claude --version
claude --print "Hello"
```

If Claude CLI prompts for login, log in first:
```bash
claude
# Follow login prompts
```

## Performance Comparison

| Provider | Typical Synthesis Time |
|----------|----------------------|
| `sdk` | 2-5 seconds |
| `cli` | 5-15 seconds |
| `none` | Instant |

## Combining with Cost Modes

Synthesis uses the model specified by your cost mode:

| Cost Mode | Synthesis Model |
|-----------|-----------------|
| `cheap` | Haiku |
| `balanced` | Sonnet |
| `quality` | Opus |

Or override with:
```toml
[ensemble]
synthesis_model = "claude-opus-4-5-20251101"
```
