# AgentEnsemble - Bugs and Improvements

Analysis from code review and testing.

## Bugs

### 1. **CLI Synthesis Timeout Not Cancellable**
**File:** `src/models/client.ts:236`
```typescript
setTimeout(() => {
  proc.kill();
  reject(new Error('claude CLI timed out'));
}, 300000);
```
The timeout is never cleared if the process completes before 5 minutes, causing potential memory leaks.

**Fix:** Store timeout and clear it on process completion.

### 2. **Bridge Cleanup Not Called on Unexpected Exit**
**File:** `src/index.ts`
The `cleanupBridge()` is only called in the `handleExit()` method, but if the process crashes or is killed with SIGKILL, the bridge content remains in CLAUDE.md.

**Fix:** Add a note in docs or implement file locking/detection.

### 3. **Interceptor Doesn't Handle Multi-byte UTF-8**
**File:** `src/proxy/interceptor.ts:77`
```typescript
const char = String.fromCharCode(byte);
```
This only works for ASCII. Multi-byte UTF-8 characters (emoji, non-ASCII) will be corrupted.

**Fix:** Buffer bytes and decode as UTF-8 when complete.

### 4. **Status Bar Flickers in Some Terminals**
**File:** `src/ui/status-bar.ts`
The ANSI escape sequences used may not work correctly in all terminal emulators (e.g., Windows cmd).

**Fix:** Use a terminal capability detection library or make configurable.

### 5. **No Timeout on `commandExists` Check**
**File:** `src/proxy/index.ts:16-29`
If `which` hangs (rare but possible on network filesystems), the tool hangs forever.

**Fix:** Add timeout to the promise.

### 6. **Ensemble Engine Doesn't Handle Partial Failures**
**File:** `src/ensemble/index.ts`
If one agent fails in parallel mode, the error is caught but there's no retry logic or user notification beyond the result.

**Fix:** Add retry logic or clearer error reporting.

## Improvements

### 1. **Add `--dry-run` Flag**
Allow users to see what commands would be run without executing them.

### 2. **Add Command History**
Store and allow retrieval of previous `/ae:*` commands.

### 3. **Support More Agents**
- Add adapters for Cursor, Copilot CLI, Aider
- Make adapter registration pluggable

### 4. **Add Streaming Output for Ensemble**
Currently synthesis waits for all agents to complete. Show real-time output from agents as they work.

### 5. **Add Configuration Validation on Startup**
Verify agents are installed before starting PTY.

### 6. **Add Metrics/Logging**
Track execution times, token usage, costs per session.

### 7. **Support Windows**
- Replace `which` with proper cross-platform check
- Test node-pty on Windows
- Handle path separators

### 8. **Add Tests**
No unit tests exist. Add:
- Interceptor parsing tests
- Config validation tests
- Adapter mock tests

### 9. **Improve CLI Output**
- Add `--quiet` flag to suppress status bar
- Add `--json` flag for machine-readable output
- Add progress indicators for long operations

### 10. **Add Plugin System**
Allow custom adapters and synthesis strategies via plugins.

### 11. **Improve Error Messages**
Add suggestions for common errors:
- "claude not found" -> suggest installation
- "API key missing" -> explain alternatives

### 12. **Rate Limiting for CLI Synthesis**
When using `claude --print` for synthesis, add rate limiting to avoid overwhelming the CLI.

## Code Quality

### 1. **Missing Type Exports**
Some types used across modules aren't properly exported from their index files.

### 2. **Inconsistent Error Handling**
Some functions throw, some return null, some emit events. Standardize.

### 3. **Magic Numbers**
ANSI codes, timeouts, etc. should be constants.

### 4. **No JSDoc for Public APIs**
Add documentation for public methods.

## Security

### 1. **Command Injection Risk**
**File:** `src/models/client.ts:206`
```typescript
spawn('claude', ['--print', prompt], ...)
```
If `prompt` contains shell metacharacters, this could be exploited. While `spawn` with array args is generally safe, validate/sanitize input.

### 2. **Environment Variable Exposure**
Full `process.env` is passed to child processes. Consider filtering sensitive vars.

## Priority Fixes

1. **High:** UTF-8 handling in interceptor
2. **High:** Timeout cleanup in CLI synthesis
3. **Medium:** Cross-platform `which` command
4. **Medium:** Add basic tests
5. **Low:** Plugin system
