/**
 * Output monitor for AgentEnsemble
 * Monitors PTY output for patterns and events
 */

import { EventEmitter } from 'node:events';

/**
 * Output patterns to detect
 */
export interface OutputPattern {
  name: string;
  pattern: RegExp;
  handler?: (match: RegExpMatchArray) => void;
}

/**
 * Output monitor that watches PTY output
 */
export class OutputMonitor extends EventEmitter {
  private buffer: string = '';
  private patterns: OutputPattern[] = [];
  private maxBufferSize: number = 10000;

  constructor() {
    super();
  }

  /**
   * Register a pattern to watch for
   */
  addPattern(pattern: OutputPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove a pattern by name
   */
  removePattern(name: string): void {
    this.patterns = this.patterns.filter(p => p.name !== name);
  }

  /**
   * Process output data
   */
  processOutput(data: Buffer): void {
    const text = data.toString('utf-8');
    this.buffer += text;

    // Trim buffer if too large
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer = this.buffer.slice(-this.maxBufferSize);
    }

    // Check patterns
    for (const pattern of this.patterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        this.emit('pattern', pattern.name, match);
        if (pattern.handler) {
          pattern.handler(match);
        }
      }
    }

    // Emit raw output event
    this.emit('output', text);
  }

  /**
   * Get recent output buffer
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }

  /**
   * Search buffer for pattern
   */
  searchBuffer(pattern: RegExp): RegExpMatchArray | null {
    return this.buffer.match(pattern);
  }

  /**
   * Get last N lines from buffer
   */
  getLastLines(n: number): string[] {
    const lines = this.buffer.split('\n');
    return lines.slice(-n);
  }
}

/**
 * Common patterns for AI agent output
 */
export const COMMON_PATTERNS: OutputPattern[] = [
  {
    name: 'thinking',
    pattern: /\b(thinking|analyzing|processing)\b/i,
  },
  {
    name: 'error',
    pattern: /\b(error|failed|exception)\b/i,
  },
  {
    name: 'complete',
    pattern: /\b(done|complete|finished|success)\b/i,
  },
  {
    name: 'prompt',
    pattern: /[>$#]\s*$/,
  },
];
