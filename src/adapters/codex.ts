/**
 * Codex adapter
 * Uses `codex --quiet` for non-interactive execution
 */

import type { AgentConfig, AgentResult } from '../types.js';
import { BaseAdapter } from './base.js';

/**
 * Adapter for OpenAI Codex CLI
 */
export class CodexAdapter extends BaseAdapter {
  constructor(config: AgentConfig, debug: boolean = false) {
    super('codex', config, debug);
  }

  /**
   * Execute a task using codex --quiet
   */
  async execute(task: string): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const args = this.getExecutionFlags();
      args.push(task);

      const result = await this.runCommand(this.config.command, args);

      return {
        agent: 'codex',
        output: result.stdout || result.stderr,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      };
    } catch (error) {
      return {
        agent: 'codex',
        output: '',
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get execution flags for Codex
   */
  protected getExecutionFlags(): string[] {
    const flags: string[] = [];

    // Use --quiet flag for non-interactive mode
    if (this.config.quietFlag) {
      flags.push(this.config.quietFlag);
    } else {
      flags.push('--quiet');
    }

    return flags;
  }
}

/**
 * Create a Codex adapter with default config
 */
export function createCodexAdapter(
  config?: Partial<AgentConfig>,
  debug: boolean = false
): CodexAdapter {
  const fullConfig: AgentConfig = {
    command: 'codex',
    quietFlag: '--quiet',
    enabled: true,
    ...config,
  };

  return new CodexAdapter(fullConfig, debug);
}
