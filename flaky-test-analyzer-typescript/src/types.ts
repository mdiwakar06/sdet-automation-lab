/**
 * Core types for the Flaky Test Analyzer
 */

/** Status of an individual test execution */
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'error';

/** A single test result from one run */
export interface TestResult {
  /** Unique identifier for the test (usually className + testName) */
  testId: string;
  /** Name of the test */
  testName: string;
  /** Class or suite containing the test */
  className?: string;
  /** File path if available */
  filePath?: string;
  /** Test execution status */
  status: TestStatus;
  /** Duration in milliseconds */
  duration?: number;
  /** Error message if failed */
  errorMessage?: string;
  /** Stack trace if available */
  stackTrace?: string;
  /** Timestamp of the test run */
  timestamp?: Date;
  /** Source file/run identifier */
  runId: string;
}

/** Aggregated analysis for a single test across multiple runs */
export interface TestAnalysis {
  testId: string;
  testName: string;
  className?: string;
  filePath?: string;
  /** Total number of runs */
  totalRuns: number;
  /** Number of passed runs */
  passCount: number;
  /** Number of failed runs */
  failCount: number;
  /** Number of skipped runs */
  skipCount: number;
  /** Number of error runs */
  errorCount: number;
  /** Flakiness score (0-100%) */
  flakinessScore: number;
  /** Is this test considered flaky? */
  isFlaky: boolean;
  /** Number of status transitions between runs */
  statusTransitions: number;
  /** Average duration across runs */
  avgDuration?: number;
  /** Most recent error message */
  lastError?: string;
  /** History of statuses in chronological order */
  statusHistory: TestStatus[];
  /** Individual run results */
  runs: TestResult[];
}

/** Summary statistics for the entire analysis */
export interface AnalysisSummary {
  /** Total unique tests analyzed */
  totalTests: number;
  /** Number of flaky tests */
  flakyTests: number;
  /** Number of consistently passing tests */
  stablePassingTests: number;
  /** Number of consistently failing tests */
  stableFailingTests: number;
  /** Number of test runs analyzed */
  totalRuns: number;
  /** Average flakiness score across all tests */
  avgFlakinessScore: number;
  /** Top N flakiest tests */
  topFlaky: TestAnalysis[];
  /** Timestamp of analysis */
  analyzedAt: Date;
}

/** Complete analysis result */
export interface AnalysisResult {
  summary: AnalysisSummary;
  tests: TestAnalysis[];
}

/** Supported test report formats */
export type ReportFormat = 'junit' | 'jest' | 'playwright' | 'generic';

/** Parser interface */
export interface Parser {
  /** Parse a file and return test results */
  parse(filePath: string, runId: string): Promise<TestResult[]>;
  /** Check if this parser can handle the given file */
  canParse(filePath: string): boolean;
}

/** CLI options */
export interface AnalyzerOptions {
  /** Input file pattern or directory */
  input: string | string[];
  /** Report format (auto-detect if not specified) */
  format?: ReportFormat;
  /** Flakiness threshold (tests above this % are considered flaky) */
  threshold?: number;
  /** Output format */
  output?: 'console' | 'json' | 'html';
  /** Output file path */
  outputFile?: string;
  /** Number of top flaky tests to show */
  topN?: number;
  /** Minimum runs required to calculate flakiness */
  minRuns?: number;
}
