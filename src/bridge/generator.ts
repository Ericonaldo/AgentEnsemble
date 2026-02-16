/**
 * Bridge content generator using LLM
 */

import type { AEConfig } from '../types.js';
import { LLMClient } from '../models/client.js';

/**
 * Bridge content context
 */
export interface BridgeContext {
  existingContent: string;
  projectPath: string;
  agents: string[];
  costMode: string;
}

/**
 * Default bridge content template
 */
const DEFAULT_BRIDGE_TEMPLATE = `
## AgentEnsemble Bridge

This project uses AgentEnsemble (ae) for AI agent orchestration.

### Available Commands

- \`/ae:ensemble <task>\` - Run task with multiple agents and synthesize results
- \`/ae:status\` - Show current ae status
- \`/ae:bridge\` - Show bridge configuration
- \`/ae:config\` - Show current configuration

### Configuration

- **Cost Mode**: {{costMode}}
- **Available Agents**: {{agents}}

### Guidelines

1. When making changes, consider that multiple agents may be reviewing the code
2. Keep code well-documented for AI comprehension
3. Follow consistent patterns for better ensemble consensus
`;

/**
 * Generate bridge content
 */
export function generateBridgeContent(context: BridgeContext): string {
  let content = DEFAULT_BRIDGE_TEMPLATE;

  content = content.replace('{{costMode}}', context.costMode);
  content = content.replace('{{agents}}', context.agents.join(', '));

  return content.trim();
}

/**
 * Generate bridge content using LLM for smarter adaptation
 */
export async function generateSmartBridgeContent(
  client: LLMClient,
  context: BridgeContext,
  config: AEConfig
): Promise<string> {
  const prompt = `You are helping configure an AI agent ensemble tool called AgentEnsemble (ae).

Given the following existing project configuration:

---
${context.existingContent || 'No existing configuration found.'}
---

Project path: ${context.projectPath}
Available agents: ${context.agents.join(', ')}
Cost mode: ${context.costMode}

Generate a brief bridge section (in markdown) that:
1. Documents the ae commands available (/ae:ensemble, /ae:status, /ae:bridge, /ae:config)
2. Notes the current configuration
3. Provides 2-3 guidelines for working with ensemble AI agents
4. Is concise (under 300 words)

Do not include any markdown code fences in your response. Just output the content directly.`;

  try {
    const response = await client.complete(prompt, {
      model: config.models[config.general.costMode].synthesis,
      maxTokens: 1024,
    });

    return response.trim();
  } catch (error) {
    // Fall back to template if LLM fails
    console.error('[ae] Failed to generate smart bridge content, using template');
    return generateBridgeContent(context);
  }
}
