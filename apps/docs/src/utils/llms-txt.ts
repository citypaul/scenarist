import type starlightLlmsTxt from "starlight-llms-txt";

// Content for https://scenarist.io/llms.txt (format: https://llmstxt.org/).
// The page index below is hand-written for agents; see CONTRIBUTING.md#llmstxt.

const SITE_URL = "https://scenarist.io";

type LlmsTxtOptions = NonNullable<Parameters<typeof starlightLlmsTxt>[0]>;

type IndexedPage = {
  readonly path: string;
  readonly title: string;
  readonly summary: string;
};

type IndexSection = {
  readonly heading: string;
  readonly pages: readonly IndexedPage[];
};

const index: readonly IndexSection[] = [
  {
    heading: "Start here",
    pages: [
      {
        path: "/getting-started/quick-start/",
        title: "Quick Start",
        summary:
          "The three-step model (define scenarios, add the adapter, switch per test) and links to each framework guide",
      },
      {
        path: "/getting-started/installation/",
        title: "Installation",
        summary:
          "Package names, install commands, subpath imports, and peer dependency ranges for every framework",
      },
      {
        path: "/getting-started/why-scenarist/",
        title: "Why Scenarist?",
        summary:
          "The gap between unit and end-to-end tests, and what Scenarist can and cannot intercept",
      },
      {
        path: "/concepts/how-it-works/",
        title: "How It Works",
        summary:
          "Execution model: test IDs, runtime scenario switching, and how intercepted requests are routed",
      },
      {
        path: "/concepts/philosophy/",
        title: "Testing Philosophy",
        summary:
          "Test behaviour through the real server, mock only what you do not own",
      },
    ],
  },
  {
    heading: "Framework setup",
    pages: [
      {
        path: "/frameworks/express/getting-started/",
        title: "Express: Getting Started",
        summary:
          "Middleware setup, Supertest tests, and automatic test ID propagation via AsyncLocalStorage",
      },
      {
        path: "/frameworks/nextjs-app-router/getting-started/",
        title: "Next.js App Router: Getting Started",
        summary:
          "Singleton setup, the `/api/__scenario__` route handler, Playwright fixtures, and header forwarding from Server Components and Route Handlers",
      },
      {
        path: "/frameworks/nextjs-pages-router/getting-started/",
        title: "Next.js Pages Router: Getting Started",
        summary:
          "API route endpoints, header forwarding from API routes and getServerSideProps",
      },
      {
        path: "/frameworks/nextjs-app-router/rsc/",
        title: "Testing React Server Components",
        summary:
          "Data fetching, streaming and Suspense, Server Actions, auth flows, and error boundaries",
      },
      {
        path: "/frameworks/nextjs-app-router/rsc/troubleshooting/",
        title: "RSC Troubleshooting",
        summary:
          "Missing header forwarding, `page.request` without a test ID, Next.js fetch caching, sequences that never advance",
      },
    ],
  },
  {
    heading: "Writing scenarios",
    pages: [
      {
        path: "/scenarios/overview/",
        title: "Writing Scenarios Overview",
        summary: "Which scenario feature solves which problem",
      },
      {
        path: "/scenarios/basic-structure/",
        title: "Basic Structure",
        summary:
          "Scenario and mock fields, HTTP methods, URL patterns, and response shape",
      },
      {
        path: "/scenarios/default-scenarios/",
        title: "Default Scenarios",
        summary:
          "The required `default` scenario, partial overrides, and specificity-based mock selection",
      },
      {
        path: "/scenarios/request-matching/",
        title: "Request Matching",
        summary:
          "Different responses for the same URL based on body, headers, or query",
      },
      {
        path: "/scenarios/pattern-matching/",
        title: "Pattern Matching",
        summary:
          "`equals`, `contains`, `startsWith`, `endsWith`, `regex`, and native RegExp",
      },
      {
        path: "/scenarios/response-sequences/",
        title: "Response Sequences",
        summary:
          "Ordered responses for polling and async jobs, with `repeat: 'last' | 'cycle' | 'none'`",
      },
      {
        path: "/scenarios/stateful-mocks/",
        title: "Stateful Mocks",
        summary:
          "Capture values from requests with `captureState` and inject them into later responses with templates",
      },
      {
        path: "/scenarios/state-aware-mocking/",
        title: "State-Aware Mocking",
        summary:
          "`stateResponse` conditions, `afterResponse.setState` transitions, and `match.state`",
      },
      {
        path: "/scenarios/combining-features/",
        title: "Combining Features",
        summary: "Matching, sequences, and state together in one workflow",
      },
      {
        path: "/scenarios/typescript-patterns/",
        title: "TypeScript Patterns",
        summary:
          "`as const satisfies ScenaristScenarios` for type-safe scenario IDs and autocomplete",
      },
    ],
  },
  {
    heading: "Testing",
    pages: [
      {
        path: "/testing/playwright-integration/",
        title: "Playwright Integration",
        summary:
          "`withScenarios` fixtures, `switchScenario`, `debugState`, `waitForDebugState`, and endpoint configuration",
      },
      {
        path: "/testing/parallel-testing/",
        title: "Parallel Testing",
        summary:
          "How test ID isolation lets concurrent tests use different scenarios against one server",
      },
      {
        path: "/testing/best-practices/",
        title: "Testing Best Practices",
        summary:
          "Organising scenarios, one switch per test, and anti-patterns to avoid",
      },
      {
        path: "/guides/testing-database-apps/",
        title: "Testing Apps with Database Access",
        summary:
          "Scenarist cannot intercept database calls; the repository pattern and Testcontainers options",
      },
    ],
  },
  {
    heading: "Reference",
    pages: [
      {
        path: "/reference/api-endpoints/",
        title: "Endpoint APIs",
        summary:
          "Request and response shapes for the scenario switch, status, and debug state endpoints",
      },
      {
        path: "/reference/ephemeral-endpoints/",
        title: "Ephemeral Endpoints",
        summary:
          "Why the scenario endpoints exist only when Scenarist is enabled, and how test ID isolation works",
      },
      {
        path: "/reference/errors/",
        title: "Error Handling",
        summary: "Error codes and the `errorBehaviors` options",
      },
      {
        path: "/reference/logging/",
        title: "Debugging with Logs",
        summary:
          "`createConsoleLogger` levels, categories, and formats for tracing mock selection",
      },
      {
        path: "/concepts/production-safety/",
        title: "Production Safety",
        summary:
          "How conditional exports keep Scenarist and MSW out of production bundles, and how to verify it",
      },
      {
        path: "/reference/verification/",
        title: "Verification Guide",
        summary: "Checks that confirm Scenarist is wired up correctly",
      },
      {
        path: "/concepts/architecture/",
        title: "Architecture",
        summary: "The framework-agnostic hexagonal core and its adapters",
      },
    ],
  },
];

const renderIndex = (sections: readonly IndexSection[]): string =>
  sections
    .map(({ heading, pages }) =>
      [
        `## ${heading}`,
        "",
        ...pages.map(
          ({ path, title, summary }) =>
            `- [${title}](${SITE_URL}${path}): ${summary}`,
        ),
      ].join("\n"),
    )
    .join("\n\n");

const description =
  "Scenarist is a TypeScript testing library for Node.js apps. Your real server code runs in Playwright or Supertest tests (Express routes, Next.js Server Components, Route Handlers, Server Actions, middleware) while every external HTTP API it calls returns the response defined by the scenario that test selected. Tests switch scenarios at runtime by test ID, so parallel tests get different backend states from one running server. Built on MSW (Mock Service Worker). MIT licensed.";

const keyFacts = `Packages. Install one adapter plus \`msw\` (a required peer dependency). Import everything, including types, from the adapter; do not install \`@scenarist/core\` directly.

- \`@scenarist/express-adapter\`: Express \`^4.18 || ^5\`
- \`@scenarist/nextjs-adapter\`: Next.js \`^14 || ^15 || ^16\`. Import from \`@scenarist/nextjs-adapter/app\` (App Router) or \`@scenarist/nextjs-adapter/pages\` (Pages Router)
- \`@scenarist/playwright-helpers\`: Playwright fixtures (dev dependency)

How a test runs:

1. Scenarios are plain data: an object keyed by scenario ID, declared \`as const satisfies ScenaristScenarios\`. It must contain a \`default\` key.
2. \`createScenarist({ enabled, scenarios })\` returns the instance, or \`undefined\` when the bundler resolves the \`production\` export condition.
3. Each test gets a unique test ID. \`switchScenario(page, 'scenarioId')\` POSTs \`{ scenario }\` to the scenario endpoint with the \`x-scenarist-test-id\` header, and adds that header to every request the page makes.
4. MSW intercepts the server's outgoing HTTP requests. The test ID picks the active scenario. For any method and URL the active scenario does not cover, the \`default\` scenario's mocks apply. When the active scenario has a mock without \`match\` criteria for that method and URL, the default's mocks for it are ignored; when it has only mocks with \`match\` criteria, the default's mocks stay available as a fallback.

Rules that are easy to get wrong:

- Scenarios are declarative. Never put functions or callbacks in a scenario. Use \`match\`, \`sequence\`, \`captureState\` with \`{{state.key}}\` templates, \`stateResponse\`, and \`afterResponse\` instead.
- A mock is \`{ method, url, match?, response | sequence | stateResponse, captureState?, afterResponse? }\`, with at most one of \`response\`, \`sequence\`, or \`stateResponse\`. \`url\` accepts an exact URL, path-to-regexp v6 parameters such as \`:id\`, \`:id?\`, and \`:path+\`, or a RegExp. Glob wildcards such as \`/api/*\` are not supported.
- Selection: a mock whose \`match\` criteria pass beats a mock without criteria, and more specific criteria win (each matched body, header, query, or state key adds to the score). Among mocks without criteria, one with a \`sequence\` or \`stateResponse\` beats a plain \`response\`; within the same kind, the last one wins.
- Next.js: create the instance once at module level (\`export const scenarist = createScenarist(...)\`) and import it wherever you need it. The adapter caches the first instance on \`globalThis\`, because Next.js can load the same module more than once; later calls return that cached instance and ignore their options.
- Next.js: run scenario tests against \`next dev\`, which both example apps start from the Playwright \`webServer\` config with \`next dev --webpack\`. \`next build\` resolves the \`production\` export condition, so against \`next start\` the scenario route answers 405 and \`switchScenario\` throws. Next.js replaces \`process.env.NODE_ENV\` in server code with \`'development'\` or \`'production'\`, so do not gate \`enabled\` on \`process.env.NODE_ENV === 'test'\`; the example apps pass \`enabled: true\`.
- Next.js: forward the test ID on every outgoing \`fetch\`. Spread \`getScenaristHeaders(request)\` in Route Handlers and API routes, or \`getScenaristHeadersFromReadonlyHeaders(await headers())\` in Server Components. Use \`cache: 'no-store'\` on those fetches. Express propagates the test ID automatically once \`app.use(scenarist.middleware)\` is registered before your routes.
- Next.js App Router serves the scenario endpoint from \`app/api/%5F%5Fscenario%5F%5F/route.ts\`, which exports \`POST\` and \`GET\` as \`scenarist?.createScenarioEndpoint()\` (optional chaining, because the instance is \`undefined\` in production builds). The encoded underscores are needed because Next.js excludes folders that start with \`_\` from routing. The URL is \`/api/__scenario__\`, which is the Playwright helpers' default \`scenaristEndpoint\`. The debug state route follows the same pattern at \`/api/__scenarist__/state\`, so set \`scenaristStateEndpoint: '/api/__scenarist__/state'\` in the Playwright \`use\` config. Express serves \`/__scenario__\` and \`/__scenarist__/state\`, so Express projects set \`scenaristEndpoint: '/__scenario__'\`.
- In Playwright, import \`test\` and \`expect\` from your own fixtures file (\`export const test = withScenarios(scenarios)\`), not from \`@playwright/test\`. Calls made with \`page.request\` do not carry the test ID automatically; pass the ID that \`switchScenario\` returns in an \`x-scenarist-test-id\` header.
- Scenarist mocks HTTP requests made by the server process. It cannot mock database drivers, the file system, or WebSocket traffic.
- Unmocked requests pass through to the real network unless \`strictMode: true\`, which answers them with \`501\`.`;

export const llmsTxtOptions = {
  projectName: "Scenarist",
  description,
  details: `${keyFacts}\n\n${renderIndex(index)}`,
  customSets: [
    {
      label: "Getting started and concepts",
      description:
        "installation, quick start, how Scenarist works, philosophy, production safety, and architecture",
      paths: ["getting-started/**", "concepts/**"],
    },
    {
      label: "Writing scenarios",
      description:
        "every scenario feature: structure, defaults, request and pattern matching, sequences, stateful and state-aware mocks",
      paths: ["scenarios/**"],
    },
    {
      label: "Express",
      description: "setting up and testing Express apps",
      paths: ["frameworks/express", "frameworks/express/**"],
    },
    {
      label: "Next.js App Router",
      description:
        "setting up Next.js App Router and testing React Server Components, streaming, Server Actions, and auth flows",
      paths: [
        "frameworks/nextjs",
        "frameworks/nextjs-app-router",
        "frameworks/nextjs-app-router/**",
      ],
    },
    {
      label: "Next.js Pages Router",
      description:
        "setting up Next.js Pages Router with API routes and getServerSideProps",
      paths: [
        "frameworks/nextjs",
        "frameworks/nextjs-pages-router",
        "frameworks/nextjs-pages-router/**",
      ],
    },
    {
      label: "Testing and reference",
      description:
        "Playwright integration, parallel testing, best practices, database apps, endpoint and error reference, logging, and verification",
      paths: ["testing/**", "guides/**", "reference/**"],
    },
    {
      label: "Comparisons",
      description:
        "how Scenarist compares with MSW, WireMock, Nock, Testcontainers, and Playwright route mocking",
      paths: ["comparison", "comparison/**"],
    },
  ],
  optionalLinks: [
    {
      label: "GitHub repository",
      url: "https://github.com/citypaul/scenarist",
      description: "source code, issues, and changelogs",
    },
    {
      label: "Express example app",
      url: "https://github.com/citypaul/scenarist/tree/main/apps/express-example",
      description: "complete Express app with Supertest scenario tests",
    },
    {
      label: "Next.js App Router example app",
      url: "https://github.com/citypaul/scenarist/tree/main/apps/nextjs-app-router-example",
      description: "complete App Router app with Playwright scenario tests",
    },
    {
      label: "Next.js Pages Router example app",
      url: "https://github.com/citypaul/scenarist/tree/main/apps/nextjs-pages-router-example",
      description: "complete Pages Router app with Playwright scenario tests",
    },
    {
      label: "Roadmap",
      url: `${SITE_URL}/roadmap/`,
      description: "planned features",
    },
  ],
  promote: [
    "getting-started/quick-start",
    "getting-started/installation",
    "getting-started/**",
    "concepts/how-it-works",
    "concepts/philosophy",
    "scenarios/overview",
    "scenarios/basic-structure",
    "scenarios/default-scenarios",
    "scenarios/**",
    "frameworks/**",
    "testing/**",
  ],
  demote: ["comparison/**", "comparison", "roadmap"],
  exclude: ["comparison", "comparison/**", "roadmap"],
  // Starlight's heading anchor links would otherwise add "Section titled" noise to every heading.
  customSelectors: { all: [".sl-anchor-link"] },
} satisfies LlmsTxtOptions;
