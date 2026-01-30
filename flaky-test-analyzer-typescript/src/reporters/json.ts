/**
 * JSON Reporter - Machine-readable output
 */

import { writeFileSync } from 'fs';
import { AnalysisResult } from '../types';

/**
 * Format analysis result as JSON string
 */
export function formatJsonReport(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Write JSON report to file
 */
export function writeJsonReport(result: AnalysisResult, filePath: string): void {
  const json = formatJsonReport(result);
  writeFileSync(filePath, json, 'utf-8');
}
