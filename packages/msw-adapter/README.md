# @scenarist/msw-adapter

Framework-agnostic MSW integration for Scenarist.

This package converts serializable `MockDefinition` data into MSW `HttpHandler` instances at runtime.

**Status:** 🚧 In Development

## Features

- URL pattern matching (exact, glob, path parameters)
- Dynamic MSW handler generation
- Response building from MockDefinition
- Framework-agnostic (works with Express, Fastify, Next.js, etc.)

## Internal Package

This is an internal package used by framework adapters. You typically don't install this directly.
Instead, use a framework-specific adapter like `@scenarist/express-adapter`.
