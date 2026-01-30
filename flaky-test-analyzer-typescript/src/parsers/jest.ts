/**
 * Jest JSON Parser
 * Parses Jest JSON test reports (--json flag output)
 */

import { readFileSync } from 'fs';
import { Parser, TestResult, TestStatus } from '../types';

interface JestAssertion {
  ancestorTitles: string[];
  failureMessages: string[];
  fullName: string;
  location?: { column: number; line: number };
  numPassingAsserts: number;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  title: string;
  duration?: number;
}

interface JestTestResult {
  assertionResults: JestAssertion[];
  endTime: number;
  message: string;
  name: string;
  startTime: number;
  status: 'passed' | 'failed';
}

interface JestReport {
  numFailedTestSuites: number;
  numFailedTests: number;
  numPassedTestSuites: number;
  numPassedTests: number;
  numPendingTestSuites: number;
  numPendingTests: number;
  numRuntimeErrorTestSuites: number;
  numTodoTests: number;
  numTotalTestSuites: number;
  numTotalTests: number;
  startTime: number;
  success: boolean;
  testResults: JestTestResult[];
  wasInterrupted: boolean;
}

export class JestParser implements Parser {
  canParse(filePath: string): boolean {
    if (!filePath.endsWith('.json')) return false;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      // Check for Jest-specific fields
      return 'testResults' in parsed && 'numTotalTests' in parsed;
    } catch {
      return false;
    }
  }

  async parse(filePath: string, runId: string): Promise<TestResult[]> {
    const content = readFileSync(filePath, 'utf-8');
    const report: JestReport = JSON.parse(content);
    const results: TestResult[] = [];
    const timestamp = new Date(report.startTime);

    for (const testFile of report.testResults) {
      for (const assertion of testFile.assertionResults) {
        const className = assertion.ancestorTitles.join(' > ') || testFile.name;
        const testId = `${className}.${assertion.title}`;

        let status: TestStatus;
        switch (assertion.status) {
          case 'passed':
            status = 'passed';
            break;
          case 'failed':
            status = 'failed';
            break;
          case 'pending':
          case 'skipped':
            status = 'skipped';
            break;
          default:
            status = 'error';
        }

        results.push({
          testId,
          testName: assertion.title,
          className,
          filePath: testFile.name,
          status,
          duration: assertion.duration,
          errorMessage: assertion.failureMessages.length > 0 
            ? assertion.failureMessages[0].split('\n')[0] 
            : undefined,
          stackTrace: assertion.failureMessages.length > 0 
            ? assertion.failureMessages.join('\n') 
            : undefined,
          timestamp,
          runId,
        });
      }
    }

    return results;
  }
}
