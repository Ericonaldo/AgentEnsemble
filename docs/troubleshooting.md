# Troubleshooting

Solutions to common issues.

## Installation Issues

### "Command 'ae' not found"

ae is not in your PATH.

**Solution 1:** Run `npm link` in the AgentEnsemble directory:
```bash
cd AgentEnsemble
npm link
```

**Solution 2:** Run directly:
```bash
node dist/index.js
```

### npm install fails

**Solution:** Check Node.js version:
```bash
node --version  # Needs v18+
```

If outdated, update Node.js from [nodejs.org](https://nodejs.org/).

### npm run build fails

**Solution:** Ensure TypeScript compiles:
```bash
npm install
npm run clean
npm run build
```

## Startup Issues

### "Command 'claude' not found"

Claude Code CLI is not installed or not in PATH.

**Solution 1:** Install Claude Code from [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code)

**Solution 2:** Check if installed but not in PATH:
```bash
which claude
# or
find /usr -name "claude" 2>/dev/null
```

**Solution 3:** Specify full path in config:
```toml
[agents.claude-code]
command = "/full/path/to/claude"
```

### "Command 'codex' not found"

Codex is not installed.

**Solution 1:** Install Codex from [github.com/openai/codex](https://github.com/openai/codex)

**Solution 2:** Disable Codex if not needed:
```toml
[agents.codex]
enabled = false
```

### "posix_spawnp failed"

The agent command exists but can't be executed.

**Solutions:**
- Check file permissions: `ls -la $(which claude)`
- Try running agent directly: `claude --version`
- Reinstall the agent

## Synthesis Issues

### "No synthesis provider available"

Neither API key nor Claude CLI is available.

**Solution 1:** Set API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Solution 2:** Ensure Claude CLI is logged in:
```bash
claude  # Login if prompted
```

**Solution 3:** Use without synthesis:
```bash
ae --synthesis-provider none
```

### Synthesis is slow

CLI mode is slower than SDK mode.

**Solutions:**
- Use SDK if you have an API key
- Reduce timeout: `[ensemble] timeout = 60`
- Use cheaper cost mode: `ae --cost-mode cheap`

### Synthesis fails with timeout

**Solution:** Increase timeout:
```toml
[ensemble]
timeout = 600  # 10 minutes
```

## Display Issues

### Status bar looks garbled

Some terminals don't support ANSI escape codes.

**Solution 1:** Use debug mode:
```bash
ae --debug
```

**Solution 2:** Disable status bar:
```toml
[ui]
status_bar = false
```

**Solution 3:** Try a different terminal (iTerm2, Windows Terminal, etc.)

### Output is truncated

Large outputs may be cut off.

**Solution:** Check your terminal's scrollback buffer settings.

## Ensemble Issues

### Only one agent responds

Check if other agents are enabled and installed.

**Debug:**
```bash
ae --debug
```
```
/ae:config
```

**Solution:**
```bash
# Check each agent
claude --version
codex --version
```

### Agents timeout

Tasks take longer than the timeout setting.

**Solution:**
```toml
[ensemble]
timeout = 600  # Increase to 10 minutes
```

### Results not synthesized properly

**Solutions:**
- Use quality mode: `ae --cost-mode quality`
- Be more specific in your task
- Check if one agent failed

## Bridge Issues

### Bridge content remains after exit

ae crashed or was force-killed.

**Solution:** Manually remove from CLAUDE.md:
```markdown
<!-- ae:bridge:start -->
DELETE THIS SECTION
<!-- ae:bridge:end -->
```

### Bridge not injected

**Check:**
```
/ae:bridge
```

**Solutions:**
- Ensure `[bridge] auto_inject = true`
- Check target files exist or can be created
- Check file permissions

## Configuration Issues

### Config not loading

**Debug:**
```bash
ae --debug
```

Look for "Loaded config from" message.

**Check locations:**
1. `./ae.toml`
2. `./.ae.toml`
3. `~/.config/ae/ae.toml`
4. `~/.ae.toml`

### Invalid config error

ae validates config on startup.

**Common errors:**
```
must be one of: cheap, balanced, quality
```

**Solution:** Check the value in your config file matches allowed options.

## Getting More Help

### Enable Debug Mode

```bash
ae --debug
```

Shows detailed logs of what ae is doing.

### Check Version

```bash
ae --version
```

### Report Issues

[GitHub Issues](https://github.com/Ericonaldo/AgentEnsemble/issues)

Include:
- ae version
- Node.js version
- Operating system
- Error message
- Steps to reproduce
