/**
 * Bridge module for AgentEnsemble
 * Handles configuration bridging between ae and child agents
 */

export {
  scanConfigFiles,
  findPrimaryConfig,
  hasBridgeContent,
  extractBridgeContent,
  stripBridgeContent,
} from './scanner.js';

export {
  generateBridgeContent,
  generateSmartBridgeContent,
  type BridgeContext,
} from './generator.js';

export {
  injectBridge,
  cleanupBridge,
  getBridgeStatus,
  updateBridge,
} from './injector.js';
