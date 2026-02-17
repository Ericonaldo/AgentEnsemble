# Gemini CLI Adapter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Gemini CLI as a third supported agent in AgentEnsemble, enabling ensemble execution across Claude Code, Codex, and Gemini.

**Architecture:** Follow the existing adapter pattern — extend the `AgentType` union, create a `GeminiAdapter` extending `BaseAdapter`, register it in the factory, and update config defaults/validation. Gemini CLI uses `gemini -p "<task>"` for non-interactive execution.

**Tech Stack:** TypeScript, Node.js built-in test runner (`node --test`)

---

### Task 1: Extend types to support Gemini

**Files:**
- Modify: `src/types.ts:6` (AgentType union)

**Step 1: Add 'gemini' to AgentType**

In `src/types.ts`, change line 6 from:
```typescript
export type AgentType = 'claude-code' | 'codex';
```
to:
```typescript
export type AgentType = 'claude-code' | 'codex' | 'gemini';
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Compilation errors in `src/config/defaults.ts` because `DEFAULT_CONFIG.agents` is missing the `gemini` key. This is expected — we fix it in Task 2.

---

### Task 2: Add Gemini to config defaults

**Files:**
- Modify: `src/config/defaults.ts:13-24` (agents section)
- Modify: `src/config/defaults.ts:35` (bridge.targetFiles)

**Step 1: Add gemini agent config**

In `src/config/defaults.ts`, add the gemini entry to the `agents` object (after the codex entry):

```typescript
    'gemini': {
      command: 'gemini',
      promptFlag: '-p',
      enabled: true,
    },
```

**Step 2: Add GEMINI.md to bridge target files**

In the same file, change `targetFiles` from:
```typescript
    targetFiles: ['CLAUDE.md', 'AGENTS.md'],
```
to:
```typescript
    targetFiles: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'],
```

**Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS (no errors)

---

### Task 3: Add Gemini to config validation

**Files:**
- Modify: `src/config/schema.ts:8` (VALID_AGENT_TYPES)
- Modify: `src/config/schema.ts:119-141` (agents validation — handle `prompt_flag`)

**Step 1: Add 'gemini' to VALID_AGENT_TYPES**

Change line 8 from:
```typescript
const VALID_AGENT_TYPES: AgentType[] = ['claude-code', 'codex'];
```
to:
```typescript
const VALID_AGENT_TYPES: AgentType[] = ['claude-code', 'codex', 'gemini'];
```

**Step 2: Handle prompt_flag in agents validation**

In the agents section validation loop (around line 128-131), after the `quiet_flag` handling, add:

```typescript
      if (agentRaw.prompt_flag !== undefined) {
        config.agents[agentType].promptFlag = agentRaw.prompt_flag;
      }
```

Also add `prompt_flag` to the `RawTOMLConfig` interface in `src/types.ts` — in the agents Record, add:
```typescript
    prompt_flag?: string;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

---

### Task 4: Create GeminiAdapter

**Files:**
- Create: `src/adapters/gemini.ts`

**Step 1: Write the adapter**

Create `src/adapters/gemini.ts`:

```typescript
/**
 * Gemini CLI adapter
 * Uses `gemini -p` for non-interactive execution
 */

import type { AgentConfig, AgentResult } from '../types.js';
import { BaseAdapter } from './base.js';

/**
 * Adapter for Google Gemini CLI
 */
export class GeminiAdapter extends BaseAdapter {
  constructor(config: AgentConfig, debug: boolean = false) {
    super('gemini', config, debug);
  }

  /**
   * Execute a task using gemini -p
   */
  async execute(task: string): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const args = this.getExecutionFlags();
      args.push(task);

      const result = await this.runCommand(this.config.command, args);

      return {
        agent: 'gemini',
        output: result.stdout || result.stderr,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      };
    } catch (error) {
      return {
        agent: 'gemini',
        output: '',
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get execution flags for Gemini CLI
   */
  protected getExecutionFlags(): string[] {
    const flags: string[] = [];

    // Use -p flag for non-interactive mode
    if (this.config.promptFlag) {
      flags.push(this.config.promptFlag);
    } else {
      flags.push('-p');
    }

    return flags;
  }
}

/**
 * Create a Gemini adapter with default config
 */
export function createGeminiAdapter(
  config?: Partial<AgentConfig>,
  debug: boolean = false
): GeminiAdapter {
  const fullConfig: AgentConfig = {
    command: 'gemini',
    promptFlag: '-p',
    enabled: true,
    ...config,
  };

  return new GeminiAdapter(fullConfig, debug);
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: SUCCESS

---

### Task 5: Register GeminiAdapter in factory

**Files:**
- Modify: `src/adapters/index.ts`

**Step 1: Add imports and exports**

Add to imports:
```typescript
import { GeminiAdapter, createGeminiAdapter } from './gemini.js';
```

Add to exports:
```typescript
export { GeminiAdapter, createGeminiAdapter } from './gemini.js';
```

**Step 2: Add gemini case to createAdapter switch**

Add before the `default` case:
```typescript
    case 'gemini':
      return new GeminiAdapter(config, debug);
```

**Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

---

### Task 6: Update CLI help text

**Files:**
- Modify: `src/index.ts:331` (CLI option description)

**Step 1: Update agent option description**

Change:
```typescript
  .option('-a, --agent <type>', 'default agent (claude-code or codex)')
```
to:
```typescript
  .option('-a, --agent <type>', 'default agent (claude-code, codex, or gemini)')
```

**Step 2: Final full build and verify**

Run: `npm run build`
Expected: SUCCESS — clean build with zero errors

---

### Task 7: Commit

**Step 1: Commit all changes**

```bash
git add src/types.ts src/config/defaults.ts src/config/schema.ts src/adapters/gemini.ts src/adapters/index.ts src/index.ts
git commit -m "feat: add Gemini CLI adapter support"
```
