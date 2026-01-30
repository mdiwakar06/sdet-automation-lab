/**
 * Core Flaky Test Analyzer
 * Aggregates test results and calculates flakiness scores
 */

import { TestResult, TestAnalysis, AnalysisSummary, AnalysisResult, TestStatus } from './types';

export interface AnalyzerConfig {
  /** Flakiness threshold percentage (tests above this are marked flaky) */
  threshold: number;
  /** Minimum runs required to calculate flakiness */
  minRuns: number;
  /** Number of top flaky tests to include in summary */
  topN: number;
}

const DEFAULT_CONFIG: AnalyzerConfig = {
  threshold: 10, // 10% flakiness threshold
  minRuns: 2,    // Need at least 2 runs to detect flakiness
  topN: 10,      // Show top 10 flaky tests
};

/**
 * Calculate flakiness score for a test
 * 
 * Flakiness is calculated as the ratio of status changes to total runs.
 * A test that always passes or always fails has 0% flakiness.
 * A test that alternates pass/fail every run has 100% flakiness.
 */
function calculateFlakinessScore(statusHistory: TestStatus[]): number {
  if (statusHistory.length < 2) return 0;
  
  // Filter out skipped tests for flakiness calculation
  const relevantStatuses = statusHistory.filter(s => s !== 'skipped');
  if (relevantStatuses.length < 2) return 0;
  
  // Count status transitions
  let transitions = 0;
  for (let i = 1; i < relevantStatuses.length; i++) {
    const prev = relevantStatuses[i - 1];
    const curr = relevantStatuses[i];
    // Treat 'error' as 'failed' for transition counting
    const prevNorm = prev === 'error' ? 'failed' : prev;
    const currNorm = curr === 'error' ? 'failed' : curr;
    if (prevNorm !== currNorm) {
      transitions++;
    }
  }
  
  // Flakiness = transitions / (runs - 1) * 100
  const maxTransitions = relevantStatuses.length - 1;
  return Math.round((transitions / maxTransitions) * 100);
}

/**
 * Analyze test results and calculate flakiness
 */
export function analyzeTests(
  results: TestResult[],
  config: Partial<AnalyzerConfig> = {}
): AnalysisResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  // Group results by testId
  const testMap = new Map<string, TestResult[]>();
  for (const result of results) {
    const existing = testMap.get(result.testId) || [];
    existing.push(result);
    testMap.set(result.testId, existing);
  }
  
  // Analyze each test
  const analyses: TestAnalysis[] = [];
  
  for (const [testId, runs] of testMap) {
    // Sort runs by timestamp or runId
    const sortedRuns = [...runs].sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      return a.runId.localeCompare(b.runId);
    });
    
    const statusHistory = sortedRuns.map(r => r.status);
    const passCount = runs.filter(r => r.status === 'passed').length;
    const failCount = runs.filter(r => r.status === 'failed').length;
    const skipCount = runs.filter(r => r.status === 'skipped').length;
    const errorCount = runs.filter(r => r.status === 'error').length;
    
    // Count status transitions
    let statusTransitions = 0;
    for (let i = 1; i < statusHistory.length; i++) {
      if (statusHistory[i] !== statusHistory[i - 1]) {
        statusTransitions++;
      }
    }
    
    const flakinessScore = calculateFlakinessScore(statusHistory);
    const isFlaky = runs.length >= cfg.minRuns && flakinessScore >= cfg.threshold;
    
    // Calculate average duration
    const durationsWithValues = runs.filter(r => r.duration !== undefined);
    const avgDuration = durationsWithValues.length > 0
      ? durationsWithValues.reduce((sum, r) => sum + (r.duration || 0), 0) / durationsWithValues.length
      : undefined;
    
    // Get most recent error
    const failedRuns = sortedRuns.filter(r => r.status === 'failed' || r.status === 'error');
    const lastError = failedRuns.length > 0 
      ? failedRuns[failedRuns.length - 1].errorMessage 
      : undefined;
    
    analyses.push({
      testId,
      testName: runs[0].testName,
      className: runs[0].className,
      filePath: runs[0].filePath,
      totalRuns: runs.length,
      passCount,
      failCount,
      skipCount,
      errorCount,
      flakinessScore,
      isFlaky,
      statusTransitions,
      avgDuration,
      lastError,
      statusHistory,
      runs: sortedRuns,
    });
  }
  
  // Sort by flakiness score (highest first)
  analyses.sort((a, b) => b.flakinessScore - a.flakinessScore);
  
  // Calculate summary
  const flakyTests = analyses.filter(a => a.isFlaky);
  const stablePassingTests = analyses.filter(a => 
    !a.isFlaky && a.passCount === a.totalRuns
  );
  const stableFailingTests = analyses.filter(a => 
    !a.isFlaky && (a.failCount + a.errorCount) === a.totalRuns
  );
  
  const totalFlakinessScore = analyses.reduce((sum, a) => sum + a.flakinessScore, 0);
  const avgFlakinessScore = analyses.length > 0 
    ? Math.round(totalFlakinessScore / analyses.length) 
    : 0;
  
  // Get unique run IDs
  const uniqueRuns = new Set(results.map(r => r.runId));
  
  const summary: AnalysisSummary = {
    totalTests: analyses.length,
    flakyTests: flakyTests.length,
    stablePassingTests: stablePassingTests.length,
    stableFailingTests: stableFailingTests.length,
    totalRuns: uniqueRuns.size,
    avgFlakinessScore,
    topFlaky: analyses.slice(0, cfg.topN).filter(a => a.flakinessScore > 0),
    analyzedAt: new Date(),
  };
  
  return { summary, tests: analyses };
}

/**
 * Get a visual representation of status history
 */
export function getStatusHistoryVisual(history: TestStatus[]): string {
  return history.map(s => {
    switch (s) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      case 'error': return '!';
      case 'skipped': return '○';
      default: return '?';
    }
  }).join('');
}
