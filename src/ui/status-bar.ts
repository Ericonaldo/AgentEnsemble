/**
 * Status bar UI component for AgentEnsemble
 * Displays at the top of the terminal
 */

import chalk from 'chalk';
import type { StatusBarData, AgentStatus, EnsembleStatus, CostMode } from '../types.js';

/**
 * Status bar renderer
 */
export class StatusBar {
  private data: StatusBarData;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private refreshRate: number;
  private enabled: boolean;
  private lastRender: string = '';

  constructor(options: {
    enabled?: boolean;
    refreshRate?: number;
  } = {}) {
    this.enabled = options.enabled ?? true;
    this.refreshRate = options.refreshRate ?? 1000;

    this.data = {
      agent: 'claude-code',
      status: 'idle',
      ensembleStatus: 'idle',
      costMode: 'balanced',
      bridgeActive: false,
    };
  }

  /**
   * Update status bar data
   */
  update(data: Partial<StatusBarData>): void {
    Object.assign(this.data, data);
    if (this.enabled) {
      this.render();
    }
  }

  /**
   * Render the status bar
   */
  render(): void {
    if (!this.enabled) return;

    const rendered = this.formatStatusBar();

    // Only update if changed
    if (rendered === this.lastRender) return;
    this.lastRender = rendered;

    // Save cursor, move to top, print, restore cursor
    process.stdout.write('\x1b7');      // Save cursor
    process.stdout.write('\x1b[1;1H');  // Move to top-left
    process.stdout.write('\x1b[2K');    // Clear line
    process.stdout.write(rendered);
    process.stdout.write('\x1b8');      // Restore cursor
  }

  /**
   * Format the status bar content
   */
  private formatStatusBar(): string {
    const parts: string[] = [];

    // AE label
    parts.push(chalk.bgBlue.white.bold(' ae '));

    // Agent
    parts.push(chalk.cyan(`agent:${this.data.agent}`));

    // Status
    parts.push(this.formatStatus(this.data.status));

    // Ensemble status (if not idle)
    if (this.data.ensembleStatus !== 'idle') {
      parts.push(this.formatEnsembleStatus(this.data.ensembleStatus));
    }

    // Cost mode
    parts.push(this.formatCostMode(this.data.costMode));

    // Bridge indicator
    if (this.data.bridgeActive) {
      parts.push(chalk.green('bridge'));
    }

    return parts.join(chalk.gray(' | '));
  }

  /**
   * Format agent status
   */
  private formatStatus(status: AgentStatus): string {
    switch (status) {
      case 'idle':
        return chalk.gray('idle');
      case 'running':
        return chalk.green('running');
      case 'waiting':
        return chalk.yellow('waiting');
      case 'error':
        return chalk.red('error');
    }
  }

  /**
   * Format ensemble status
   */
  private formatEnsembleStatus(status: EnsembleStatus): string {
    switch (status) {
      case 'idle':
        return '';
      case 'running':
        return chalk.magenta('ensemble:running');
      case 'synthesizing':
        return chalk.magenta('ensemble:synthesizing');
      case 'complete':
        return chalk.green('ensemble:complete');
      case 'error':
        return chalk.red('ensemble:error');
    }
  }

  /**
   * Format cost mode
   */
  private formatCostMode(mode: CostMode): string {
    switch (mode) {
      case 'cheap':
        return chalk.green('$');
      case 'balanced':
        return chalk.yellow('$$');
      case 'quality':
        return chalk.red('$$$');
    }
  }

  /**
   * Start auto-refresh
   */
  startRefresh(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.render();
    }, this.refreshRate);
  }

  /**
   * Stop auto-refresh
   */
  stopRefresh(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Clear the status bar
   */
  clear(): void {
    if (!this.enabled) return;

    process.stdout.write('\x1b7');      // Save cursor
    process.stdout.write('\x1b[1;1H');  // Move to top-left
    process.stdout.write('\x1b[2K');    // Clear line
    process.stdout.write('\x1b8');      // Restore cursor

    this.lastRender = '';
  }

  /**
   * Enable/disable the status bar
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
      this.stopRefresh();
    }
  }

  /**
   * Get current data
   */
  getData(): StatusBarData {
    return { ...this.data };
  }
}

/**
 * Create a status bar instance
 */
export function createStatusBar(options?: {
  enabled?: boolean;
  refreshRate?: number;
}): StatusBar {
  return new StatusBar(options);
}
