/**
 * Default configuration values for AgentEnsemble
 */

import type { AEConfig } from '../types.js';

export const DEFAULT_CONFIG: AEConfig = {
  general: {
    defaultAgent: 'claude-code',
    costMode: 'balanced',
    debug: false,
  },
  agents: {
    'claude-code': {
      command: 'claude',
      printFlag: '--print',
      enabled: true,
    },
    'codex': {
      command: 'codex',
      quietFlag: '--quiet',
      enabled: true,
    },
    'gemini': {
      command: 'gemini',
      promptFlag: '-p',
      enabled: true,
    },
  },
  ensemble: {
    strategy: 'parallel',
    timeout: 300,
    synthesisModel: 'claude-sonnet-4-5-20250929',
    synthesisProvider: 'auto',
  },
  bridge: {
    targetFiles: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'],
    autoInject: true,
    autoCleanup: true,
  },
  ui: {
    statusBar: true,
    statusBarRefresh: 1000,
    theme: 'default',
  },
  models: {
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
  },
};

/**
 * Get the synthesis model based on cost mode
 */
export function getSynthesisModel(config: AEConfig): string {
  return config.models[config.general.costMode].synthesis;
}

/**
 * Get the primary model based on cost mode
 */
export function getPrimaryModel(config: AEConfig): string {
  return config.models[config.general.costMode].primary;
}
