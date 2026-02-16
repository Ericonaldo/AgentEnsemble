/**
 * PTY Proxy for AgentEnsemble
 * Main proxy module that wraps the child agent
 */

import { spawn, IPty } from 'node-pty';
import { EventEmitter } from 'node:events';
import type { AEConfig, AgentType, ProxyState, AECommand } from '../types.js';
import { InputInterceptor } from './interceptor.js';
import { OutputMonitor } from './monitor.js';

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

    this.state.agentType = agent;
    this.state.agentStatus = 'running';

    // Get terminal size
    const cols = process.stdout.columns || 80;
    const rows = process.stdout.rows || 24;

    // Build the command
    const command = agentConfig.command;
    const args: string[] = [];

    // Spawn the PTY
    this.pty = spawn(command, args, {
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
