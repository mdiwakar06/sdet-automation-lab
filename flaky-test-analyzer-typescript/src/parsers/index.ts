/**
 * Parser registry and auto-detection
 */

import { glob } from 'glob';
import { Parser, TestResult, ReportFormat } from '../types';
import { JUnitParser } from './junit';
import { JestParser } from './jest';
import { PlaywrightParser } from './playwright';

export { JUnitParser } from './junit';
export { JestParser } from './jest';
export { PlaywrightParser } from './playwright';

const parsers: Parser[] = [
  new JestParser(),
  new PlaywrightParser(),
  new JUnitParser(), // JUnit last as it's the most generic XML format
];

/**
 * Auto-detect the appropriate parser for a file
 */
export function detectParser(filePath: string): Parser | undefined {
  return parsers.find(p => p.canParse(filePath));
}

/**
 * Get parser by format name
 */
export function getParserByFormat(format: ReportFormat): Parser {
  switch (format) {
    case 'junit':
      return new JUnitParser();
    case 'jest':
      return new JestParser();
    case 'playwright':
      return new PlaywrightParser();
    case 'generic':
      return new JUnitParser(); // Fall back to JUnit for generic
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Parse multiple files and aggregate results
 */
export async function parseFiles(
  patterns: string | string[],
  format?: ReportFormat
): Promise<TestResult[]> {
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const allResults: TestResult[] = [];
  
  for (const pattern of patternArray) {
    const files = await glob(pattern);
    
    for (const file of files) {
      const runId = file; // Use filename as run identifier
      
      let parser: Parser | undefined;
      if (format) {
        parser = getParserByFormat(format);
      } else {
        parser = detectParser(file);
      }
      
      if (!parser) {
        console.warn(`No parser found for: ${file}`);
        continue;
      }
      
      try {
        const results = await parser.parse(file, runId);
        allResults.push(...results);
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
      }
    }
  }
  
  return allResults;
}
