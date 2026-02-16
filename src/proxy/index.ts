/**
 * PTY Proxy for AgentEnsemble
 * Main proxy module that wraps the child agent
 */

import { spawn as ptySpawn, IPty } from 'node-pty';
import { spawn as cpSpawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { AEConfig, AgentType, ProxyState, AECommand } from '../types.js';
import { InputInterceptor } from './interceptor.js';
import { OutputMonitor } from './monitor.js';

/**
 * Check if a command exists in PATH (with timeout)
 */
async function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Use 'which' on Unix, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    const proc = cpSpawn(checkCmd, [command], { stdio: ['ignore', 'pipe', 'pipe'] });

    let settled = false;

    // Timeout after 5 seconds
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        resolve(false);
      }
    }, 5000);

    proc.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(code === 0);
    });

    proc.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(false);
    });
  });
}

/**
 * PTY Proxy that wraps a child agent process
 */
export class PTYProxy extends EventEmitter {
  private pty: IPty | null = null;
  private interceptor: InputInterceptor;
  private monitor: OutputMonitor;
  private state: ProxyState;
  private config: AEConfig;
  private isRunning: boolean = false;

  constructor(config: AEConfig) {
    super();
    this.config = config;
    this.interceptor = new InputInterceptor();
    this.monitor = new OutputMonitor();

    this.state = {
      agentType: config.general.defaultAgent,
      agentStatus: 'idle',
      ensembleStatus: 'idle',
      inputBuffer: '',
      isIntercepting: false,
    };

    // Forward interceptor events
    this.interceptor.on('command', (cmd: AECommand) => {
      this.emit('command', cmd);
    });

    // Forward monitor events
    this.monitor.on('output', (text: string) => {
      this.emit('output', text);
    });

    this.monitor.on('pattern', (name: string, match: RegExpMatchArray) => {
      this.emit('pattern', name, match);
    });
  }

  /**
   * Start the PTY with the specified agent
   */
  async start(agentType?: AgentType): Promise<void> {
    if (this.isRunning) {
      throw new Error('PTY proxy is already running');
    }

    const agent = agentType || this.config.general.defaultAgent;
    const agentConfig = this.config.agents[agent];

    if (!agentConfig.enabled) {
      throw new Error(`Agent ${agent} is not enabled`);
    }

    // Build the command
    const command = agentConfig.command;

    // Check if command exists before trying to spawn
    const exists = await commandExists(command);
    if (!exists) {
      throw new Error(
        `Command '${command}' not found. Please ensure ${agent} is installed and in your PATH.\n` +
        `  - For Claude Code: https://docs.anthropic.com/en/docs/claude-code\n` +
        `  - For Codex: https://github.com/openai/codex`
      );
    }

    this.state.agentType = agent;
    this.state.agentStatus = 'running';

    // Get terminal size
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;

    const args: string[] = [];

    // Spawn the PTY
    try {
      this.pty = ptySpawn(command, args, {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: process.cwd(),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          AE_ACTIVE: '1',
          AE_AGENT: agent,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to spawn '${command}': ${message}\n` +
        `Please ensure ${agent} is properly installed and executable.`
      );
    }

    this.isRunning = true;

    // Handle PTY output
    this.pty.onData((data: string) => {
      const buffer = Buffer.from(data, 'utf-8');
      this.monitor.processOutput(buffer);
      this.emit('data', buffer);
    });

    // Handle PTY exit
    this.pty.onExit(({ exitCode }) => {
      this.isRunning = false;
      this.state.agentStatus = 'idle';
      this.emit('exit', exitCode);
    });

    // Handle terminal resize
    process.stdout.on('resize', () => {
      if (this.pty) {
        this.pty.resize(
          process.stdout.columns || 80,
          process.stdout.rows || 24
        );
      }
    });

    this.emit('start', agent);
  }

  /**
   * Write data to the PTY
   */
  write(data: Buffer): void {
    // Process through interceptor
    const filtered = this.interceptor.processInput(data);

    // Update state
    const interceptorState = this.interceptor.getState();
    this.state.inputBuffer = interceptorState.lineBuffer;
    this.state.isIntercepting = interceptorState.isIntercepting;

    // Forward non-intercepted data to PTY
    if (filtered && this.pty) {
      this.pty.write(filtered.toString('utf-8'));
    }
  }

  /**
   * Write raw data directly to PTY (bypassing interceptor)
   */
  writeRaw(data: string): void {
    if (this.pty) {
      this.pty.write(data);
    }
  }

  /**
   * Resize the PTY
   */
  resize(cols: number, rows: number): void {
    if (this.pty) {
      this.pty.resize(cols, rows);
    }
  }

  /**
   * Stop the PTY
   */
  stop(): void {
    if (this.pty) {
      this.pty.kill();
      this.pty = null;
    }
    this.isRunning = false;
    this.state.agentStatus = 'idle';
  }

  /**
   * Get current state
   */
  getState(): ProxyState {
    return { ...this.state };
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get the output monitor
   */
  getMonitor(): OutputMonitor {
    return this.monitor;
  }

  /**
   * Get the input interceptor
   */
  getInterceptor(): InputInterceptor {
    return this.interceptor;
  }

  /**
   * Update state
   */
  updateState(updates: Partial<ProxyState>): void {
    Object.assign(this.state, updates);
    this.emit('stateChange', this.state);
  }
}

export { InputInterceptor } from './interceptor.js';
export { OutputMonitor, COMMON_PATTERNS } from './monitor.js';
