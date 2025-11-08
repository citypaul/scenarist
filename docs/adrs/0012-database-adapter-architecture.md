# ADR-0012: Database Adapter Architecture

**Status:** Proposed
**Date:** 2025-11-08
**Context:** Extending Scenarist to support database mocking for applications with direct database queries

## Problem Statement

Scenarist currently only supports HTTP request mocking via MSW. This excludes a large class of applications that:
- Query their own databases directly (no external HTTP calls)
- Use ORMs like Prisma, TypeORM, Sequelize
- Have monolithic architectures with database as primary integration boundary

**Example application Scenarist doesn't currently help:**

```typescript
// Express route with direct database query
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);  // Direct DB call
  res.json(user);
});
```

Teams with this pattern cannot benefit from Scenarist's scenario management for E2E tests.

## Decision

Create a **Database Adapter** package (`@scenarist/database-adapter`) that:

1. **Intercepts database queries at the ORM level**
2. **Returns mock responses based on active scenario**
3. **Uses same test ID isolation pattern as HTTP mocks**
4. **Requires zero application code changes**

### High-Level Architecture

```typescript
// Scenario definition with database mocks
const scenarios = {
  default: {
    id: 'default',
    name: 'Default Users',
    mocks: [],  // HTTP mocks (if any)
    databaseMocks: [
      {
        table: 'users',
        operation: 'findFirst',
        match: { id: 'user-123' },
        response: { id: 'user-123', name: 'John Doe', tier: 'standard' },
      },
    ],
  },
  premiumUser: {
    id: 'premium',
    name: 'Premium User Scenario',
    databaseMocks: [
      {
        table: 'users',
        operation: 'findFirst',
        match: { id: 'user-123' },
        response: { id: 'user-123', name: 'Premium John', tier: 'premium' },
      },
    ],
  },
} as const satisfies ScenaristScenarios;

// Server setup - wrap database client with proxy
import { createPrismaProxy } from '@scenarist/prisma-adapter';

const db = createPrismaProxy({
  client: prisma,
  scenarist: scenarist.manager,
  getTestId: scenarist.getTestId,
});

// Application code UNCHANGED
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findFirst({ where: { id: req.params.id } });
  res.json(user);
});
```

### Execution Flow

1. **Request arrives with test ID**: `x-test-id: test-123`
2. **Middleware extracts test ID**: Stored in AsyncLocalStorage
3. **Database query executed**: `db.users.findFirst({ where: { id: 'user-123' } })`
4. **Proxy intercepts query**: Checks active scenario for test ID
5. **Scenario lookup**: Test `test-123` is using scenario `premiumUser`
6. **Mock matching**:
   - Table: `users` ✓
   - Operation: `findFirst` ✓
   - Match criteria: `{ id: 'user-123' }` ✓
7. **Return mock response**: `{ id: 'user-123', name: 'Premium John', tier: 'premium' }`
8. **Real database never queried**

### Database Mock Structure

```typescript
type DatabaseMock = {
  readonly table: string;
  readonly operation: 'findFirst' | 'findMany' | 'create' | 'update' | 'delete' | 'upsert';
  readonly match?: Record<string, unknown>;  // Partial match on query criteria
  readonly response: unknown;  // Mock data to return
  readonly sequence?: ResponseSequence;  // Support sequences (like HTTP mocks)
};

type ScenaristScenarioWithDatabase = ScenaristScenario & {
  readonly databaseMocks?: ReadonlyArray<DatabaseMock>;
};
```

### ORM Integration Points

Different adapters for different ORMs:

#### Prisma Adapter (`@scenarist/prisma-adapter`)

Uses Prisma's [`$extends`](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions) API:

```typescript
export const createPrismaProxy = ({
  client,
  scenarist,
  getTestId,
}: {
  client: PrismaClient;
  scenarist: ScenaristManager;
  getTestId: () => string | undefined;
}) => {
  return client.$extends({
    query: {
      $allModels: {
        async findFirst({ args, query, model }) {
          const testId = getTestId();
          if (!testId) return query(args);  // No test ID = real DB

          const mock = findMatchingDatabaseMock({
            testId,
            scenarist,
            table: model,
            operation: 'findFirst',
            queryArgs: args.where,
          });

          return mock ? mock.response : query(args);  // Mock or real DB
        },
        // ... other operations
      },
    },
  });
};
```

#### TypeORM Adapter (`@scenarist/typeorm-adapter`)

Uses TypeORM's [subscribers/listeners](https://typeorm.io/listeners-and-subscribers):

```typescript
export const createTypeORMProxy = ({ /* ... */ }) => {
  // Intercept via EntitySubscriber
  // Similar pattern, different ORM API
};
```

#### Sequelize Adapter (`@scenarist/sequelize-adapter`)

Uses Sequelize's [hooks](https://sequelize.org/docs/v6/other-topics/hooks/):

```typescript
export const createSequelizeProxy = ({ /* ... */ }) => {
  // Intercept via beforeFind, beforeCreate hooks
  // Similar pattern, different ORM API
};
```

## Benefits

✅ **Zero application code changes** - Same database calls, no refactoring required
✅ **Works with any ORM** - Adapter pattern supports multiple ORMs
✅ **Scenario-based testing** - Same scenario switching API as HTTP mocks
✅ **Test isolation** - Each test ID has independent database state
✅ **Parallel test execution** - Different test IDs = different scenarios
✅ **Familiar API** - Same pattern as existing Scenarist HTTP mocks
✅ **Gradual adoption** - Mock only what you need, fallthrough to real DB
✅ **Type safety** - Preserves ORM's TypeScript types
✅ **Hexagonal architecture** - Core remains framework-agnostic

## Trade-offs

**Advantages:**
- Extends Scenarist to database-heavy applications
- No architectural changes to existing apps
- Consistent with HTTP mock patterns
- Enables concurrent E2E tests with database state

**Disadvantages:**
- Requires ORM-specific adapters (maintenance burden)
- Complex queries (joins, aggregations) harder to mock
- ORM must support interception/middleware/hooks
- Type inference requires careful TypeScript generics

## Implementation Plan

### Phase 1: Prisma Adapter (Spike)
- **Goal:** Validate approach with most popular ORM
- **Deliverables:**
  - `@scenarist/prisma-adapter` package
  - Support basic CRUD operations (findFirst, findMany, create, update, delete)
  - Integration with AsyncLocalStorage for test ID
  - E2E tests with Express example app
  - Documentation and examples

### Phase 2: Core Database Ports
- **Goal:** Extract common database mocking logic
- **Deliverables:**
  - `DatabaseMockSelector` port (similar to `ResponseSelector`)
  - `DatabaseMockMatcher` port (matching logic)
  - Database mock schema validation (Zod)
  - Shared test utilities

### Phase 3: Additional ORM Adapters
- **Goal:** Support more ORMs based on demand
- **Candidates:**
  - TypeORM (enterprise/NestJS users)
  - Sequelize (legacy applications)
  - Drizzle (modern TypeScript-first ORM)
  - Kysely (type-safe SQL query builder)

### Phase 4: Advanced Features
- **Goal:** Feature parity with HTTP mocks
- **Deliverables:**
  - Sequence support (polling database states)
  - State capture from queries
  - Transaction handling
  - Complex query matching (joins, aggregations)

## Open Questions

1. **Transaction support**: How to handle transactions when mocking?
   - **Proposal:** Mock transaction boundaries but not isolation semantics
   - **Rationale:** E2E tests care about outcomes, not transaction internals

2. **Complex queries**: How to match joins, aggregations, raw SQL?
   - **Proposal:** Start with simple operations, add complexity based on demand
   - **Rationale:** 80% of use cases are simple CRUD

3. **Performance**: Proxy overhead on every query?
   - **Proposal:** Only intercept when test ID present (production unaffected)
   - **Rationale:** Test ID check is cheap, proxy only active in tests

4. **Type safety**: How to preserve ORM's TypeScript types through proxy?
   - **Proposal:** Use TypeScript generics to flow types through
   - **Rationale:** Prisma's `$extends` already solves this for Prisma

## Alternatives Considered

### Alternative 1: Repository Pattern + Mocks

**Approach:** Require applications to use repository pattern (hexagonal architecture)

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// Tests inject mock repository
const mockRepo: UserRepository = {
  findById: async (id) => ({ id, name: 'Mock User' }),
};
```

**Rejected because:**
- ❌ Requires application refactoring (not zero-change)
- ❌ Teams without hexagonal architecture can't adopt
- ❌ Not backward compatible with existing codebases

### Alternative 2: Database Seeding/Fixtures

**Approach:** Scenarios define seed data, reset database on scenario switch

```typescript
const scenarios = {
  premium: {
    id: 'premium',
    seeds: {
      users: [{ id: 'user-123', name: 'Premium User', tier: 'premium' }],
    },
  },
};

// On scenario switch: truncate tables, insert seed data
```

**Rejected because:**
- ❌ Slow (database reset + re-seed for each scenario switch)
- ❌ Requires shared test database (no parallel test isolation)
- ❌ Race conditions with concurrent tests
- ❌ Database state visible across tests

### Alternative 3: Docker Containers Per Test

**Approach:** Each test ID gets isolated database container

**Rejected because:**
- ❌ Extremely slow (container startup time)
- ❌ Resource intensive (memory, disk)
- ❌ Complex orchestration
- ❌ Not suitable for fast feedback loops

## Validation Criteria

This approach succeeds if:

1. ✅ Zero changes required to existing application code
2. ✅ Works with at least one major ORM (Prisma)
3. ✅ Maintains test ID isolation (concurrent tests possible)
4. ✅ Type safety preserved (no loss of ORM's TypeScript types)
5. ✅ Performance acceptable (< 10ms overhead per query)
6. ✅ 100% test coverage in adapter package
7. ✅ Documentation clear enough for adoption

## References

- [Prisma Client Extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [TypeORM Subscribers](https://typeorm.io/listeners-and-subscribers)
- [Sequelize Hooks](https://sequelize.org/docs/v6/other-topics/hooks/)
- [MSW Architecture](https://mswjs.io/docs/concepts/architecture) (inspiration for interception pattern)

## Decision Outcome

**Status:** Proposed (awaiting implementation spike)

**Next Steps:**
1. Create spike branch for Prisma adapter proof-of-concept
2. Implement basic CRUD interception
3. Test with Express example app
4. Validate type safety and performance
5. If successful → promote to Phase 1 implementation
6. If unsuccessful → document learnings and revisit alternatives
