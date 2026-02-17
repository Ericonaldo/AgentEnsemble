# Ensemble Mode

Run tasks on multiple AI agents and synthesize their outputs.

## Overview

Ensemble mode is ae's core feature. It lets you:

1. Send the same task to multiple agents
2. Get responses from each
3. Synthesize them into a unified answer

## How to Use

Inside an ae session:

```
/ae:ensemble <your task>
```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Your Task                             │
│              "Explain the auth flow"                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
     ┌─────────────┐         ┌─────────────┐
     │ Claude Code │         │    Codex    │
     └─────────────┘         └─────────────┘
              │                       │
              ▼                       ▼
     ┌─────────────┐         ┌─────────────┐
     │  Response 1 │         │  Response 2 │
     └─────────────┘         └─────────────┘
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   Synthesis LLM     │
              │   (combines both)   │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  Unified Response   │
              └─────────────────────┘
```

## Execution Strategies

### Parallel (Default)

Both agents run simultaneously. Faster overall.

```toml
[ensemble]
strategy = "parallel"
```

### Sequential

Agents run one after another. Uses fewer resources.

```toml
[ensemble]
strategy = "sequential"
```

## Synthesis Strategies

The synthesis LLM can combine results in different ways:

### Merge (Default)

Combines the best elements from each agent's response.

**Best for:** Getting comprehensive answers

### Best

Picks the single best response and explains why.

**Best for:** When you want one clear answer

### Consensus

Only includes points both agents agree on.

**Best for:** High-confidence answers

## Output Format

When you run `/ae:ensemble`, you'll see:

```markdown
## Agent Results

### claude-code [SUCCESS] (2340ms)

The authentication flow works as follows:
1. User submits credentials
2. Server validates...
[full response]

---

### codex [SUCCESS] (1890ms)

Looking at the codebase, auth happens in:
- src/auth/login.js
- src/middleware/verify.js
[full response]

---

## Synthesized Result

Based on both analyses, the authentication flow:
1. User credentials submitted to /api/login
2. login.js validates against database
3. JWT token generated and returned
4. verify.js middleware checks token on protected routes
[combined insights from both]
```

## Handling Failures

If one agent fails, ae still works:

```markdown
### claude-code [SUCCESS] (2340ms)
[response]

### codex [FAILED (exit code 1)] (890ms)
Error: Connection timeout

## Synthesized Result
[synthesis based on successful agent only]
```

## Configuration

### Timeout

Set how long to wait for each agent:

```toml
[ensemble]
timeout = 300  # seconds (default: 5 minutes)
```

### Disable an Agent

If you don't have Codex installed:

```toml
[agents.codex]
enabled = false
```

### Synthesis Model

Override which model does synthesis:

```toml
[ensemble]
synthesis_model = "claude-opus-4-5-20251101"
```

## Examples

### Code Review

```
/ae:ensemble Review src/api/users.js for security issues
```

Gets security perspectives from both Claude and Codex.

### Architecture Questions

```
/ae:ensemble How should I implement caching for this API?
```

Gets different architectural approaches.

### Bug Investigation

```
/ae:ensemble Why is the login failing for some users?
```

Multiple agents investigate independently.

### Documentation

```
/ae:ensemble Write documentation for the auth module
```

Synthesizes comprehensive docs from both perspectives.

## Tips

### Be Specific

More specific tasks get better results:

```
# Less effective
/ae:ensemble Review the code

# More effective
/ae:ensemble Review src/api/auth.js for SQL injection vulnerabilities
```

### Use Quality Mode for Complex Tasks

```bash
ae --cost-mode quality
```

Then:
```
/ae:ensemble Design a caching strategy for this application
```

### Compare Without Synthesis

To see raw outputs:

```bash
ae --synthesis-provider none
```

Then:
```
/ae:ensemble How would you refactor this function?
```

Shows each agent's approach without combining.
