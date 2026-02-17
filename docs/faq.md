# FAQ

Frequently asked questions about AgentEnsemble.

## General

### What is AgentEnsemble?

AgentEnsemble (ae) is a wrapper for AI coding agents like Claude Code and Codex. It lets you run tasks on multiple agents simultaneously and synthesizes their responses into a unified answer.

### Do I need an API key?

**No!** ae works with subscription-based login. If you have Claude Code installed and logged in via your Anthropic account, ae can use it for synthesis without a separate API key.

If you do have an `ANTHROPIC_API_KEY`, ae will use it for faster synthesis.

### Is ae free?

ae itself is free and open source. However:
- The underlying agents (Claude Code, Codex) may have their own costs
- Synthesis uses AI models, which may incur costs depending on your setup

### Does ae modify my code?

No, ae never modifies your code directly. It only:
- Injects temporary content into CLAUDE.md (bridge system)
- Passes your commands to agents
- Shows synthesized results

Any code changes come from the underlying agents, not ae.

## Usage

### Can I use ae with just one agent?

Yes! Disable agents you don't have:

```toml
[agents.codex]
enabled = false
```

ae works fine with a single agent, though ensemble features won't be as useful.

### What's the difference between ae and just using Claude Code?

ae adds:
- **Ensemble mode** - Run tasks on multiple agents
- **Synthesis** - AI-powered combination of results
- **Config bridging** - Automatic context sharing
- **Cost modes** - Easy model switching

If you only use Claude Code and don't need these features, you don't need ae.

### Can I add other agents?

Currently, ae supports Claude Code and Codex. Support for other agents (Cursor, Copilot, Aider) is planned. See the roadmap in BUGS_AND_IMPROVEMENTS.md.

### How do I exit ae?

Just exit normally:
- Type `exit`
- Press Ctrl+C
- Press Ctrl+D

ae cleans up (removes bridge content) automatically.

## Ensemble

### When should I use ensemble mode?

Use `/ae:ensemble` when you want:
- Multiple perspectives on a problem
- Higher confidence in answers
- To compare agent approaches
- Comprehensive analysis

### Is ensemble slower?

Somewhat. Ensemble runs agents in parallel, but synthesis adds time. For quick questions, normal mode is faster.

### Can I see raw outputs without synthesis?

Yes:
```bash
ae --synthesis-provider none
```

Then:
```
/ae:ensemble <your task>
```

This shows each agent's response without combining them.

### What if agents give conflicting answers?

The synthesis LLM handles conflicts by:
- Identifying points of agreement
- Noting disagreements
- Explaining tradeoffs
- Suggesting the best approach

## Configuration

### Where should I put my config file?

Recommended locations:
- **Project-specific**: `./ae.toml` in your project root
- **Global**: `~/.config/ae/ae.toml`

### What's the minimum config needed?

None! ae works with defaults. Only create a config file if you need to customize.

### How do I disable the status bar?

```toml
[ui]
status_bar = false
```

Or use debug mode: `ae --debug`

## Troubleshooting

### Why is synthesis slow?

If using CLI provider, it's slower than SDK. Options:
- Set `ANTHROPIC_API_KEY` for SDK mode
- Use `--cost-mode cheap` for faster models
- Use `--synthesis-provider none` to skip synthesis

### Why won't ae start?

Common causes:
1. Agent not installed (`claude` or `codex` not found)
2. Node.js version too old (needs v18+)
3. Not built (`npm run build`)
4. Not linked (`npm link`)

Run `ae --debug` for detailed errors.

### How do I report a bug?

Open an issue on [GitHub](https://github.com/Ericonaldo/AgentEnsemble/issues) with:
- ae version (`ae --version`)
- Node.js version (`node --version`)
- Operating system
- Error message
- Steps to reproduce

## Technical

### What models does ae use?

Depends on cost mode:

| Mode | Model |
|------|-------|
| cheap | Haiku |
| balanced | Sonnet |
| quality | Opus |

### How does bridge injection work?

ae adds content between markers:
```markdown
<!-- ae:bridge:start -->
...content...
<!-- ae:bridge:end -->
```

This content is removed when ae exits.

### Is my data sent anywhere?

ae sends data to:
- The AI agents you're using (Claude Code, Codex)
- For synthesis: Anthropic's API (via SDK or CLI)

No data is sent to AgentEnsemble developers.

### Can I use ae in CI/CD?

ae is designed for interactive use. For CI/CD, consider using the agents directly:
```bash
claude --print "Your task"
```

## Support

### Where can I get help?

- **Docs**: You're reading them!
- **GitHub Issues**: [Report bugs](https://github.com/Ericonaldo/AgentEnsemble/issues)
- **Debug mode**: `ae --debug` for detailed logs

### How can I contribute?

- Report bugs and suggest features via GitHub Issues
- Submit pull requests
- Improve documentation
- Share feedback
