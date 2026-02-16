/**
 * LLM client wrapper supporting both SDK and CLI modes
 * - SDK mode: Uses @anthropic-ai/sdk (requires ANTHROPIC_API_KEY)
 * - CLI mode: Uses `claude --print` (works with account-based auth)
 */

import Anthropic from '@anthropic-ai/sdk';
import { spawn } from 'child_process';
import type { LLMMessage, LLMClientOptions, SynthesisProvider } from '../types.js';

/**
 * Check if Anthropic API key is available
 */
export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Check if Claude CLI is available
 */
export async function hasClaudeCli(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Resolve the actual provider to use based on 'auto' setting
 */
export async function resolveProvider(
  provider: SynthesisProvider,
  debug: boolean = false
): Promise<'sdk' | 'cli' | 'none'> {
  if (provider === 'sdk') {
    if (!hasApiKey()) {
      if (debug) {
        console.error('[LLMClient] SDK requested but ANTHROPIC_API_KEY not set, falling back to none');
      }
      return 'none';
    }
    return 'sdk';
  }

  if (provider === 'cli') {
    if (!(await hasClaudeCli())) {
      if (debug) {
        console.error('[LLMClient] CLI requested but claude command not found, falling back to none');
      }
      return 'none';
    }
    return 'cli';
  }

  if (provider === 'none') {
    return 'none';
  }

  // Auto mode: prefer SDK if API key available, fall back to CLI
  if (hasApiKey()) {
    if (debug) {
      console.error('[LLMClient] Auto mode: using SDK (API key found)');
    }
    return 'sdk';
  }

  if (await hasClaudeCli()) {
    if (debug) {
      console.error('[LLMClient] Auto mode: using CLI (no API key, claude CLI available)');
    }
    return 'cli';
  }

  if (debug) {
    console.error('[LLMClient] Auto mode: no provider available');
  }
  return 'none';
}

/**
 * LLM client for making API calls (SDK mode)
 */
export class LLMClient {
  private client: Anthropic | null = null;
  private defaultModel: string;
  private debug: boolean;
  private provider: 'sdk' | 'cli' | 'none';

  constructor(options: {
    defaultModel?: string;
    debug?: boolean;
    provider?: 'sdk' | 'cli' | 'none';
  } = {}) {
    this.defaultModel = options.defaultModel || 'claude-sonnet-4-5-20250929';
    this.debug = options.debug || false;
    this.provider = options.provider || 'none';

    if (this.provider === 'sdk' && hasApiKey()) {
      this.client = new Anthropic();
    }
  }

  /**
   * Get current provider
   */
  getProvider(): 'sdk' | 'cli' | 'none' {
    return this.provider;
  }

  /**
   * Check if synthesis is available
   */
  isAvailable(): boolean {
    return this.provider !== 'none';
  }

  /**
   * Send a message and get a response
   */
  async chat(
    messages: LLMMessage[],
    options: LLMClientOptions = { model: this.defaultModel }
  ): Promise<string> {
    if (this.provider === 'none') {
      throw new Error('No synthesis provider available. Set ANTHROPIC_API_KEY or ensure claude CLI is installed.');
    }

    if (this.provider === 'cli') {
      return this.chatViaCli(messages, options);
    }

    return this.chatViaSdk(messages, options);
  }

  /**
   * Chat via SDK
   */
  private async chatViaSdk(
    messages: LLMMessage[],
    options: LLMClientOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Is ANTHROPIC_API_KEY set?');
    }

    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 4096;

    if (this.debug) {
      console.error(`[LLMClient] SDK: Calling ${model} with ${messages.length} messages`);
    }

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    if (this.debug) {
      console.error(`[LLMClient] SDK: Received ${textContent.text.length} chars`);
    }

    return textContent.text;
  }

  /**
   * Chat via Claude CLI (for account-based auth)
   */
  private async chatViaCli(
    messages: LLMMessage[],
    options: LLMClientOptions
  ): Promise<string> {
    // Combine messages into a single prompt for --print mode
    const prompt = messages
      .map(m => (m.role === 'user' ? m.content : `Assistant: ${m.content}`))
      .join('\n\n');

    if (this.debug) {
      console.error(`[LLMClient] CLI: Running claude --print with ${prompt.length} chars`);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn('claude', ['--print', prompt], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (this.debug) {
            console.error(`[LLMClient] CLI: Received ${stdout.length} chars`);
          }
          resolve(stdout.trim());
        } else {
          reject(new Error(`claude CLI failed (exit ${code}): ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        proc.kill();
        reject(new Error('claude CLI timed out'));
      }, 300000);
    });
  }

  /**
   * Simple completion (single user message)
   */
  async complete(
    prompt: string,
    options: LLMClientOptions = { model: this.defaultModel }
  ): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Stream a response (SDK only, falls back to non-streaming for CLI)
   */
  async *stream(
    messages: LLMMessage[],
    options: LLMClientOptions = { model: this.defaultModel }
  ): AsyncGenerator<string> {
    if (this.provider === 'none') {
      throw new Error('No synthesis provider available');
    }

    // CLI mode doesn't support streaming, fall back to non-streaming
    if (this.provider === 'cli') {
      const result = await this.chatViaCli(messages, options);
      yield result;
      return;
    }

    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }

    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 4096;

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Set the default model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }
}

/**
 * Create a client with config (async to resolve provider)
 */
export async function createClientAsync(options: {
  model?: string;
  debug?: boolean;
  synthesisProvider?: SynthesisProvider;
} = {}): Promise<LLMClient> {
  const provider = await resolveProvider(
    options.synthesisProvider || 'auto',
    options.debug
  );

  return new LLMClient({
    defaultModel: options.model,
    debug: options.debug,
    provider,
  });
}

/**
 * Create a client synchronously (uses 'none' provider if auto/cli requested without API key)
 * For backwards compatibility - prefer createClientAsync
 */
export function createClient(options: {
  model?: string;
  debug?: boolean;
} = {}): LLMClient {
  // Synchronous version only supports SDK if API key available
  const provider = hasApiKey() ? 'sdk' : 'none';

  return new LLMClient({
    defaultModel: options.model,
    debug: options.debug,
    provider,
  });
}
