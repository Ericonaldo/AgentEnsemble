/**
 * Configuration loader for AgentEnsemble
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import * as TOML from '@iarna/toml';
import type { AEConfig, RawTOMLConfig, SynthesisProvider } from '../types.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { validateConfig } from './schema.js';

// Config file search paths (in order of priority)
const CONFIG_PATHS = [
  'ae.toml',                                    // Current directory
  '.ae.toml',                                   // Hidden in current directory
  join(homedir(), '.config', 'ae', 'ae.toml'),  // XDG config
  join(homedir(), '.ae.toml'),                  // Home directory
];

/**
 * Find the first existing config file
 */
async function findConfigFile(cwd: string): Promise<string | null> {
  // Check current directory first
  const localPaths = [
    join(cwd, 'ae.toml'),
    join(cwd, '.ae.toml'),
  ];

  for (const path of localPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Check global paths
  const globalPaths = [
    join(homedir(), '.config', 'ae', 'ae.toml'),
    join(homedir(), '.ae.toml'),
  ];

  for (const path of globalPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Load configuration from file
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<AEConfig> {
  const configPath = await findConfigFile(cwd);

  if (!configPath) {
    // Return default config if no config file found
    return structuredClone(DEFAULT_CONFIG);
  }

  try {
    const content = await readFile(configPath, 'utf-8');
    const raw = TOML.parse(content) as RawTOMLConfig;
    const config = validateConfig(raw);

    if (config.general.debug) {
      console.error(`[ae] Loaded config from: ${configPath}`);
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[ae] Error loading config from ${configPath}: ${error.message}`);
    }
    // Return default config on error
    return structuredClone(DEFAULT_CONFIG);
  }
}

const VALID_SYNTHESIS_PROVIDERS: SynthesisProvider[] = ['auto', 'sdk', 'cli', 'none'];

/**
 * Get config with CLI overrides
 */
export function applyOverrides(
  config: AEConfig,
  overrides: Partial<{
    agent: string;
    costMode: string;
    debug: boolean;
    synthesisProvider: string;
  }>
): AEConfig {
  const result = structuredClone(config);

  if (overrides.agent) {
    if (overrides.agent === 'claude-code' || overrides.agent === 'codex' || overrides.agent === 'gemini') {
      result.general.defaultAgent = overrides.agent;
    }
  }

  if (overrides.costMode) {
    if (overrides.costMode === 'cheap' || overrides.costMode === 'balanced' || overrides.costMode === 'quality') {
      result.general.costMode = overrides.costMode;
    }
  }

  if (overrides.debug !== undefined) {
    result.general.debug = overrides.debug;
  }

  if (overrides.synthesisProvider) {
    if (VALID_SYNTHESIS_PROVIDERS.includes(overrides.synthesisProvider as SynthesisProvider)) {
      result.ensemble.synthesisProvider = overrides.synthesisProvider as SynthesisProvider;
    }
  }

  return result;
}

export { DEFAULT_CONFIG } from './defaults.js';
export { validateConfig, ConfigValidationError } from './schema.js';
