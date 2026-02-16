/**
 * Ensemble result renderer
 * Formats and displays ensemble execution results
 */

import chalk from 'chalk';
import type { EnsembleResult, AgentResult } from '../types.js';

/**
 * Render options
 */
export interface RenderOptions {
  showDetails?: boolean;
  showTimings?: boolean;
  maxOutputLength?: number;
}

/**
 * Render an ensemble result
 */
export function renderEnsembleResult(
  result: EnsembleResult,
  options: RenderOptions = {}
): string {
  const {
    showDetails = true,
    showTimings = true,
    maxOutputLength = 500,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bgMagenta.white.bold(' ENSEMBLE RESULT '));
  lines.push('');

  // Summary
  const successCount = result.results.filter(r => r.exitCode === 0).length;
  const totalCount = result.results.length;
  const successRate = Math.round((successCount / totalCount) * 100);

  lines.push(chalk.gray(`Strategy: ${result.strategy}`));
  lines.push(chalk.gray(`Agents: ${successCount}/${totalCount} succeeded (${successRate}%)`));

  if (showTimings) {
    lines.push(chalk.gray(`Total time: ${formatDuration(result.totalDuration)}`));
  }

  // Individual results (if showing details)
  if (showDetails) {
    lines.push('');
    lines.push(chalk.bold('Agent Outputs:'));

    for (const agentResult of result.results) {
      lines.push('');
      lines.push(renderAgentResult(agentResult, maxOutputLength));
    }
  }

  // Synthesis
  lines.push('');
  lines.push(chalk.bold.green('Synthesized Result:'));
  lines.push(chalk.gray('─'.repeat(40)));
  lines.push(result.synthesis);
  lines.push(chalk.gray('─'.repeat(40)));
  lines.push('');

  return lines.join('\n');
}

/**
 * Render a single agent result
 */
export function renderAgentResult(
  result: AgentResult,
  maxLength: number = 500
): string {
  const lines: string[] = [];

  // Header with status
  const statusIcon = result.exitCode === 0 ? chalk.green('✓') : chalk.red('✗');
  const header = `${statusIcon} ${chalk.cyan(result.agent)} (${formatDuration(result.duration)})`;
  lines.push(header);

  // Output or error
  if (result.error) {
    lines.push(chalk.red(`  Error: ${result.error}`));
  } else if (result.output) {
    const output = truncate(result.output, maxLength);
    const indented = output.split('\n').map(l => `  ${l}`).join('\n');
    lines.push(chalk.gray(indented));
  } else {
    lines.push(chalk.gray('  (no output)'));
  }

  return lines.join('\n');
}

/**
 * Render a progress indicator during ensemble execution
 */
export function renderProgress(
  event: {
    type: 'start' | 'agent_complete' | 'synthesizing' | 'complete';
    agent?: string;
    result?: AgentResult;
  }
): string {
  switch (event.type) {
    case 'start':
      return chalk.magenta('Starting ensemble execution...');

    case 'agent_complete':
      const icon = event.result?.exitCode === 0 ? chalk.green('✓') : chalk.red('✗');
      const duration = event.result ? formatDuration(event.result.duration) : '';
      return `${icon} ${chalk.cyan(event.agent)} completed ${chalk.gray(`(${duration})`)}`;

    case 'synthesizing':
      return chalk.yellow('Synthesizing results...');

    case 'complete':
      return chalk.green('Ensemble complete!');

    default:
      return '';
  }
}

/**
 * Render a compact summary
 */
export function renderCompactSummary(result: EnsembleResult): string {
  const agents = result.results.map(r => {
    const icon = r.exitCode === 0 ? '✓' : '✗';
    return `${r.agent}:${icon}`;
  }).join(' ');

  return `[${agents}] ${formatDuration(result.totalDuration)}`;
}

/**
 * Format duration in human readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}
