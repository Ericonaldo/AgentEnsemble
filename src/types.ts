/**
 * Global type definitions for AgentEnsemble
 */

// Agent types supported by ae
export type AgentType = 'claude-code' | 'codex';

// Cost mode presets
export type CostMode = 'cheap' | 'balanced' | 'quality';

// Ensemble strategy
export type EnsembleStrategy = 'parallel' | 'sequential';

// UI theme
export type UITheme = 'default' | 'minimal' | 'verbose';

// Agent status
export type AgentStatus = 'idle' | 'running' | 'waiting' | 'error';

// Ensemble status
export type EnsembleStatus = 'idle' | 'running' | 'synthesizing' | 'complete' | 'error';

/**
 * Agent configuration
 */
export interface AgentConfig {
  command: string;
  printFlag?: string;
  quietFlag?: string;
  enabled: boolean;
}

/**
 * Model preset configuration
 */
export interface ModelPreset {
  primary: string;
  synthesis: string;
}

/**
 * Full configuration schema
 */
export interface AEConfig {
  general: {
    defaultAgent: AgentType;
    costMode: CostMode;
    debug: boolean;
  };
  agents: Record<AgentType, AgentConfig>;
  ensemble: {
    strategy: EnsembleStrategy;
    timeout: number;
    synthesisModel: string;
  };
  bridge: {
    targetFiles: string[];
    autoInject: boolean;
    autoCleanup: boolean;
  };
  ui: {
    statusBar: boolean;
    statusBarRefresh: number;
    theme: UITheme;
  };
  models: Record<CostMode, ModelPreset>;
}

/**
 * Raw TOML config (snake_case keys)
 */
export interface RawTOMLConfig {
  general?: {
    default_agent?: string;
    cost_mode?: string;
    debug?: boolean;
  };
  agents?: Record<string, {
    command?: string;
    print_flag?: string;
    quiet_flag?: string;
    enabled?: boolean;
  }>;
  ensemble?: {
    strategy?: string;
    timeout?: number;
    synthesis_model?: string;
  };
  bridge?: {
    target_files?: string[];
    auto_inject?: boolean;
    auto_cleanup?: boolean;
  };
  ui?: {
    status_bar?: boolean;
    status_bar_refresh?: number;
    theme?: string;
  };
  models?: Record<string, {
    primary?: string;
    synthesis?: string;
  }>;
}

/**
 * AE command parsed from user input
 */
export interface AECommand {
  name: string;
  args: string[];
  raw: string;
}

/**
 * Agent adapter interface
 */
export interface IAgentAdapter {
  readonly type: AgentType;
  readonly config: AgentConfig;

  // Execute a task and return the output
  execute(task: string): Promise<AgentResult>;

  // Check if agent is available
  isAvailable(): Promise<boolean>;
}

/**
 * Result from an agent execution
 */
export interface AgentResult {
  agent: AgentType;
  output: string;
  exitCode: number;
  duration: number;
  error?: string;
}

/**
 * Synthesized ensemble result
 */
export interface EnsembleResult {
  results: AgentResult[];
  synthesis: string;
  strategy: EnsembleStrategy;
  totalDuration: number;
}

/**
 * Bridge injection markers
 */
export const BRIDGE_MARKERS = {
  start: '<!-- ae:bridge:start -->',
  end: '<!-- ae:bridge:end -->',
} as const;

/**
 * PTY proxy state
 */
export interface ProxyState {
  agentType: AgentType;
  agentStatus: AgentStatus;
  ensembleStatus: EnsembleStatus;
  inputBuffer: string;
  isIntercepting: boolean;
}

/**
 * Status bar data
 */
export interface StatusBarData {
  agent: AgentType;
  status: AgentStatus;
  ensembleStatus: EnsembleStatus;
  costMode: CostMode;
  bridgeActive: boolean;
}

/**
 * Bridge file info
 */
export interface BridgeFile {
  path: string;
  exists: boolean;
  hasBridge: boolean;
  content?: string;
}

/**
 * LLM message format
 */
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * LLM client options
 */
export interface LLMClientOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Event emitter types for proxy
 */
export interface ProxyEvents {
  'data': (data: Buffer) => void;
  'exit': (code: number) => void;
  'command': (cmd: AECommand) => void;
  'error': (error: Error) => void;
}
