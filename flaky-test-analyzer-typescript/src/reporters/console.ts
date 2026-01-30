/**
 * Console Reporter - Pretty terminal output
 */

import chalk from 'chalk';
import { AnalysisResult, TestAnalysis } from '../types';
import { getStatusHistoryVisual } from '../analyzer';

/**
 * Print analysis results to console
 */
export function printConsoleReport(result: AnalysisResult): void {
  const { summary, tests } = result;
  
  console.log('\n' + chalk.bold.blue('═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('                    FLAKY TEST ANALYSIS'));
  console.log(chalk.bold.blue('═══════════════════════════════════════════════════════════\n'));
  
  // Summary stats
  console.log(chalk.bold('Summary:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`  Total Tests:          ${chalk.white(summary.totalTests)}`);
  console.log(`  Test Runs Analyzed:   ${chalk.white(summary.totalRuns)}`);
  console.log(`  Flaky Tests:          ${summary.flakyTests > 0 ? chalk.red.bold(summary.flakyTests) : chalk.green(summary.flakyTests)}`);
  console.log(`  Stable Passing:       ${chalk.green(summary.stablePassingTests)}`);
  console.log(`  Stable Failing:       ${summary.stableFailingTests > 0 ? chalk.yellow(summary.stableFailingTests) : chalk.gray(summary.stableFailingTests)}`);
  console.log(`  Avg Flakiness Score:  ${getScoreColor(summary.avgFlakinessScore)}`);
  console.log();
  
  // Top flaky tests
  if (summary.topFlaky.length > 0) {
    console.log(chalk.bold.red('⚠ Flaky Tests Detected:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    for (const test of summary.topFlaky) {
      printTestSummary(test);
    }
  } else {
    console.log(chalk.green.bold('✓ No flaky tests detected!'));
  }
  
  // Legend
  console.log();
  console.log(chalk.gray('Legend: ✓ = passed, ✗ = failed, ! = error, ○ = skipped'));
  console.log(chalk.gray(`Analyzed at: ${summary.analyzedAt.toISOString()}`));
  console.log();
}

/**
 * Print a single test summary
 */
function printTestSummary(test: TestAnalysis): void {
  const scoreStr = getScoreColor(test.flakinessScore);
  const history = getStatusHistoryVisual(test.statusHistory);
  
  console.log();
  console.log(`  ${chalk.bold(test.testName)}`);
  if (test.className && test.className !== test.testName) {
    console.log(`  ${chalk.gray(test.className)}`);
  }
  console.log(`  Flakiness: ${scoreStr}  |  Runs: ${test.totalRuns}  |  Pass: ${chalk.green(test.passCount)}  Fail: ${chalk.red(test.failCount + test.errorCount)}`);
  console.log(`  History: ${colorizeHistory(history)}`);
  if (test.lastError) {
    const truncatedError = test.lastError.length > 80 
      ? test.lastError.substring(0, 77) + '...' 
      : test.lastError;
    console.log(`  ${chalk.red('Last Error:')} ${chalk.gray(truncatedError)}`);
  }
}

/**
 * Colorize status history
 */
function colorizeHistory(history: string): string {
  return history
    .replace(/✓/g, chalk.green('✓'))
    .replace(/✗/g, chalk.red('✗'))
    .replace(/!/g, chalk.yellow('!'))
    .replace(/○/g, chalk.gray('○'));
}

/**
 * Get colored score based on value
 */
function getScoreColor(score: number): string {
  if (score === 0) return chalk.green(`${score}%`);
  if (score < 20) return chalk.yellow(`${score}%`);
  if (score < 50) return chalk.hex('#FFA500')(`${score}%`); // Orange
  return chalk.red.bold(`${score}%`);
}
