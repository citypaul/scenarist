# Contributing to Scenarist

Thank you for your interest in contributing to Scenarist! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all backgrounds and experience levels.

## Development Setup

### Prerequisites

- Node.js >= 22
- pnpm 9.0.0+

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/citypaul/scenarist.git
   cd scenarist
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Build all packages
   ```bash
   pnpm build
   ```

4. Run tests
   ```bash
   pnpm test
   ```

5. Type check
   ```bash
   pnpm typecheck
   ```

6. Lint
   ```bash
   pnpm lint
   ```

### Workspace Structure

```
packages/          # Public packages (published to npm)
├── express-adapter/
├── nextjs-adapter/
└── playwright-helpers/

internal/          # Internal packages (not published)
├── core/
└── msw-adapter/

apps/              # Example applications
├── express-example/
├── nextjs-app-router-example/
├── nextjs-pages-router-example/
└── docs/
```

## TDD Requirements (Non-Negotiable)

**Every line of production code must be written in response to a failing test.**

We follow strict Test-Driven Development (TDD) with the RED-GREEN-REFACTOR cycle:

### RED Phase
- Write a failing test for the desired behavior
- The test must fail for the right reason
- No production code until you have a failing test

### GREEN Phase
- Write the **minimum** code to make the test pass
- Resist the urge to write more than needed
- Get to green as quickly as possible

### REFACTOR Phase
- Assess the code for improvement opportunities
- Only refactor if it adds value
- **Commit before refactoring** to have a safe point to return to
- All tests must still pass after refactoring

### Common TDD Violations to Avoid

- Writing production code without a failing test first
- Writing multiple tests before making the first one pass
- Writing more production code than needed to pass the current test
- Adding functionality "while you're there" without a test driving it
- Skipping the refactor assessment step

### Test Quality Requirements

- 100% test coverage expected (through business behavior, not implementation testing)
- Test behavior, not implementation details
- Use factory functions for test data (no `let` or `beforeEach` with shared mutable state)
- No `any` types in test code

## Creating a Changeset

When making changes to packages that should be released, you must create a changeset to document the change.

### When to Create a Changeset

Create a changeset when you:
- Add a new feature
- Fix a bug
- Make a breaking change
- Change public API behavior

You do NOT need a changeset for:
- Documentation-only changes
- Internal refactoring with no public API changes
- Changes to example apps or internal tooling

### How to Create a Changeset

1. After making your changes, run:
   ```bash
   pnpm changeset
   ```

2. Follow the prompts:
   - Select the packages affected by your change
   - Choose the bump type (patch, minor, major)
   - Write a clear summary of the change for the changelog

3. Commit the generated changeset file with your changes:
   ```bash
   git add .changeset/*.md
   git commit -m "feat: add new feature"
   ```

### Bump Type Guidelines

| Bump Type | When to Use |
|-----------|-------------|
| **patch** | Bug fixes, performance improvements, internal changes |
| **minor** | New features, new optional parameters, deprecations |
| **major** | Breaking changes, removed features, changed behavior |

### Writing Good Changeset Summaries

Changeset summaries become changelog entries. Write them for users, not developers:

```markdown
# Good
Added support for regex pattern matching in URL definitions

# Bad
Fixed the URL matching to use RegExp objects
```

## Pull Request Guidelines

### Before Opening a PR

1. All tests pass locally
   ```bash
   pnpm test
   ```

2. Type checking passes
   ```bash
   pnpm typecheck
   ```

3. Linting passes
   ```bash
   pnpm lint
   ```

4. Changeset created (if applicable)

### PR Requirements

- Clear, descriptive title
- Description of what changed and why
- All CI checks passing
- Changeset included (if applicable)
- Tests for new functionality

### PR Review Process

1. Open a PR against `main`
2. Wait for CI checks to pass
3. Address any review feedback
4. Squash and merge when approved

## Coding Standards

### TypeScript

- Strict mode always (`strict: true`)
- No `any` types (use `unknown` if type is truly unknown)
- No type assertions without justification
- Use `type` for data structures, `interface` for behavior contracts

### Code Style

- Functional programming principles
- Immutable data structures (no mutations)
- Pure functions where possible
- No nested conditionals (use early returns)
- Self-documenting code (no comments explaining what code does)

### Testing

- Behavior-driven testing (test what it does, not how)
- Factory functions for test data
- No shared mutable state between tests
- Test through public API only

## Architecture

Scenarist follows hexagonal (ports & adapters) architecture:

- **Core** contains pure domain logic with zero framework dependencies
- **Adapters** translate between frameworks and core
- **Ports** define behavior contracts (interfaces)
- **Types** define data structures with `readonly` properties

### Key Principles

- Dependency injection (ports injected, never created internally)
- Declarative patterns over imperative (no functions in scenario definitions)
- Schemas at trust boundaries (Zod for validation)

## Getting Help

- Check existing [issues](https://github.com/citypaul/scenarist/issues)
- Read the [documentation](https://scenarist.io)
- Open a discussion for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
