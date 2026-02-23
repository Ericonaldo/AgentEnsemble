/**
 * Agent adapters for AgentEnsemble
 */

import type { AgentType, AgentConfig, IAgentAdapter, AEConfig } from '../types.js';
import { ClaudeCodeAdapter, createClaudeCodeAdapter } from './claude-code.js';
import { CodexAdapter, createCodexAdapter } from './codex.js';
import { GeminiAdapter, createGeminiAdapter } from './gemini.js';

export { BaseAdapter } from './base.js';
export { ClaudeCodeAdapter, createClaudeCodeAdapter } from './claude-code.js';
export { CodexAdapter, createCodexAdapter } from './codex.js';
export { GeminiAdapter, createGeminiAdapter } from './gemini.js';

/**
 * Create an adapter for the specified agent type
 */
export function createAdapter(
  type: AgentType,
  config: AgentConfig,
  debug: boolean = false
): IAgentAdapter {
  switch (type) {
    case 'claude-code':
      return new ClaudeCodeAdapter(config, debug);
    case 'codex':
      return new CodexAdapter(config, debug);
    case 'gemini':
      return new GeminiAdapter(config, debug);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

/**
 * Create adapters for all enabled agents
 */
export function createAllAdapters(config: AEConfig): Map<AgentType, IAgentAdapter> {
  const adapters = new Map<AgentType, IAgentAdapter>();
  const debug = config.general.debug;

  for (const [type, agentConfig] of Object.entries(config.agents)) {
    if (agentConfig.enabled) {
      adapters.set(
        type as AgentType,
        createAdapter(type as AgentType, agentConfig, debug)
      );
    }
  }

  return adapters;
}

/**
 * Get available agents (installed and enabled)
 */
export async function getAvailableAgents(
  config: AEConfig
): Promise<AgentType[]> {
  const adapters = createAllAdapters(config);
  const available: AgentType[] = [];

  for (const [type, adapter] of adapters) {
    if (await adapter.isAvailable()) {
      available.push(type);
    }
  }

  return available;
}
