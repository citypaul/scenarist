# Fake API (json-server)

This directory contains a simple json-server setup that acts as a **real backend** for the Next.js example app.

## Purpose

The fake API serves as a **realistic testing environment** where Scenarist demonstrates its ability to override real backends, not just work in isolation.

## Architecture

```
┌─────────────────────┐
│   Next.js App       │
│  (localhost:3000)   │
└──────────┬──────────┘
           │
           │ Makes HTTP requests
           │
           ▼
┌─────────────────────┐     ┌──────────────────────┐
│   Scenarist MSW     │────▶│   json-server        │
│   (intercepts)      │     │   (localhost:3001)   │
└─────────────────────┘     └──────────────────────┘
           │
           │ Returns mocked response
           │ (Scenarist overrides json-server)
           ▼
┌─────────────────────┐
│   Playwright Test   │
└─────────────────────┘
```

## Running json-server

```bash
# Install json-server (if not already installed)
pnpm add -D json-server

# Start json-server on port 3001
pnpm run fake-api
```

The server will run on `http://localhost:3001` and serve the data from `db.json`.

## Endpoints

- `GET /products` - Returns all products with standard pricing

## Why json-server?

json-server demonstrates what you **lose** without Scenarist:

**Without Scenarist (json-server only):**

- ❌ Static data (can't test premium vs standard pricing)
- ❌ No request matching (can't vary responses based on headers)
- ❌ No sequences (can't test polling scenarios)
- ❌ No stateful behavior (can't test cart accumulation)
- ❌ Slower (real HTTP calls)
- ❌ Requires separate process

**With Scenarist (overrides json-server):**

- ✅ Dynamic responses (premium/standard scenarios)
- ✅ Request matching (based on `x-user-tier` header)
- ✅ Sequences (payment polling)
- ✅ Stateful mocks (shopping cart)
- ✅ Fast (in-memory interception)
- ✅ No extra processes needed in tests

## Value Proposition

This setup proves that Scenarist can **override real backends** in realistic environments, not just work in isolation. Tests run with json-server running in the background, and Scenarist intercepts those requests to provide dynamic, scenario-based responses.
