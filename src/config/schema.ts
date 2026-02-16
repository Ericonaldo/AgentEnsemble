/**
 * Configuration validation for AgentEnsemble
 */

import type { AEConfig, AgentType, CostMode, EnsembleStrategy, UITheme, SynthesisProvider, RawTOMLConfig } from '../types.js';
import { DEFAULT_CONFIG } from './defaults.js';

const VALID_AGENT_TYPES: AgentType[] = ['claude-code', 'codex'];
const VALID_COST_MODES: CostMode[] = ['cheap', 'balanced', 'quality'];
const VALID_STRATEGIES: EnsembleStrategy[] = ['parallel', 'sequential'];
const VALID_THEMES: UITheme[] = ['default', 'minimal', 'verbose'];
const VALID_SYNTHESIS_PROVIDERS: SynthesisProvider[] = ['auto', 'sdk', 'cli', 'none'];

/**
 * Validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public path: string) {
    super(`Config validation error at '${path}': ${message}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate agent type
 */
function validateAgentType(value: unknown, path: string): AgentType {
  if (typeof value !== 'string' || !VALID_AGENT_TYPES.includes(value as AgentType)) {
    throw new ConfigValidationError(
      `must be one of: ${VALID_AGENT_TYPES.join(', ')}`,
      path
    );
  }
  return value as AgentType;
}

/**
 * Validate cost mode
 */
function validateCostMode(value: unknown, path: string): CostMode {
  if (typeof value !== 'string' || !VALID_COST_MODES.includes(value as CostMode)) {
    throw new ConfigValidationError(
      `must be one of: ${VALID_COST_MODES.join(', ')}`,
      path
    );
  }
  return value as CostMode;
}

/**
 * Validate ensemble strategy
 */
function validateStrategy(value: unknown, path: string): EnsembleStrategy {
  if (typeof value !== 'string' || !VALID_STRATEGIES.includes(value as EnsembleStrategy)) {
    throw new ConfigValidationError(
      `must be one of: ${VALID_STRATEGIES.join(', ')}`,
      path
    );
  }
  return value as EnsembleStrategy;
}

/**
 * Validate UI theme
 */
function validateTheme(value: unknown, path: string): UITheme {
  if (typeof value !== 'string' || !VALID_THEMES.includes(value as UITheme)) {
    throw new ConfigValidationError(
      `must be one of: ${VALID_THEMES.join(', ')}`,
      path
    );
  }
  return value as UITheme;
}

/**
 * Validate synthesis provider
 */
function validateSynthesisProvider(value: unknown, path: string): SynthesisProvider {
  if (typeof value !== 'string' || !VALID_SYNTHESIS_PROVIDERS.includes(value as SynthesisProvider)) {
    throw new ConfigValidationError(
      `must be one of: ${VALID_SYNTHESIS_PROVIDERS.join(', ')}`,
      path
    );
  }
  return value as SynthesisProvider;
}

/**
 * Validate and transform raw TOML config to AEConfig
 */
export function validateConfig(raw: RawTOMLConfig): AEConfig {
  const config: AEConfig = structuredClone(DEFAULT_CONFIG);

  // General section
  if (raw.general) {
    if (raw.general.default_agent !== undefined) {
      config.general.defaultAgent = validateAgentType(
        raw.general.default_agent,
        'general.default_agent'
      );
    }
    if (raw.general.cost_mode !== undefined) {
      config.general.costMode = validateCostMode(
        raw.general.cost_mode,
        'general.cost_mode'
      );
    }
    if (raw.general.debug !== undefined) {
      if (typeof raw.general.debug !== 'boolean') {
        throw new ConfigValidationError('must be a boolean', 'general.debug');
      }
      config.general.debug = raw.general.debug;
    }
  }

  // Agents section
  if (raw.agents) {
    for (const [key, agentRaw] of Object.entries(raw.agents)) {
      const agentType = validateAgentType(key, `agents.${key}`);

      if (agentRaw.command !== undefined) {
        if (typeof agentRaw.command !== 'string') {
          throw new ConfigValidationError('must be a string', `agents.${key}.command`);
        }
        config.agents[agentType].command = agentRaw.command;
      }
      if (agentRaw.print_flag !== undefined) {
        config.agents[agentType].printFlag = agentRaw.print_flag;
      }
      if (agentRaw.quiet_flag !== undefined) {
        config.agents[agentType].quietFlag = agentRaw.quiet_flag;
      }
      if (agentRaw.enabled !== undefined) {
        if (typeof agentRaw.enabled !== 'boolean') {
          throw new ConfigValidationError('must be a boolean', `agents.${key}.enabled`);
        }
        config.agents[agentType].enabled = agentRaw.enabled;
      }
    }
  }

  // Ensemble section
  if (raw.ensemble) {
    if (raw.ensemble.strategy !== undefined) {
      config.ensemble.strategy = validateStrategy(
        raw.ensemble.strategy,
        'ensemble.strategy'
      );
    }
    if (raw.ensemble.timeout !== undefined) {
      if (typeof raw.ensemble.timeout !== 'number' || raw.ensemble.timeout <= 0) {
        throw new ConfigValidationError('must be a positive number', 'ensemble.timeout');
      }
      config.ensemble.timeout = raw.ensemble.timeout;
    }
    if (raw.ensemble.synthesis_model !== undefined) {
      if (typeof raw.ensemble.synthesis_model !== 'string') {
        throw new ConfigValidationError('must be a string', 'ensemble.synthesis_model');
      }
      config.ensemble.synthesisModel = raw.ensemble.synthesis_model;
    }
    if (raw.ensemble.synthesis_provider !== undefined) {
      config.ensemble.synthesisProvider = validateSynthesisProvider(
        raw.ensemble.synthesis_provider,
        'ensemble.synthesis_provider'
      );
    }
  }

  // Bridge section
  if (raw.bridge) {
    if (raw.bridge.target_files !== undefined) {
      if (!Array.isArray(raw.bridge.target_files)) {
        throw new ConfigValidationError('must be an array', 'bridge.target_files');
      }
      config.bridge.targetFiles = raw.bridge.target_files;
    }
    if (raw.bridge.auto_inject !== undefined) {
      if (typeof raw.bridge.auto_inject !== 'boolean') {
        throw new ConfigValidationError('must be a boolean', 'bridge.auto_inject');
      }
      config.bridge.autoInject = raw.bridge.auto_inject;
    }
    if (raw.bridge.auto_cleanup !== undefined) {
      if (typeof raw.bridge.auto_cleanup !== 'boolean') {
        throw new ConfigValidationError('must be a boolean', 'bridge.auto_cleanup');
      }
      config.bridge.autoCleanup = raw.bridge.auto_cleanup;
    }
  }

  // UI section
  if (raw.ui) {
    if (raw.ui.status_bar !== undefined) {
      if (typeof raw.ui.status_bar !== 'boolean') {
        throw new ConfigValidationError('must be a boolean', 'ui.status_bar');
      }
      config.ui.statusBar = raw.ui.status_bar;
    }
    if (raw.ui.status_bar_refresh !== undefined) {
      if (typeof raw.ui.status_bar_refresh !== 'number' || raw.ui.status_bar_refresh <= 0) {
        throw new ConfigValidationError('must be a positive number', 'ui.status_bar_refresh');
      }
      config.ui.statusBarRefresh = raw.ui.status_bar_refresh;
    }
    if (raw.ui.theme !== undefined) {
      config.ui.theme = validateTheme(raw.ui.theme, 'ui.theme');
    }
  }

  // Models section
  if (raw.models) {
    for (const [key, preset] of Object.entries(raw.models)) {
      const costMode = validateCostMode(key, `models.${key}`);

      if (preset.primary !== undefined) {
        if (typeof preset.primary !== 'string') {
          throw new ConfigValidationError('must be a string', `models.${key}.primary`);
        }
        config.models[costMode].primary = preset.primary;
      }
      if (preset.synthesis !== undefined) {
        if (typeof preset.synthesis !== 'string') {
          throw new ConfigValidationError('must be a string', `models.${key}.synthesis`);
        }
        config.models[costMode].synthesis = preset.synthesis;
      }
    }
  }

  return config;
}
