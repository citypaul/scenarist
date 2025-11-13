# Scenarist - Agent Guidelines

## Commands
- **Build**: `pnpm build` (all) | `pnpm build --filter=@scenarist/core` (package)
- **Test**: `pnpm test` (all) | `cd packages/core && pnpm test scenario-manager.test.ts` (single file) | `pnpm test:watch` (watch)
- **Coverage**: `cd packages/[name] && pnpm exec vitest run --coverage` (100% required)
- **Lint**: `pnpm lint` | **Format**: `pnpm format` | **Types**: `pnpm check-types`

## TDD (NON-NEGOTIABLE)
**Every line of code must be written in response to a failing test.** RED (write failing test) → GREEN (minimal code to pass) → REFACTOR (assess improvements). No production code without a failing test first.

## Code Style
- **TypeScript strict mode** - No `any`, no type assertions without justification, no `@ts-ignore`
- **Immutability** - All data `readonly`, no mutations, return new objects
- **Functional** - Pure functions, early returns over nested if/else, array methods over loops
- **No comments** - Code should be self-documenting (exception: JSDoc for public APIs)
- **Options objects** - Prefer `fn(options: Options)` over positional parameters

## Testing
- **Behavior-driven** - Test through public APIs only, not implementation details
- **No `let` or `beforeEach`** - Use factory functions for test data: `const createTestSetup = () => ({ ... })`
- **100% coverage** - Lines, statements, branches, functions (no exceptions without approval)
- **Test files** - `*.test.ts` in `packages/*/tests/`

## Architecture (Hexagonal)
- **Ports (interfaces)** - `packages/core/src/ports/` - Behavior contracts, use `interface`
- **Types (data)** - `packages/core/src/types/` - Use `type` with `readonly`
- **Schemas** - ALWAYS in `packages/core/src/schemas/`, NEVER in adapters (Zod schemas are domain logic)
- **Adapters** - Separate packages, depend on core only, no inter-adapter dependencies

## Mocking Mechanism
- **Server-side MSW** - MSW runs in Node.js (not browser) for Next.js Server Components/API routes
- **Header propagation** - Playwright injects x-test-id into browser→Next.js requests via `page.route('**/*')`
- **MSW interception** - Server-side MSW intercepts external API calls (e.g., localhost:3001) using test ID headers
- **Scenario selection** - Test ID maps to active scenario, determining which mocks are applied
- **Universal compatibility** - `**/*` route pattern works for all API conventions (/api/*, /v1/*, /graphql, etc.)
