# In-Session Commands

Commands available while running inside an ae session.

## Overview

ae intercepts commands that start with `/ae:` and handles them specially. Everything else passes through to the underlying agent.

| Command | Description |
|---------|-------------|
| `/ae:ensemble <task>` | Run task on multiple agents |
| `/ae:status` | Show current status |
| `/ae:config` | Show configuration |
| `/ae:bridge` | Show bridge status |
| `/ae:help` | Show help |

## /ae:ensemble

Run a task on all enabled agents and synthesize results.

### Syntax

```
/ae:ensemble <your task here>
```

### Examples

```
/ae:ensemble Explain the authentication flow
/ae:ensemble Find bugs in src/api/users.js
/ae:ensemble How should I implement caching?
/ae:ensemble Review this code for security issues
```

### What Happens

1. ae sends your task to each enabled agent (Claude Code, Codex)
2. Agents work in parallel (by default)
3. ae collects all responses
4. A synthesis LLM combines them into one answer
5. The synthesized result is displayed

### Output Format

```
## Agent Results

### claude-code [SUCCESS] (2340ms)
[Claude Code's response]

---

### codex [SUCCESS] (1890ms)
[Codex's response]

---

## Synthesized Result
[Combined answer from both agents]
```

## /ae:status

Show current ae status.

### Syntax

```
/ae:status
```

### Output

```
AgentEnsemble Status
──────────────────────────────
Agent: claude-code
Status: idle
Ensemble: idle
Cost Mode: balanced
──────────────────────────────
```

### Status Values

**Agent Status:**
- `idle` - Waiting for input
- `running` - Processing a request
- `waiting` - Waiting for response
- `error` - An error occurred

**Ensemble Status:**
- `idle` - Not running
- `running` - Agents are working
- `synthesizing` - Combining results
- `complete` - Done
- `error` - An error occurred

## /ae:config

Show current configuration.

### Syntax

```
/ae:config
```

### Output

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

Models:
  Primary: claude-sonnet-4-5-20250929
  Synthesis: claude-sonnet-4-5-20250929
──────────────────────────────
```

## /ae:bridge

Show bridge injection status.

### Syntax

```
/ae:bridge
```

### Output (Active)

```
Bridge Status
──────────────────────────────
Status: Active
File: CLAUDE.md

Content:
## AgentEnsemble Active
...
──────────────────────────────
```

### Output (Inactive)

```
Bridge is not active
```

## /ae:help

Show available commands.

### Syntax

```
/ae:help
```

### Output

```
AgentEnsemble Commands
──────────────────────────────
/ae:ensemble <task>  Run task with multiple agents
/ae:status           Show current status
/ae:bridge           Show bridge configuration
/ae:config           Show current configuration
/ae:help             Show this help
──────────────────────────────
```

## Tips

### Commands are Case-Sensitive

```
/ae:ensemble ...  ✓ Works
/AE:ENSEMBLE ...  ✗ Doesn't work
```

### Commands Don't Echo

When you type `/ae:*` commands, they're intercepted before reaching the agent, so they won't appear in the agent's context.

### Escape if Needed

If you actually want to type `/ae:` as text (not as a command), there's currently no escape mechanism. This is rarely needed.
