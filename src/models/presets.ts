/**
 * Model presets for different cost modes
 */

import type { CostMode, ModelPreset } from '../types.js';

/**
 * Default model presets
 */
export const MODEL_PRESETS: Record<CostMode, ModelPreset> = {
  cheap: {
    primary: 'claude-haiku-4-5-20251001',
    synthesis: 'claude-haiku-4-5-20251001',
  },
  balanced: {
    primary: 'claude-sonnet-4-5-20250929',
    synthesis: 'claude-sonnet-4-5-20250929',
  },
  quality: {
    primary: 'claude-opus-4-5-20251101',
    synthesis: 'claude-opus-4-5-20251101',
  },
};

/**
 * Model metadata
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1M: number;  // USD per 1M input tokens
  outputCostPer1M: number; // USD per 1M output tokens
}

/**
 * Available models and their specs
 */
export const MODELS: Record<string, ModelInfo> = {
  'claude-haiku-4-5-20251001': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
  },
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
  },
  'claude-opus-4-5-20251101': {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    contextWindow: 200000,
    maxOutputTokens: 32000,
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
  },
};

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODELS[modelId];
}

/**
 * Get preset for cost mode
 */
export function getPreset(costMode: CostMode): ModelPreset {
  return MODEL_PRESETS[costMode];
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const info = MODELS[modelId];
  if (!info) {
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * info.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * info.outputCostPer1M;

  return inputCost + outputCost;
}
