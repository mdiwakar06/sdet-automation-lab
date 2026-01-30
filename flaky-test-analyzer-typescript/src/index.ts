#!/usr/bin/env node

/**
 * Flaky Test Analyzer CLI
 * Analyze test results across multiple runs to identify flaky tests
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { parseFiles } from './parsers';
import { analyzeTests } from './analyzer';
import { printConsoleReport, formatJsonReport, writeJsonReport } from './reporters';
import { ReportFormat } from './types';

const program = new Command();

program
  .name('flaky')
  .description('Analyze test results to identify flaky tests')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze test result files for flaky tests')
  .argument('<patterns...>', 'File patterns to analyze (e.g., "results/*.xml" "run-*/report.json")')
  .option('-f, --format <format>', 'Report format: junit, jest, playwright, or auto-detect', undefined)
  .option('-t, --threshold <percent>', 'Flakiness threshold percentage', '10')
  .option('-m, --min-runs <count>', 'Minimum runs required to detect flakiness', '2')
  .option('-n, --top <count>', 'Number of top flaky tests to show', '10')
  .option('-o, --output <format>', 'Output format: console, json', 'console')
  .option('--output-file <path>', 'Write output to file (for json output)')
  .action(async (patterns: string[], options) => {
    try {
      console.log(chalk.gray(`Analyzing test results from: ${patterns.join(', ')}\n`));
      
      // Parse all test result files
      const results = await parseFiles(
        patterns,
        options.format as ReportFormat | undefined
      );
      
      if (results.length === 0) {
        console.log(chalk.yellow('No test results found. Check your file patterns.'));
        process.exit(1);
      }
      
      console.log(chalk.gray(`Found ${results.length} test results\n`));
      
      // Analyze for flakiness
      const analysis = analyzeTests(results, {
        threshold: parseInt(options.threshold, 10),
        minRuns: parseInt(options.minRuns, 10),
        topN: parseInt(options.top, 10),
      });
      
      // Output results
      if (options.output === 'json') {
        if (options.outputFile) {
          writeJsonReport(analysis, options.outputFile);
          console.log(chalk.green(`Report written to: ${options.outputFile}`));
        } else {
          console.log(formatJsonReport(analysis));
        }
      } else {
        printConsoleReport(analysis);
      }
      
      // Exit with error code if flaky tests found
      if (analysis.summary.flakyTests > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('formats')
  .description('List supported test report formats')
  .action(() => {
    console.log(chalk.bold('\nSupported Test Report Formats:\n'));
    
    console.log(chalk.cyan('  junit'));
    console.log(chalk.gray('    JUnit XML format (pytest, JUnit, TestNG, NUnit, etc.)'));
    console.log(chalk.gray('    Files: *.xml\n'));
    
    console.log(chalk.cyan('  jest'));
    console.log(chalk.gray('    Jest JSON reporter output (--json flag)'));
    console.log(chalk.gray('    Files: *.json with Jest structure\n'));
    
    console.log(chalk.cyan('  playwright'));
    console.log(chalk.gray('    Playwright JSON reporter (--reporter=json)'));
    console.log(chalk.gray('    Files: *.json with Playwright structure\n'));
    
    console.log(chalk.gray('Format is auto-detected by default. Use -f to force a specific format.'));
    console.log();
  });

// Show help if no command provided
if (process.argv.length < 3) {
  program.help();
}

program.parse();
