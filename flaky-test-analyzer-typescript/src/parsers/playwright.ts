/**
 * Playwright JSON Parser
 * Parses Playwright JSON test reports (--reporter=json)
 */

import { readFileSync } from 'fs';
import { Parser, TestResult, TestStatus } from '../types';

interface PlaywrightTest {
  title: string;
  ok: boolean;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
  duration: number;
  projectName?: string;
  results: Array<{
    status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
    duration: number;
    error?: {
      message?: string;
      stack?: string;
    };
  }>;
}

interface PlaywrightSpec {
  title: string;
  file: string;
  tests: PlaywrightTest[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightReport {
  config: Record<string, unknown>;
  suites: PlaywrightSuite[];
  stats: {
    startTime: string;
    duration: number;
  };
}

export class PlaywrightParser implements Parser {
  canParse(filePath: string): boolean {
    if (!filePath.endsWith('.json')) return false;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      // Check for Playwright-specific fields
      return 'suites' in parsed && 'config' in parsed;
    } catch {
      return false;
    }
  }

  async parse(filePath: string, runId: string): Promise<TestResult[]> {
    const content = readFileSync(filePath, 'utf-8');
    const report: PlaywrightReport = JSON.parse(content);
    const results: TestResult[] = [];
    const timestamp = new Date(report.stats.startTime);

    const processSpecs = (specs: PlaywrightSpec[], parentTitle: string = '') => {
      for (const spec of specs) {
        const specTitle = parentTitle ? `${parentTitle} > ${spec.title}` : spec.title;
        
        for (const test of spec.tests) {
          const className = specTitle;
          const testId = `${spec.file}:${className}.${test.title}`;
          
          // Use the last result (most recent retry)
          const lastResult = test.results[test.results.length - 1];
          
          let status: TestStatus;
          switch (lastResult?.status || test.status) {
            case 'passed':
              status = 'passed';
              break;
            case 'failed':
            case 'timedOut':
              status = 'failed';
              break;
            case 'skipped':
            case 'interrupted':
              status = 'skipped';
              break;
            default:
              status = 'error';
          }

          results.push({
            testId,
            testName: test.title,
            className,
            filePath: spec.file,
            status,
            duration: test.duration,
            errorMessage: lastResult?.error?.message,
            stackTrace: lastResult?.error?.stack,
            timestamp,
            runId,
          });
        }

        // Process nested specs
        if (spec.specs) {
          processSpecs(spec.specs, specTitle);
        }
      }
    };

    const processSuites = (suites: PlaywrightSuite[], parentTitle: string = '') => {
      for (const suite of suites) {
        const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
        
        if (suite.specs) {
          processSpecs(suite.specs, suiteTitle);
        }
        
        if (suite.suites) {
          processSuites(suite.suites, suiteTitle);
        }
      }
    };

    processSuites(report.suites);
    return results;
  }
}
