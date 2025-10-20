---
description: Verify TDD practices and test coverage
---

Check that Test-Driven Development practices are being followed and that all production code has corresponding tests.

## Critical Rule

**Every line of production code must be written in response to a failing test.** No exceptions.

## What to Check

### 1. Test Coverage

```bash
# Run tests with coverage
pnpm --filter @scenarist/core test --coverage

# Check coverage report
cat packages/core/coverage/coverage-summary.json
```

**Requirements:**
- 100% coverage for business behavior
- All public API methods tested
- Edge cases covered

### 2. Test Quality

Tests must verify **behavior**, not **implementation details**:

```typescript
// ❌ WRONG - Testing implementation
it('should call the get method on registry', () => {
  const spy = jest.spyOn(registry, 'get');
  manager.switchScenario('test', 'scenario');
  expect(spy).toHaveBeenCalled();  // Implementation detail!
});

// ✅ CORRECT - Testing behavior
it('should return error when switching to non-existent scenario', () => {
  const result = manager.switchScenario('test', 'non-existent');
  expect(result.success).toBe(false);
  expect(result.error.message).toContain('not found');
});
```

### 3. Test Organization

Verify:
- Tests are in `packages/*/tests/` or `packages/*/src/**/*.test.ts`
- No 1:1 mapping (multiple behaviors tested per file is OK)
- Test files don't mirror implementation structure
- Tests group by behavior, not by implementation file

### 4. Test Data Patterns

Check for factory functions with optional overrides:

```typescript
// ✅ CORRECT
const createTestScenarioDefinition = (
  id: string,
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => ({
  id,
  name: 'Test Scenario',
  description: 'Test description',
  mocks: [],
  devToolEnabled: false,
  ...overrides,
});
```

## Checks to Run

```bash
# Find production code without tests
# (This is a heuristic - manual review needed)

# List all source files
find packages/core/src -name "*.ts" -not -name "*.test.ts" -not -name "index.ts"

# For each file, check if corresponding test exists
for file in $(find packages/core/src -name "*.ts" -not -name "*.test.ts" -not -name "index.ts"); do
  testfile=$(echo $file | sed 's/src/tests/' | sed 's/.ts/.test.ts/')
  if [ ! -f "$testfile" ]; then
    echo "⚠️  No obvious test for: $file"
  fi
done

# Check for common anti-patterns in tests
grep -r "jest.spyOn" packages/core/tests/ && echo "⚠️  Found spies (may be testing implementation)"
grep -r "toHaveBeenCalled" packages/core/tests/ && echo "⚠️  Found call verification (may be testing implementation)"
grep -r "private" packages/core/tests/ && echo "❌ Tests accessing private members"
```

## What Makes a Good Test?

### ✅ Good Tests:
- Test through public API only
- Verify expected business behavior
- Use descriptive test names
- Have clear arrange/act/assert structure
- Test edge cases and error conditions
- Use factory functions for test data

### ❌ Bad Tests:
- Mock internal/private functions
- Test implementation details
- Have unclear test names
- Test multiple unrelated behaviors
- Don't test error cases
- Duplicate data setup in every test

## Review Questions

1. **Is there a test for every production code change?**
   - If no: Request tests before merging

2. **Do tests verify behavior?**
   - If testing implementation: Request refactor

3. **Is coverage 100% for business behavior?**
   - If no: Identify missing test cases

4. **Are tests well-organized?**
   - If 1:1 mapping: Suggest grouping by behavior

5. **Do tests use factory functions?**
   - If duplicated setup: Suggest factory pattern

Report findings with:
- Coverage percentage
- Missing test cases
- Implementation testing anti-patterns
- Recommendations for improvement
