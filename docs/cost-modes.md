# Cost Modes

Control which AI models are used.

## Overview

Cost modes let you balance between speed/cost and quality. Higher quality modes use more capable (and expensive) models.

## Available Modes

| Mode | Primary Model | Synthesis Model | Best For |
|------|---------------|-----------------|----------|
| `cheap` | Haiku | Haiku | Quick tasks, high volume |
| `balanced` | Sonnet | Sonnet | Most tasks (default) |
| `quality` | Opus | Opus | Complex reasoning |

## Setting Cost Mode

### Via CLI

```bash
# Cheap mode
ae --cost-mode cheap
ae -c cheap

# Balanced mode (default)
ae --cost-mode balanced
ae -c balanced

# Quality mode
ae --cost-mode quality
ae -c quality
```

### Via Config

```toml
[general]
cost_mode = "quality"
```

## Model Details

### Cheap Mode (Haiku)

**Models:**
- Primary: `claude-haiku-4-5-20251001`
- Synthesis: `claude-haiku-4-5-20251001`

**Characteristics:**
- Fastest response times
- Lowest cost
- Good for simple questions
- May miss nuance in complex tasks

**Use when:**
- Quick questions
- High volume tasks
- Cost is a concern
- Speed matters most

### Balanced Mode (Sonnet)

**Models:**
- Primary: `claude-sonnet-4-5-20250929`
- Synthesis: `claude-sonnet-4-5-20250929`

**Characteristics:**
- Good balance of speed and quality
- Moderate cost
- Handles most tasks well
- Default choice

**Use when:**
- Normal development work
- Code review
- General questions
- Most situations

### Quality Mode (Opus)

**Models:**
- Primary: `claude-opus-4-5-20251101`
- Synthesis: `claude-opus-4-5-20251101`

**Characteristics:**
- Highest quality responses
- Higher cost
- Best for complex reasoning
- Slower than other modes

**Use when:**
- Complex architecture decisions
- Detailed code review
- Difficult bugs
- Quality matters most

## Checking Current Mode

Inside ae:

```
/ae:status
```

Shows cost mode as `$`, `$$`, or `$$$`.

Or:

```
/ae:config
```

Shows full mode name.

## Custom Model Configuration

Override default models for any cost mode:

```toml
[models.balanced]
primary = "claude-sonnet-4-5-20250929"
synthesis = "claude-opus-4-5-20251101"  # Use Opus for synthesis
```

## Override Synthesis Model

Use a specific model for synthesis regardless of cost mode:

```toml
[ensemble]
synthesis_model = "claude-opus-4-5-20251101"
```

## Tips

### Start Balanced, Adjust as Needed

```bash
ae  # Starts in balanced mode
```

If responses aren't good enough, restart with quality mode:
```bash
ae --cost-mode quality
```

### Use Quality for Important Decisions

```bash
ae --cost-mode quality
```

Then:
```
/ae:ensemble Should we use microservices or monolith for this project?
```

### Use Cheap for Quick Checks

```bash
ae --cost-mode cheap
```

Then:
```
/ae:ensemble What's the main entry point of this app?
```
