/**
 * Claude Code adapter
 * Uses `claude --print` for non-interactive execution
 */

import type { AgentConfig, AgentResult } from '../types.js';
import { BaseAdapter } from './base.js';

/**
 * Adapter for Claude Code CLI
 */
export class ClaudeCodeAdapter extends BaseAdapter {
  constructor(config: AgentConfig, debug: boolean = false) {
    super('claude-code', config, debug);
  }

  /**
   * Execute a task using claude --print
   */
  async execute(task: string): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const args = this.getExecutionFlags();
      args.push(task);

      const result = await this.runCommand(this.config.command, args);

      return {
        agent: 'claude-code',
        output: result.stdout || result.stderr,
        exitCode: result.exitCode,
        duration: Date.now() - startTime,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      };
    } catch (error) {
      return {
        agent: 'claude-code',
        output: '',
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get execution flags for Claude Code
   */
  protected getExecutionFlags(): string[] {
    const flags: string[] = [];

    // Use --print flag for non-interactive mode
    if (this.config.printFlag) {
      flags.push(this.config.printFlag);
    } else {
      flags.push('--print');
    }

    return flags;
  }
}

/**
 * Create a Claude Code adapter with default config
 */
export function createClaudeCodeAdapter(
  config?: Partial<AgentConfig>,
  debug: boolean = false
): ClaudeCodeAdapter {
  const fullConfig: AgentConfig = {
    command: 'claude',
    printFlag: '--print',
    enabled: true,
    ...config,
  };

  return new ClaudeCodeAdapter(fullConfig, debug);
}
