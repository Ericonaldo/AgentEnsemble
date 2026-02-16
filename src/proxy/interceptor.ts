/**
 * Input interceptor for AgentEnsemble
 * Handles byte-by-byte input processing to detect /ae: commands
 */

import { EventEmitter } from 'node:events';
import type { AECommand } from '../types.js';

const AE_PREFIX = '/ae:';
const BACKSPACE = 0x7f;
const ENTER = 0x0d;
const CTRL_C = 0x03;
const CTRL_D = 0x04;

/**
 * Input interceptor that detects /ae: commands
 */
export class InputInterceptor extends EventEmitter {
  private lineBuffer: string = '';
  private isIntercepting: boolean = false;

  constructor() {
    super();
  }

  /**
   * Process incoming input data byte by byte
   * Returns data that should be forwarded to the PTY (or null if intercepted)
   */
  processInput(data: Buffer): Buffer | null {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];

      // Handle special control characters
      if (byte === CTRL_C || byte === CTRL_D) {
        // Reset state and pass through
        this.reset();
        result.push(byte);
        continue;
      }

      // Handle backspace
      if (byte === BACKSPACE) {
        if (this.lineBuffer.length > 0) {
          this.lineBuffer = this.lineBuffer.slice(0, -1);
          // Check if we're still in interception mode
          this.isIntercepting = this.lineBuffer.startsWith(AE_PREFIX);
        }
        if (!this.isIntercepting) {
          result.push(byte);
        }
        continue;
      }

      // Handle enter
      if (byte === ENTER) {
        if (this.isIntercepting) {
          // We have a complete /ae: command
          const command = this.parseCommand(this.lineBuffer);
          if (command) {
            this.emit('command', command);
          }
          this.reset();
          // Don't forward the enter to PTY
          continue;
        } else {
          // Not a command, forward enter
          this.reset();
          result.push(byte);
          continue;
        }
      }

      // Regular character input
      const char = String.fromCharCode(byte);

      // Check if this is a printable character
      if (byte >= 0x20 && byte < 0x7f) {
        this.lineBuffer += char;

        // Check if we should enter interception mode
        if (this.lineBuffer === AE_PREFIX.slice(0, this.lineBuffer.length)) {
          // Potential /ae: command, check if we have the full prefix
          if (this.lineBuffer.length >= AE_PREFIX.length) {
            this.isIntercepting = true;
          }
          // Don't forward yet - we're still determining if this is a command
          continue;
        } else if (this.isIntercepting) {
          // Already in interception mode, buffer the character
          continue;
        } else {
          // Not a command prefix, forward any buffered chars and this one
          if (this.lineBuffer.length > 1) {
            // Forward buffered characters (minus the one we just added)
            const buffered = this.lineBuffer.slice(0, -1);
            for (const c of buffered) {
              result.push(c.charCodeAt(0));
            }
          }
          result.push(byte);
          // Keep only the current character in buffer for potential next command
          this.lineBuffer = char;
          continue;
        }
      }

      // Non-printable, non-special character - pass through
      this.reset();
      result.push(byte);
    }

    if (result.length === 0) {
      return null;
    }

    return Buffer.from(result);
  }

  /**
   * Parse a command string into AECommand
   */
  private parseCommand(line: string): AECommand | null {
    if (!line.startsWith(AE_PREFIX)) {
      return null;
    }

    const commandPart = line.slice(AE_PREFIX.length);
    const parts = commandPart.trim().split(/\s+/);

    if (parts.length === 0 || !parts[0]) {
      return null;
    }

    return {
      name: parts[0],
      args: parts.slice(1),
      raw: line,
    };
  }

  /**
   * Reset the interceptor state
   */
  reset(): void {
    this.lineBuffer = '';
    this.isIntercepting = false;
  }

  /**
   * Get current interception state
   */
  getState(): { lineBuffer: string; isIntercepting: boolean } {
    return {
      lineBuffer: this.lineBuffer,
      isIntercepting: this.isIntercepting,
    };
  }

  /**
   * Check if currently intercepting
   */
  isCurrentlyIntercepting(): boolean {
    return this.isIntercepting;
  }

  /**
   * Get buffered input for echo
   */
  getBufferedInput(): string {
    return this.lineBuffer;
  }
}
