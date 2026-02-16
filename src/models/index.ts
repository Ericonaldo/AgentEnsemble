/**
 * Model management for AgentEnsemble
 */

import type { AEConfig, CostMode } from '../types.js';
import { LLMClient, createClient } from './client.js';
import { MODEL_PRESETS, MODELS, getModelInfo, getPreset, estimateCost } from './presets.js';

/**
 * Model manager that handles model selection based on config
 */
export class ModelManager {
  private config: AEConfig;
  private client: LLMClient;

  constructor(config: AEConfig) {
    this.config = config;
    this.client = createClient({
      model: this.getSynthesisModel(),
      debug: config.general.debug,
    });
  }

  /**
   * Get the synthesis model for current cost mode
   */
  getSynthesisModel(): string {
    return this.config.models[this.config.general.costMode].synthesis;
  }

  /**
   * Get the primary model for current cost mode
   */
  getPrimaryModel(): string {
    return this.config.models[this.config.general.costMode].primary;
  }

  /**
   * Get the LLM client
   */
  getClient(): LLMClient {
    return this.client;
  }

  /**
   * Get current cost mode
   */
  getCostMode(): CostMode {
    return this.config.general.costMode;
  }

  /**
   * Update cost mode
   */
  setCostMode(mode: CostMode): void {
    this.config.general.costMode = mode;
    this.client.setDefaultModel(this.getSynthesisModel());
  }

  /**
   * Get model info for current synthesis model
   */
  getCurrentModelInfo() {
    return getModelInfo(this.getSynthesisModel());
  }

  /**
   * Estimate cost for synthesis
   */
  estimateSynthesisCost(inputTokens: number, outputTokens: number): number {
    return estimateCost(this.getSynthesisModel(), inputTokens, outputTokens);
  }
}

export { LLMClient, createClient, createClientAsync, hasApiKey, hasClaudeCli, resolveProvider } from './client.js';
export { MODEL_PRESETS, MODELS, getModelInfo, getPreset, estimateCost } from './presets.js';
