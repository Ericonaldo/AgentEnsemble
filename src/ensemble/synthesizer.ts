/**
 * Result synthesizer for ensemble outputs
 * Uses LLM to combine outputs from multiple agents
 */

import type { AgentResult, AEConfig } from '../types.js';
import { LLMClient } from '../models/client.js';

/**
 * Synthesis options
 */
export interface SynthesisOptions {
  task: string;
  results: AgentResult[];
  strategy?: 'merge' | 'best' | 'consensus';
}

/**
 * Synthesize multiple agent results into one coherent output
 */
export async function synthesize(
  client: LLMClient,
  options: SynthesisOptions,
  config: AEConfig
): Promise<string> {
  const { task, results, strategy = 'merge' } = options;

  // Build prompt based on strategy
  const prompt = buildSynthesisPrompt(task, results, strategy);

  const response = await client.complete(prompt, {
    model: config.models[config.general.costMode].synthesis,
    maxTokens: 8192,
  });

  return response;
}

/**
 * Build the synthesis prompt
 */
function buildSynthesisPrompt(
  task: string,
  results: AgentResult[],
  strategy: 'merge' | 'best' | 'consensus'
): string {
  const resultSections = results.map((r, i) => {
    const statusText = r.exitCode === 0 ? 'SUCCESS' : `FAILED (exit code ${r.exitCode})`;
    return `
### Agent ${i + 1}: ${r.agent} [${statusText}] (${r.duration}ms)

${r.output || r.error || '(no output)'}
`;
  }).join('\n---\n');

  const strategyInstructions = {
    merge: `Merge the outputs into a single coherent response. Combine the best elements from each, resolve any conflicts, and present a unified solution.`,
    best: `Select the best response based on correctness, completeness, and clarity. Explain why you chose it briefly, then present that response.`,
    consensus: `Identify points of agreement between the agents. Present only information that both agents agree on, noting any significant disagreements.`,
  };

  return `You are synthesizing outputs from multiple AI agents that worked on the same task.

## Original Task
${task}

## Agent Outputs
${resultSections}

## Instructions
${strategyInstructions[strategy]}

Provide your synthesized response below. Be concise and actionable. If there were errors from any agent, incorporate the successful parts while noting what failed.`;
}

/**
 * Stream the synthesis
 */
export async function* streamSynthesize(
  client: LLMClient,
  options: SynthesisOptions,
  config: AEConfig
): AsyncGenerator<string> {
  const { task, results, strategy = 'merge' } = options;
  const prompt = buildSynthesisPrompt(task, results, strategy);

  const messages = [{ role: 'user' as const, content: prompt }];

  for await (const chunk of client.stream(messages, {
    model: config.models[config.general.costMode].synthesis,
    maxTokens: 8192,
  })) {
    yield chunk;
  }
}

/**
 * Quick comparison without full synthesis
 */
export function compareResults(results: AgentResult[]): {
  allSucceeded: boolean;
  allFailed: boolean;
  agreementLevel: 'high' | 'medium' | 'low';
  fastestAgent: string;
  outputs: string[];
} {
  const successfulResults = results.filter(r => r.exitCode === 0);
  const allSucceeded = successfulResults.length === results.length;
  const allFailed = successfulResults.length === 0;

  // Simple similarity check (character overlap)
  let agreementLevel: 'high' | 'medium' | 'low' = 'low';
  if (results.length >= 2) {
    const outputs = results.map(r => r.output.toLowerCase().trim());
    const similarity = calculateSimilarity(outputs[0], outputs[1]);
    if (similarity > 0.8) {
      agreementLevel = 'high';
    } else if (similarity > 0.5) {
      agreementLevel = 'medium';
    }
  }

  const fastestAgent = results.reduce((fastest, r) =>
    r.duration < (results.find(x => x.agent === fastest)?.duration || Infinity)
      ? r.agent
      : fastest,
    results[0]?.agent || ''
  );

  return {
    allSucceeded,
    allFailed,
    agreementLevel,
    fastestAgent,
    outputs: results.map(r => r.output),
  };
}

/**
 * Simple similarity calculation (Jaccard-like)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));

  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}
