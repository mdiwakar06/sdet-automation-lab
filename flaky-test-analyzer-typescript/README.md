# Flaky Test Analyzer

A CLI tool to analyze test results across multiple runs and identify flaky tests. Helps QA and SDET teams find unreliable tests that erode confidence in test suites.

## What is a Flaky Test?

A flaky test is one that produces inconsistent results - sometimes passing, sometimes failing - without any changes to the code. Flaky tests:
- Waste developer time investigating false failures
- Reduce confidence in the test suite
- Can mask real bugs
- Slow down CI/CD pipelines with retries

## Features

- **Multi-format support**: JUnit XML, Jest JSON, Playwright JSON
- **Auto-detection**: Automatically detects report format
- **Flakiness scoring**: Calculates a flakiness percentage based on status transitions
- **Visual history**: See pass/fail patterns across runs
- **Configurable thresholds**: Define what % flakiness is acceptable
- **CI-friendly**: Exit code 1 when flaky tests detected, JSON output for automation

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Analyze test results
npx flaky analyze "samples/*.xml"
```

## Installation

```bash
cd flaky-test-analyzer-typescript
npm install
npm run build
npm link  # Makes 'flaky' command globally available
```

## CLI Usage

```bash
# Analyze JUnit XML reports from multiple runs
flaky analyze "results/run-*.xml"

# Analyze Jest JSON reports
flaky analyze "jest-results/*.json" -f jest

# Analyze with custom threshold (default: 10%)
flaky analyze "results/*.xml" -t 20

# Output as JSON
flaky analyze "results/*.xml" -o json

# Save JSON report to file
flaky analyze "results/*.xml" -o json --output-file report.json

# Require minimum 3 runs to flag as flaky
flaky analyze "results/*.xml" -m 3

# Show top 5 flakiest tests
flaky analyze "results/*.xml" -n 5

# List supported formats
flaky formats
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | Force report format (junit, jest, playwright) | auto-detect |
| `-t, --threshold` | Flakiness % threshold to flag as flaky | 10 |
| `-m, --min-runs` | Minimum runs required to calculate flakiness | 2 |
| `-n, --top` | Number of top flaky tests to show | 10 |
| `-o, --output` | Output format (console, json) | console |
| `--output-file` | Write JSON output to file | - |

## Supported Report Formats

| Format | Description | File Type |
|--------|-------------|-----------|
| `junit` | JUnit/xUnit XML | .xml |
| `jest` | Jest JSON reporter | .json |
| `playwright` | Playwright JSON reporter | .json |

### JUnit XML (pytest, JUnit, TestNG, NUnit)
```bash
# pytest
pytest --junitxml=results.xml

# JUnit/Maven
mvn test

# TestNG
# Generates testng-results.xml by default
```

### Jest
```bash
jest --json --outputFile=results.json
```

### Playwright
```bash
npx playwright test --reporter=json
```

## How Flakiness is Calculated

The flakiness score is based on status transitions between runs:

```
Flakiness = (status_transitions / (total_runs - 1)) × 100
```

Examples:
- `✓ ✓ ✓ ✓` = 0% (always passes)
- `✗ ✗ ✗ ✗` = 0% (always fails)
- `✓ ✗ ✓ ✗` = 100% (alternates every run)
- `✓ ✓ ✗ ✓` = 67% (2 transitions in 3 intervals)

## Example Output

```
═══════════════════════════════════════════════════════════
                    FLAKY TEST ANALYSIS
═══════════════════════════════════════════════════════════

Summary:
────────────────────────────────────────────────────────────
  Total Tests:          5
  Test Runs Analyzed:   4
  Flaky Tests:          3
  Stable Passing:       2
  Stable Failing:       0
  Avg Flakiness Score:  40%

⚠ Flaky Tests Detected:
────────────────────────────────────────────────────────────

  should handle network timeout
  LoginTests
  Flakiness: 67%  |  Runs: 4  |  Pass: 2  Fail: 2
  History: ✗ ✓ ✗ ✓
  Last Error: Connection refused

  should add item to cart
  CartTests
  Flakiness: 33%  |  Runs: 4  |  Pass: 3  Fail: 1
  History: ✓ ✓ ✗ ✓
  Last Error: Element not found

Legend: ✓ = passed, ✗ = failed, ! = error, ○ = skipped
```

## CI/CD Integration

The CLI exits with code 1 when flaky tests are detected, making it easy to integrate into CI pipelines:

```yaml
# GitHub Actions example
- name: Analyze test flakiness
  run: |
    npx flaky analyze "test-results/**/*.xml" -t 15
  continue-on-error: false
```

## Programmatic Usage

```typescript
import { parseFiles } from 'flaky-test-analyzer/parsers';
import { analyzeTests } from 'flaky-test-analyzer/analyzer';

const results = await parseFiles(['results/*.xml']);
const analysis = analyzeTests(results, {
  threshold: 10,
  minRuns: 2,
  topN: 10,
});

console.log(`Found ${analysis.summary.flakyTests} flaky tests`);
```

## Project Structure

```
flaky-test-analyzer-typescript/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── types.ts           # TypeScript interfaces
│   ├── analyzer.ts        # Core analysis logic
│   ├── parsers/
│   │   ├── index.ts       # Parser registry
│   │   ├── junit.ts       # JUnit XML parser
│   │   ├── jest.ts        # Jest JSON parser
│   │   └── playwright.ts  # Playwright JSON parser
│   └── reporters/
│       ├── console.ts     # Terminal output
│       └── json.ts        # JSON output
├── samples/               # Sample test reports
├── package.json
├── tsconfig.json
└── README.md
```
