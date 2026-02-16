/**
 * Configuration file scanner for bridge injection
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BridgeFile } from '../types.js';
import { BRIDGE_MARKERS } from '../types.js';

/**
 * Scan for target configuration files
 */
export async function scanConfigFiles(
  targetFiles: string[],
  cwd: string = process.cwd()
): Promise<BridgeFile[]> {
  const results: BridgeFile[] = [];

  for (const filename of targetFiles) {
    const path = join(cwd, filename);
    const exists = existsSync(path);

    const file: BridgeFile = {
      path,
      exists,
      hasBridge: false,
    };

    if (exists) {
      try {
        const content = await readFile(path, 'utf-8');
        file.content = content;
        file.hasBridge = content.includes(BRIDGE_MARKERS.start);
      } catch {
        // File exists but couldn't be read
        file.exists = false;
      }
    }

    results.push(file);
  }

  return results;
}

/**
 * Find primary config file (first existing one)
 */
export async function findPrimaryConfig(
  targetFiles: string[],
  cwd: string = process.cwd()
): Promise<BridgeFile | null> {
  const files = await scanConfigFiles(targetFiles, cwd);
  return files.find(f => f.exists) || null;
}

/**
 * Check if any config files have bridge content
 */
export async function hasBridgeContent(
  targetFiles: string[],
  cwd: string = process.cwd()
): Promise<boolean> {
  const files = await scanConfigFiles(targetFiles, cwd);
  return files.some(f => f.hasBridge);
}

/**
 * Extract existing bridge content from a file
 */
export function extractBridgeContent(content: string): string | null {
  const startIdx = content.indexOf(BRIDGE_MARKERS.start);
  const endIdx = content.indexOf(BRIDGE_MARKERS.end);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const bridgeContent = content.slice(
    startIdx + BRIDGE_MARKERS.start.length,
    endIdx
  ).trim();

  return bridgeContent;
}

/**
 * Get content without bridge section
 */
export function stripBridgeContent(content: string): string {
  const startIdx = content.indexOf(BRIDGE_MARKERS.start);
  const endIdx = content.indexOf(BRIDGE_MARKERS.end);

  if (startIdx === -1 || endIdx === -1) {
    return content;
  }

  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + BRIDGE_MARKERS.end.length);

  // Clean up extra newlines
  return (before.trimEnd() + after.trimStart()).trim() + '\n';
}
