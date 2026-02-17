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
