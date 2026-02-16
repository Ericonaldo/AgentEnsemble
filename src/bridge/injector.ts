/**
 * Bridge content injector and cleaner
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AEConfig, BridgeFile } from '../types.js';
import { BRIDGE_MARKERS } from '../types.js';
import { scanConfigFiles, stripBridgeContent, extractBridgeContent } from './scanner.js';
import { generateBridgeContent, generateSmartBridgeContent, type BridgeContext } from './generator.js';
import { LLMClient } from '../models/client.js';

/**
 * Inject bridge content into config files
 */
export async function injectBridge(
  config: AEConfig,
  client?: LLMClient,
  cwd: string = process.cwd()
): Promise<string[]> {
  const files = await scanConfigFiles(config.bridge.targetFiles, cwd);
  const injected: string[] = [];

  // Find or create primary config file
  let targetFile = files.find(f => f.exists);

  if (!targetFile) {
    // Create CLAUDE.md if no config exists
    targetFile = {
      path: join(cwd, 'CLAUDE.md'),
      exists: false,
      hasBridge: false,
      content: '',
    };
  }

  // Skip if bridge already exists
  if (targetFile.hasBridge) {
    return [];
  }

  // Generate bridge content
  const context: BridgeContext = {
    existingContent: targetFile.content || '',
    projectPath: cwd,
    agents: Object.entries(config.agents)
      .filter(([_, c]) => c.enabled)
      .map(([name]) => name),
    costMode: config.general.costMode,
  };

  let bridgeContent: string;

  if (client) {
    bridgeContent = await generateSmartBridgeContent(client, context, config);
  } else {
    bridgeContent = generateBridgeContent(context);
  }

  // Build new content
  const existingContent = targetFile.content?.trim() || '';
  const newContent = existingContent
    ? `${existingContent}\n\n${BRIDGE_MARKERS.start}\n${bridgeContent}\n${BRIDGE_MARKERS.end}\n`
    : `${BRIDGE_MARKERS.start}\n${bridgeContent}\n${BRIDGE_MARKERS.end}\n`;

  // Write to file
  await writeFile(targetFile.path, newContent, 'utf-8');
  injected.push(targetFile.path);

  return injected;
}

/**
 * Clean bridge content from all config files
 */
export async function cleanupBridge(
  config: AEConfig,
  cwd: string = process.cwd()
): Promise<string[]> {
  const files = await scanConfigFiles(config.bridge.targetFiles, cwd);
  const cleaned: string[] = [];

  for (const file of files) {
    if (file.exists && file.hasBridge && file.content) {
      const newContent = stripBridgeContent(file.content);

      // Only write if content changed
      if (newContent !== file.content) {
        await writeFile(file.path, newContent, 'utf-8');
        cleaned.push(file.path);
      }
    }
  }

  return cleaned;
}

/**
 * Get current bridge status
 */
export async function getBridgeStatus(
  config: AEConfig,
  cwd: string = process.cwd()
): Promise<{
  active: boolean;
  files: BridgeFile[];
  content: string | null;
}> {
  const files = await scanConfigFiles(config.bridge.targetFiles, cwd);
  const activeFile = files.find(f => f.hasBridge);

  return {
    active: !!activeFile,
    files,
    content: activeFile?.content
      ? extractBridgeContent(activeFile.content)
      : null,
  };
}

/**
 * Update bridge content (re-inject with new content)
 */
export async function updateBridge(
  config: AEConfig,
  client?: LLMClient,
  cwd: string = process.cwd()
): Promise<string[]> {
  // First clean up existing bridge
  await cleanupBridge(config, cwd);

  // Then inject new bridge
  return injectBridge(config, client, cwd);
}
