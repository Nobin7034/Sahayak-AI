import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read test results
const resultsPath = path.join(__dirname, '../test-results/results.json');

if (!fs.existsSync(resultsPath)) {
  console.log('No test results found. Run tests first with: npm run test:e2e');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Calculate statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  duration: 0,
  suites: {}
};

results.suites.forEach(suite => {
  const suiteName = suite.title || 'Unknown Suite';
  stats.suites[suiteName] = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  suite.specs.forEach(spec => {
    stats.total++;
    stats.suites[suiteName].total++;

    spec.tests.forEach(test => {
      test.results.forEach(result => {
        stats.duration += result.duration;

        if (result.status === 'passed') {
          stats.passed++;
          stats.suites[suiteName].passed++;
        } else if (result.status === 'failed') {
          stats.failed++;
          stats.suites[suiteName].failed++;
        } else if (result.status === 'skipped') {
          stats.skipped++;
          stats.suites[suiteName].skipped++;
        }
      });
    });
  });
});

// Generate summary
const summary = `
# Playwright Test Summary

## Overall Statistics
- **Total Tests**: ${stats.total}
- **Passed**: ${stats.passed} ✅
- **Failed**: ${stats.failed} ❌
- **Skipped**: ${stats.skipped} ⏭️
- **Success Rate**: ${((stats.passed / stats.total) * 100).toFixed(2)}%
- **Total Duration**: ${(stats.duration / 1000).toFixed(2)}s

## Test Suites

${Object.entries(stats.suites).map(([name, suite]) => `
### ${name}
- Total: ${suite.total}
- Passed: ${suite.passed} ✅
- Failed: ${suite.failed} ❌
- Skipped: ${suite.skipped} ⏭️
- Success Rate: ${suite.total > 0 ? ((suite.passed / suite.total) * 100).toFixed(2) : 0}%
`).join('\n')}

## Test Coverage

This test suite covers:
- ✅ Landing Page & Navigation
- ✅ Authentication & Authorization
- ✅ Services Management
- ✅ Appointments System
- ✅ User Dashboard
- ✅ News & Content
- ✅ Admin Dashboard
- ✅ Admin User Management
- ✅ Admin Services Management
- ✅ Admin Appointments Management
- ✅ Admin Centers Management
- ✅ Admin Staff Management
- ✅ Staff Dashboard
- ✅ Document Management
- ✅ Center Finder & Maps
- ✅ Responsive Design
- ✅ Accessibility
- ✅ Performance
- ✅ Error Handling

## Reports

- **HTML Report**: Open \`playwright-report/index.html\` in a browser
- **JSON Report**: \`test-results/results.json\`
- **JUnit Report**: \`test-results/junit.xml\`
- **Allure Report**: Run \`npm run test:allure\` to generate

---
Generated on: ${new Date().toLocaleString()}
`;

// Write summary to file
const summaryPath = path.join(__dirname, '../TEST_SUMMARY.md');
fs.writeFileSync(summaryPath, summary);

console.log(summary);
console.log(`\nSummary saved to: ${summaryPath}`);

// Exit with error code if tests failed
if (stats.failed > 0) {
  process.exit(1);
}
