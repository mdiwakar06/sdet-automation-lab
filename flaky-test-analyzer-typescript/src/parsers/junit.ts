/**
 * JUnit XML Parser
 * Parses JUnit/xUnit XML test reports (used by pytest, JUnit, TestNG, etc.)
 */

import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { Parser, TestResult, TestStatus } from '../types';

interface JUnitTestCase {
  '@_name': string;
  '@_classname'?: string;
  '@_time'?: string;
  '@_file'?: string;
  failure?: { '#text'?: string; '@_message'?: string } | string;
  error?: { '#text'?: string; '@_message'?: string } | string;
  skipped?: { '@_message'?: string } | string | null;
}

interface JUnitTestSuite {
  '@_name'?: string;
  '@_tests'?: string;
  '@_failures'?: string;
  '@_errors'?: string;
  '@_skipped'?: string;
  '@_time'?: string;
  '@_timestamp'?: string;
  testcase?: JUnitTestCase | JUnitTestCase[];
}

interface JUnitReport {
  testsuites?: {
    testsuite?: JUnitTestSuite | JUnitTestSuite[];
  };
  testsuite?: JUnitTestSuite | JUnitTestSuite[];
}

export class JUnitParser implements Parser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      isArray: (name) => ['testsuite', 'testcase'].includes(name),
    });
  }

  canParse(filePath: string): boolean {
    return filePath.endsWith('.xml');
  }

  async parse(filePath: string, runId: string): Promise<TestResult[]> {
    const content = readFileSync(filePath, 'utf-8');
    const parsed: JUnitReport = this.xmlParser.parse(content);
    const results: TestResult[] = [];

    // Handle both <testsuites><testsuite>... and direct <testsuite>...
    let testSuites: JUnitTestSuite[] = [];
    
    if (parsed.testsuites?.testsuite) {
      testSuites = Array.isArray(parsed.testsuites.testsuite) 
        ? parsed.testsuites.testsuite 
        : [parsed.testsuites.testsuite];
    } else if (parsed.testsuite) {
      testSuites = Array.isArray(parsed.testsuite) 
        ? parsed.testsuite 
        : [parsed.testsuite];
    }

    for (const suite of testSuites) {
      const timestamp = suite['@_timestamp'] ? new Date(suite['@_timestamp']) : undefined;
      const testCases = suite.testcase ? (Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase]) : [];

      for (const tc of testCases) {
        const testName = tc['@_name'];
        const className = tc['@_classname'] || suite['@_name'];
        const testId = className ? `${className}.${testName}` : testName;

        let status: TestStatus = 'passed';
        let errorMessage: string | undefined;
        let stackTrace: string | undefined;

        if (tc.failure) {
          status = 'failed';
          if (typeof tc.failure === 'object') {
            errorMessage = tc.failure['@_message'];
            stackTrace = tc.failure['#text'];
          }
        } else if (tc.error) {
          status = 'error';
          if (typeof tc.error === 'object') {
            errorMessage = tc.error['@_message'];
            stackTrace = tc.error['#text'];
          }
        } else if (tc.skipped !== undefined) {
          status = 'skipped';
          if (typeof tc.skipped === 'object' && tc.skipped) {
            errorMessage = tc.skipped['@_message'];
          }
        }

        results.push({
          testId,
          testName,
          className,
          filePath: tc['@_file'],
          status,
          duration: tc['@_time'] ? parseFloat(tc['@_time']) * 1000 : undefined,
          errorMessage,
          stackTrace,
          timestamp,
          runId,
        });
      }
    }

    return results;
  }
}
