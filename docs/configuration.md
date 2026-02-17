# Configuration

Complete guide to configuring AgentEnsemble.

## Config File Locations

ae looks for configuration files in this order:

1. `./ae.toml` - Current directory
2. `./.ae.toml` - Hidden file in current directory
3. `~/.config/ae/ae.toml` - XDG config directory
4. `~/.ae.toml` - Home directory

The first file found is used. If no config file exists, defaults are used.

## Full Configuration Reference

```toml
# ae.toml - Complete Configuration Reference

#──────────────────────────────────────────────────────────────
# GENERAL SETTINGS
#──────────────────────────────────────────────────────────────

[general]
# Default agent to use when starting ae
# Options: "claude-code", "codex"
default_agent = "claude-code"

# Cost mode determines which models are used
# Options: "cheap", "balanced", "quality"
cost_mode = "balanced"

# Enable debug logging
debug = false

#──────────────────────────────────────────────────────────────
# AGENT CONFIGURATION
#──────────────────────────────────────────────────────────────

[agents.claude-code]
# Command to run Claude Code
command = "claude"

# Flag for non-interactive mode (used in ensemble)
print_flag = "--print"

# Enable or disable this agent
enabled = true

[agents.codex]
# Command to run Codex
command = "codex"

# Flag for non-interactive mode
quiet_flag = "--quiet"

# Enable or disable this agent
enabled = true

#──────────────────────────────────────────────────────────────
# ENSEMBLE SETTINGS
#──────────────────────────────────────────────────────────────

[ensemble]
# Execution strategy
# "parallel" - Run agents simultaneously (faster)
# "sequential" - Run agents one after another
strategy = "parallel"

# Timeout in seconds for each agent
timeout = 300

# Override synthesis model (ignores cost mode setting)
# synthesis_model = "claude-sonnet-4-5-20250929"

# Synthesis provider
# "auto" - Auto-detect (SDK if API key, else CLI)
# "sdk" - Use Anthropic SDK (requires ANTHROPIC_API_KEY)
# "cli" - Use Claude CLI (works with subscription)
# "none" - No synthesis, show raw results
synthesis_provider = "auto"

#──────────────────────────────────────────────────────────────
# BRIDGE SETTINGS
#──────────────────────────────────────────────────────────────

[bridge]
# Files to inject bridge content into
target_files = ["CLAUDE.md", "AGENTS.md"]

# Automatically inject bridge content on startup
auto_inject = true

# Automatically clean up bridge content on exit
auto_cleanup = true

#──────────────────────────────────────────────────────────────
# UI SETTINGS
#──────────────────────────────────────────────────────────────

[ui]
# Show status bar at top of terminal
status_bar = true

# Status bar refresh rate in milliseconds
status_bar_refresh = 1000

# UI theme
# "default", "minimal", "verbose"
theme = "default"

#──────────────────────────────────────────────────────────────
# MODEL PRESETS
#──────────────────────────────────────────────────────────────

[models.cheap]
primary = "claude-haiku-4-5-20251001"
synthesis = "claude-haiku-4-5-20251001"

[models.balanced]
primary = "claude-sonnet-4-5-20250929"
synthesis = "claude-sonnet-4-5-20250929"

[models.quality]
primary = "claude-opus-4-5-20251101"
synthesis = "claude-opus-4-5-20251101"
```

## Common Configurations

### Minimal (Use Defaults)

No config file needed! ae works out of the box.

### Claude Code Only

```toml
[agents.codex]
enabled = false
```

### Codex Only

```toml
[general]
default_agent = "codex"

[agents.claude-code]
enabled = false
```

### Quality Mode Default

```toml
[general]
cost_mode = "quality"
```

### Disable Bridge

```toml
[bridge]
auto_inject = false
```

### Disable Status Bar

```toml
[ui]
status_bar = false
```

### Custom Agent Commands

If your agents are installed with different names:

```toml
[agents.claude-code]
command = "/usr/local/bin/claude-code"

[agents.codex]
command = "openai-codex"
```

### Faster Ensemble Timeout

```toml
[ensemble]
timeout = 60  # 1 minute instead of 5
```

### Force CLI Synthesis

```toml
[ensemble]
synthesis_provider = "cli"
```

## Environment Variables

### ANTHROPIC_API_KEY

If set, enables SDK synthesis mode automatically.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Validation

ae validates configuration on startup. Invalid values will show an error:

```
Config validation error at 'general.cost_mode': must be one of: cheap, balanced, quality
```

## Debugging Configuration

Use debug mode to see which config file is loaded:

```bash
ae --debug
```

Output:
```
[ae] Loaded config from: /path/to/ae.toml
[ae] Synthesis provider: cli
```
