# Quick Start

Get up and running with AgentEnsemble in 2 minutes.

## 1. Start ae

```bash
ae
```

This starts ae with Claude Code as the default agent. You'll see a status bar at the top:

```
 ae  | agent:claude-code | idle | $$ | bridge
```

## 2. Use It Normally

Everything works as usual. ae is transparent - just use Claude Code like you normally would:

```
You: What files are in this directory?

Claude: I can see the following files...
```

## 3. Try Ensemble Mode

Now use ae's special power - run a task on multiple agents:

```
/ae:ensemble Explain what this codebase does
```

ae will:
1. Send your task to Claude Code
2. Send your task to Codex (if installed)
3. Wait for both to respond
4. Synthesize a unified answer

## 4. Check Status

```
/ae:status
```

Shows:
```
AgentEnsemble Status
──────────────────────────────
Agent: claude-code
Status: idle
Ensemble: idle
Cost Mode: balanced
──────────────────────────────
```

## 5. Exit

Just exit normally (Ctrl+C or type `exit`). ae cleans up automatically.

## What's Next?

### Try Different Modes

```bash
# Use Codex as primary agent
ae --agent codex

# Use quality mode (Opus models)
ae --cost-mode quality

# Debug mode
ae --debug
```

### Learn More Commands

| Command | What it does |
|---------|--------------|
| `/ae:ensemble <task>` | Run on multiple agents |
| `/ae:status` | Show current status |
| `/ae:config` | Show configuration |
| `/ae:bridge` | Show bridge status |
| `/ae:help` | Show all commands |

### Configure ae

Create `ae.toml` in your project:

```toml
[general]
cost_mode = "quality"

[agents.codex]
enabled = false  # Disable if not installed
```

## Common First-Time Issues

### "Command 'claude' not found"

Install Claude Code first. See [Installation](installation.md).

### "No synthesis provider available"

This is fine! ae will show raw results from each agent. For AI synthesis:
- Set `ANTHROPIC_API_KEY`, or
- Ensure Claude Code is logged in

### Status bar looks weird

Try debug mode: `ae --debug`

---

**Ready to learn more?** Check out the [CLI Reference](cli.md) or [Ensemble Mode](ensemble.md).
