/**
 * LLM client wrapper for Anthropic SDK
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LLMMessage, LLMClientOptions } from '../types.js';

/**
 * LLM client for making API calls
 */
export class LLMClient {
  private client: Anthropic;
  private defaultModel: string;
  private debug: boolean;

  constructor(options: { defaultModel?: string; debug?: boolean } = {}) {
    this.client = new Anthropic();
    this.defaultModel = options.defaultModel || 'claude-sonnet-4-5-20250929';
    this.debug = options.debug || false;
  }

  /**
   * Send a message and get a response
   */
  async chat(
    messages: LLMMessage[],
    options: LLMClientOptions = { model: this.defaultModel }
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 4096;

    if (this.debug) {
      console.error(`[LLMClient] Calling ${model} with ${messages.length} messages`);
    }

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    if (this.debug) {
      console.error(`[LLMClient] Received ${textContent.text.length} chars`);
    }

    return textContent.text;
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
   * Stream a response
   */
  async *stream(
    messages: LLMMessage[],
    options: LLMClientOptions = { model: this.defaultModel }
  ): AsyncGenerator<string> {
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
 * Create a client with config
 */
export function createClient(options: {
  model?: string;
  debug?: boolean;
} = {}): LLMClient {
  return new LLMClient({
    defaultModel: options.model,
    debug: options.debug,
  });
}
