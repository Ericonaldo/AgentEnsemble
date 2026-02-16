#!/usr/bin/env node

/**
 * AgentEnsemble (ae) - CLI Entry Point
 * Transparent PTY proxy layer for AI agent ensemble capabilities
 */

import { program } from 'commander';
import chalk from 'chalk';
import type { AEConfig, AECommand, AgentType } from './types.js';
import { loadConfig, applyOverrides } from './config/index.js';
import { PTYProxy } from './proxy/index.js';
import { createClientAsync, LLMClient } from './models/index.js';
import { EnsembleEngine } from './ensemble/index.js';
import { injectBridge, cleanupBridge, getBridgeStatus } from './bridge/index.js';
import { createStatusBar, renderEnsembleResult, renderProgress } from './ui/index.js';

// Version from package.json
const VERSION = '0.1.0';

/**
 * Main application class
 */
class AgentEnsemble {
  private config!: AEConfig;
  private proxy!: PTYProxy;
  private ensemble!: EnsembleEngine;
  private statusBar!: ReturnType<typeof createStatusBar>;
  private isRunning: boolean = false;

  async init(options: {
    agent?: string;
    costMode?: string;
    debug?: boolean;
  }): Promise<void> {
    // Load configuration
    this.config = await loadConfig();
    this.config = applyOverrides(this.config, options);

    if (this.config.general.debug) {
      console.error(chalk.gray('[ae] Debug mode enabled'));
    }

    // Initialize components
    const client = await createClientAsync({
      model: this.config.models[this.config.general.costMode].synthesis,
      debug: this.config.general.debug,
      synthesisProvider: this.config.ensemble.synthesisProvider,
    });

    if (this.config.general.debug) {
      console.error(chalk.gray(`[ae] Synthesis provider: ${client.getProvider()}`));
    }

    // Warn if no synthesis provider is available
    if (!client.isAvailable()) {
      console.log(chalk.yellow('[ae] Note: No synthesis provider available.'));
      console.log(chalk.yellow('     Ensemble results will be shown without AI synthesis.'));
      console.log(chalk.yellow('     To enable synthesis, either:'));
      console.log(chalk.yellow('     - Set ANTHROPIC_API_KEY environment variable, or'));
      console.log(chalk.yellow('     - Ensure Claude Code CLI is installed (used as fallback)'));
    }

    this.proxy = new PTYProxy(this.config);
    this.ensemble = new EnsembleEngine(this.config, client);
    this.statusBar = createStatusBar({
      enabled: this.config.ui.statusBar,
      refreshRate: this.config.ui.statusBarRefresh,
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle PTY data (forward to stdout)
    this.proxy.on('data', (data: Buffer) => {
      process.stdout.write(data);
    });

    // Handle PTY exit
    this.proxy.on('exit', async (code: number) => {
      await this.shutdown();
      process.exit(code);
    });

    // Handle ae commands
    this.proxy.on('command', async (cmd: AECommand) => {
      await this.handleCommand(cmd);
    });

    // Handle state changes
    this.proxy.on('stateChange', (state) => {
      this.statusBar.update({
        agent: state.agentType,
        status: state.agentStatus,
        ensembleStatus: state.ensembleStatus,
      });
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log(chalk.blue('Starting AgentEnsemble...'));

    // Inject bridge content if configured
    if (this.config.bridge.autoInject) {
      const bridgeClient = await createClientAsync({
        model: this.config.models[this.config.general.costMode].synthesis,
        debug: this.config.general.debug,
        synthesisProvider: this.config.ensemble.synthesisProvider,
      });
      const injected = await injectBridge(this.config, bridgeClient);
      if (injected.length > 0 && this.config.general.debug) {
        console.error(chalk.gray(`[ae] Bridge injected into: ${injected.join(', ')}`));
      }
    }

    // Start the PTY proxy first (may fail if agent not installed)
    await this.proxy.start();
    this.isRunning = true;

    // Start status bar only after PTY is running
    this.statusBar.update({
      agent: this.config.general.defaultAgent,
      status: 'idle',
      costMode: this.config.general.costMode,
      bridgeActive: true,
    });
    this.statusBar.startRefresh();

    // Set up stdin handling
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data: Buffer) => {
      this.proxy.write(data);
    });

    // Handle resize
    process.stdout.on('resize', () => {
      this.proxy.resize(
        process.stdout.columns || 80,
        process.stdout.rows || 24
      );
    });

    // Handle process signals
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    console.log(chalk.blue('\nShutting down AgentEnsemble...'));

    // Stop status bar
    this.statusBar.stopRefresh();
    this.statusBar.clear();

    // Clean up bridge content if configured
    if (this.config.bridge.autoCleanup) {
      const cleaned = await cleanupBridge(this.config);
      if (cleaned.length > 0 && this.config.general.debug) {
        console.error(chalk.gray(`[ae] Bridge cleaned from: ${cleaned.join(', ')}`));
      }
    }

    // Stop PTY
    this.proxy.stop();

    // Restore stdin
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  private async handleCommand(cmd: AECommand): Promise<void> {
    console.log(''); // New line after command input

    switch (cmd.name) {
      case 'ensemble':
        await this.handleEnsemble(cmd.args);
        break;

      case 'status':
        await this.handleStatus();
        break;

      case 'bridge':
        await this.handleBridge();
        break;

      case 'config':
        this.handleConfig();
        break;

      case 'help':
        this.handleHelp();
        break;

      default:
        console.log(chalk.red(`Unknown command: /ae:${cmd.name}`));
        this.handleHelp();
    }
  }

  private async handleEnsemble(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log(chalk.red('Usage: /ae:ensemble <task>'));
      return;
    }

    const task = args.join(' ');

    console.log(chalk.magenta(`Running ensemble for: ${task}`));
    console.log('');

    this.statusBar.update({ ensembleStatus: 'running' });

    try {
      // Execute with progress
      for await (const event of this.ensemble.executeWithProgress({ task })) {
        console.log(renderProgress(event));

        if (event.type === 'synthesizing') {
          this.statusBar.update({ ensembleStatus: 'synthesizing' });
        }

        if (event.type === 'complete' && event.final) {
          this.statusBar.update({ ensembleStatus: 'complete' });
          console.log(renderEnsembleResult(event.final));
        }
      }
    } catch (error) {
      this.statusBar.update({ ensembleStatus: 'error' });
      console.log(chalk.red(`Ensemble error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    // Reset ensemble status after a delay
    setTimeout(() => {
      this.statusBar.update({ ensembleStatus: 'idle' });
    }, 3000);
  }

  private async handleStatus(): Promise<void> {
    const state = this.proxy.getState();
    const bridgeStatus = await getBridgeStatus(this.config);

    console.log(chalk.bold('AgentEnsemble Status'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Agent: ${chalk.cyan(state.agentType)}`);
    console.log(`Status: ${state.agentStatus}`);
    console.log(`Cost Mode: ${this.config.general.costMode}`);
    console.log(`Bridge Active: ${bridgeStatus.active ? chalk.green('Yes') : chalk.gray('No')}`);
    console.log(`Ensemble Strategy: ${this.config.ensemble.strategy}`);
    console.log(chalk.gray('─'.repeat(30)));
  }

  private async handleBridge(): Promise<void> {
    const status = await getBridgeStatus(this.config);

    console.log(chalk.bold('Bridge Status'));
    console.log(chalk.gray('─'.repeat(30)));

    if (status.active) {
      console.log(chalk.green('Bridge is active'));
      console.log('');
      console.log('Files:');
      for (const file of status.files) {
        const icon = file.hasBridge ? chalk.green('✓') : chalk.gray('○');
        const exists = file.exists ? '' : chalk.gray(' (not found)');
        console.log(`  ${icon} ${file.path}${exists}`);
      }

      if (status.content) {
        console.log('');
        console.log('Content:');
        console.log(chalk.gray(status.content));
      }
    } else {
      console.log(chalk.yellow('Bridge is not active'));
    }

    console.log(chalk.gray('─'.repeat(30)));
  }

  private handleConfig(): void {
    console.log(chalk.bold('Current Configuration'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Default Agent: ${this.config.general.defaultAgent}`);
    console.log(`Cost Mode: ${this.config.general.costMode}`);
    console.log(`Debug: ${this.config.general.debug}`);
    console.log('');
    console.log('Agents:');
    for (const [name, agent] of Object.entries(this.config.agents)) {
      const status = agent.enabled ? chalk.green('enabled') : chalk.gray('disabled');
      console.log(`  ${name}: ${status}`);
    }
    console.log('');
    console.log('Ensemble:');
    console.log(`  Strategy: ${this.config.ensemble.strategy}`);
    console.log(`  Timeout: ${this.config.ensemble.timeout}s`);
    console.log(`  Synthesis Provider: ${this.config.ensemble.synthesisProvider}`);
    console.log('');
    console.log('Models:');
    const preset = this.config.models[this.config.general.costMode];
    console.log(`  Primary: ${preset.primary}`);
    console.log(`  Synthesis: ${preset.synthesis}`);
    console.log(chalk.gray('─'.repeat(30)));
  }

  private handleHelp(): void {
    console.log(chalk.bold('AgentEnsemble Commands'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`${chalk.cyan('/ae:ensemble <task>')}  Run task with multiple agents`);
    console.log(`${chalk.cyan('/ae:status')}           Show current status`);
    console.log(`${chalk.cyan('/ae:bridge')}           Show bridge configuration`);
    console.log(`${chalk.cyan('/ae:config')}           Show current configuration`);
    console.log(`${chalk.cyan('/ae:help')}             Show this help`);
    console.log(chalk.gray('─'.repeat(30)));
  }
}

// CLI setup
program
  .name('ae')
  .description('AgentEnsemble - AI agent orchestration layer')
  .version(VERSION)
  .option('-a, --agent <type>', 'default agent (claude-code or codex)')
  .option('-c, --cost-mode <mode>', 'cost mode (cheap, balanced, or quality)')
  .option('-s, --synthesis-provider <provider>', 'synthesis provider (auto, sdk, cli, or none)')
  .option('-d, --debug', 'enable debug logging')
  .action(async (options) => {
    try {
      const ae = new AgentEnsemble();
      await ae.init(options);
      await ae.start();
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      } else {
        console.error(chalk.red('An unexpected error occurred'));
      }
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse();
