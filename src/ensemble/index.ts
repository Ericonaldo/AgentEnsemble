/**
 * Ensemble engine for AgentEnsemble
 * Orchestrates parallel/sequential agent execution and result synthesis
 */

import type {
  AEConfig,
  AgentType,
  AgentResult,
  EnsembleResult,
  EnsembleStrategy,
  IAgentAdapter,
} from '../types.js';
import { createAllAdapters } from '../adapters/index.js';
import { LLMClient } from '../models/client.js';
import { synthesize, streamSynthesize, compareResults } from './synthesizer.js';

export { synthesize, streamSynthesize, compareResults } from './synthesizer.js';

/**
 * Ensemble execution options
 */
export interface EnsembleOptions {
  task: string;
  agents?: AgentType[];
  strategy?: EnsembleStrategy;
  timeout?: number;
  synthesisStrategy?: 'merge' | 'best' | 'consensus';
}

/**
 * Ensemble engine
 */
export class EnsembleEngine {
  private config: AEConfig;
  private adapters: Map<AgentType, IAgentAdapter>;
  private client: LLMClient;

  constructor(config: AEConfig, client: LLMClient) {
    this.config = config;
    this.client = client;
    this.adapters = createAllAdapters(config);
  }

  /**
   * Execute ensemble task
   */
  async execute(options: EnsembleOptions): Promise<EnsembleResult> {
    const {
      task,
      agents = this.getEnabledAgents(),
      strategy = this.config.ensemble.strategy,
      timeout = this.config.ensemble.timeout * 1000,
      synthesisStrategy = 'merge',
    } = options;

    const startTime = Date.now();

    // Get adapters for requested agents
    const selectedAdapters = agents
      .map(a => this.adapters.get(a))
      .filter((a): a is IAgentAdapter => a !== undefined);

    if (selectedAdapters.length === 0) {
      throw new Error('No agents available for ensemble');
    }

    // Execute based on strategy
    let results: AgentResult[];

    if (strategy === 'parallel') {
      results = await this.executeParallel(selectedAdapters, task, timeout);
    } else {
      results = await this.executeSequential(selectedAdapters, task, timeout);
    }

    // Synthesize results (if provider available)
    let synthesis: string;
    if (this.client.isAvailable()) {
      synthesis = await synthesize(
        this.client,
        { task, results, strategy: synthesisStrategy },
        this.config
      );
    } else {
      // No synthesis available, format results directly
      synthesis = this.formatResultsWithoutSynthesis(results);
    }

    return {
      results,
      synthesis,
      strategy,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Execute agents in parallel
   */
  private async executeParallel(
    adapters: IAgentAdapter[],
    task: string,
    timeout: number
  ): Promise<AgentResult[]> {
    const promises = adapters.map(adapter =>
      this.executeWithTimeout(adapter, task, timeout)
    );

    return Promise.all(promises);
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequential(
    adapters: IAgentAdapter[],
    task: string,
    timeout: number
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    for (const adapter of adapters) {
      const result = await this.executeWithTimeout(adapter, task, timeout);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout(
    adapter: IAgentAdapter,
    task: string,
    timeout: number
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        adapter.execute(task),
        new Promise<AgentResult>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      return result;
    } catch (error) {
      return {
        agent: adapter.type,
        output: '',
        exitCode: 1,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get list of enabled agents
   */
  private getEnabledAgents(): AgentType[] {
    return Object.entries(this.config.agents)
      .filter(([_, c]) => c.enabled)
      .map(([name]) => name as AgentType);
  }

  /**
   * Format results without LLM synthesis (fallback when no provider available)
   */
  private formatResultsWithoutSynthesis(results: AgentResult[]): string {
    const comparison = compareResults(results);
    const lines: string[] = [
      '## Agent Results (No synthesis - API key or CLI not available)',
      '',
    ];

    for (const result of results) {
      const status = result.exitCode === 0 ? 'SUCCESS' : `FAILED (exit ${result.exitCode})`;
      lines.push(`### ${result.agent} [${status}] (${result.duration}ms)`);
      lines.push('');
      lines.push(result.output || result.error || '(no output)');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    lines.push('## Summary');
    lines.push(`- All succeeded: ${comparison.allSucceeded ? 'Yes' : 'No'}`);
    lines.push(`- Agreement level: ${comparison.agreementLevel}`);
    lines.push(`- Fastest agent: ${comparison.fastestAgent}`);

    return lines.join('\n');
  }

  /**
   * Stream ensemble execution with progress
   */
  async *executeWithProgress(options: EnsembleOptions): AsyncGenerator<{
    type: 'start' | 'agent_complete' | 'synthesizing' | 'complete';
    agent?: AgentType;
    result?: AgentResult;
    synthesis?: string;
    final?: EnsembleResult;
  }> {
    const {
      task,
      agents = this.getEnabledAgents(),
      strategy = this.config.ensemble.strategy,
      timeout = this.config.ensemble.timeout * 1000,
      synthesisStrategy = 'merge',
    } = options;

    const startTime = Date.now();

    yield { type: 'start' };

    const selectedAdapters = agents
      .map(a => this.adapters.get(a))
      .filter((a): a is IAgentAdapter => a !== undefined);

    const results: AgentResult[] = [];

    // Execute and yield progress
    if (strategy === 'parallel') {
      const promises = selectedAdapters.map(async adapter => {
        const result = await this.executeWithTimeout(adapter, task, timeout);
        return result;
      });

      for (const promise of promises) {
        const result = await promise;
        results.push(result);
        yield { type: 'agent_complete', agent: result.agent, result };
      }
    } else {
      for (const adapter of selectedAdapters) {
        const result = await this.executeWithTimeout(adapter, task, timeout);
        results.push(result);
        yield { type: 'agent_complete', agent: result.agent, result };
      }
    }

    yield { type: 'synthesizing' };

    // Stream synthesis (or format without synthesis if provider unavailable)
    let synthesis = '';
    if (this.client.isAvailable()) {
      for await (const chunk of streamSynthesize(
        this.client,
        { task, results, strategy: synthesisStrategy },
        this.config
      )) {
        synthesis += chunk;
      }
    } else {
      synthesis = this.formatResultsWithoutSynthesis(results);
    }

    const final: EnsembleResult = {
      results,
      synthesis,
      strategy,
      totalDuration: Date.now() - startTime,
    };

    yield { type: 'complete', synthesis, final };
  }
}

/**
 * Create an ensemble engine
 */
export function createEnsembleEngine(
  config: AEConfig,
  client: LLMClient
): EnsembleEngine {
  return new EnsembleEngine(config, client);
}
