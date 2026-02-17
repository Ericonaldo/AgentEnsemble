# Bridge System

Automatic context sharing between ae and your agents.

## What is Bridge?

The bridge automatically injects ae-specific context into your project's CLAUDE.md or AGENTS.md file. This helps agents understand they're running inside ae.

## How It Works

1. **Startup**: ae injects bridge content into CLAUDE.md
2. **Runtime**: Agents can see ae context
3. **Exit**: ae removes the bridge content

## Injected Content

```markdown
<!-- ae:bridge:start -->
## AgentEnsemble Active

This project is being developed with AgentEnsemble.

**Active Configuration:**
- Agents: claude-code, codex
- Cost Mode: balanced
- Ensemble: available via /ae:ensemble

**Note:** ae commands start with `/ae:` and are handled by the wrapper, not passed to agents.

<!-- ae:bridge:end -->
```

## Configuration

### Enable/Disable Bridge

```toml
[bridge]
auto_inject = true   # Inject on startup
auto_cleanup = true  # Remove on exit
```

To disable bridge entirely:

```toml
[bridge]
auto_inject = false
```

### Target Files

Specify which files to inject into:

```toml
[bridge]
target_files = ["CLAUDE.md", "AGENTS.md"]
```

ae uses the first file that exists, or creates CLAUDE.md if none exist.

## Check Bridge Status

Inside ae:

```
/ae:bridge
```

Output:
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

## Manual Cleanup

If ae crashes or is force-killed, bridge content may remain. To clean up manually, remove everything between these markers in your CLAUDE.md:

```markdown
<!-- ae:bridge:start -->
... remove this content ...
<!-- ae:bridge:end -->
```

## Smart Bridge (Experimental)

When a synthesis provider is available, ae can generate context-aware bridge content tailored to your project. This is automatic when using `auto` or `cli` synthesis providers.

## Why Bridge?

| Without Bridge | With Bridge |
|----------------|-------------|
| Agent doesn't know about ae | Agent knows ae context |
| May suggest incompatible approaches | Can reference ae features |
| No ensemble awareness | Knows ensemble is available |
