/**
 * Base adapter class for AI agents
 */

import { spawn } from 'node:child_process';
import type { AgentType, AgentConfig, AgentResult, IAgentAdapter } from '../types.js';

/**
 * Abstract base class for agent adapters
 */
export abstract class BaseAdapter implements IAgentAdapter {
  readonly type: AgentType;
  readonly config: AgentConfig;
  protected debug: boolean;

  constructor(type: AgentType, config: AgentConfig, debug: boolean = false) {
    this.type = type;
    this.config = config;
    this.debug = debug;
  }

  /**
   * Execute a task and return the output
   */
  abstract execute(task: string): Promise<AgentResult>;

  /**
   * Check if agent is available
   */
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', [this.config.command]);
      proc.on('close', (code) => {
        resolve(code === 0);
      });
      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Run a command and capture output
   */
  protected runCommand(
    command: string,
    args: string[],
    input?: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      if (this.debug) {
        console.error(`[${this.type}] Running: ${command} ${args.join(' ')}`);
      }

      const proc = spawn(command, args, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          AE_ACTIVE: '1',
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      if (input) {
        proc.stdin.write(input);
        proc.stdin.end();
      }

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (this.debug) {
          console.error(`[${this.type}] Finished in ${duration}ms with code ${code}`);
        }
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get the execution flags for the agent
   */
  protected abstract getExecutionFlags(): string[];
}
