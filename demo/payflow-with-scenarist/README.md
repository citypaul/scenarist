# PayFlow with Scenarist (Reference Implementation)

This is the complete reference implementation of PayFlow with [Scenarist](https://github.com/citypaul/scenarist) integration. It serves as:

1. **Verification** - Validates everything works before the presentation
2. **Fallback** - A safety net if live coding fails during recording
3. **NPM Validation** - Proves the published npm packages work correctly

The original `demo/payflow/` remains unchanged for Video 2 demonstrations (app without Scenarist).

## Prerequisites

- Node.js 18+
- pnpm

## Quick Start

```bash
# Navigate to this demo
cd demo/payflow-with-scenarist

# Install dependencies (installs Scenarist from npm)
pnpm install

# Terminal 1: Start the Backend Services
pnpm inventory

# Terminal 2: Start the Next.js app
pnpm dev

# Terminal 3: Run Playwright tests
pnpm test
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Four Services Architecture

PayFlow demonstrates a realistic app with four backend services, all running on json-server:

| Service           | Endpoint         | Purpose                            |
| ----------------- | ---------------- | ---------------------------------- |
| User Service      | `/users/current` | Returns membership tier (pro/free) |
| Inventory Service | `/inventory`     | Returns stock levels               |
| Shipping Service  | `/shipping`      | Returns shipping options & rates   |
| Payment Service   | `/payments`      | Processes transactions             |

**Key architectural point:** All four are server-side HTTP calls. The browser never talks to these services directly - only the Next.js server does. This makes them **100% mockable with Scenarist**.

```
Browser → Next.js Server → User Service (/users/current)
                        ├→ Inventory Service (/inventory)
                        ├→ Shipping Service (/shipping)
                        └→ Payment Service (/payments)
```

## Scenarist Integration

This app includes full Scenarist integration with 9 scenarios:

| Scenario                 | User | Inventory     | Shipping    | Payment   |
| ------------------------ | ---- | ------------- | ----------- | --------- |
| `default`                | Pro  | In stock      | All options | Success   |
| `freeUser`               | Free | In stock      | All options | Success   |
| `soldOut`                | Pro  | 0 units       | All options | N/A       |
| `lowStock`               | Pro  | 3 units       | All options | N/A       |
| `expressUnavailable`     | Pro  | In stock      | Standard    | Success   |
| `shippingServiceDown`    | Pro  | In stock      | 500 error   | N/A       |
| `paymentDeclined`        | Pro  | In stock      | All options | Declined  |
| `paymentServiceDown`     | Pro  | In stock      | All options | 500 error |
| `sellsOutDuringCheckout` | Pro  | Sequence 15→0 | All options | N/A       |

### Running Tests

```bash
# Run all Playwright tests
pnpm test

# Run tests with UI
pnpm test:ui
```

### Proving Interception

When tests run with Scenarist, the json-server terminal shows **zero requests**. This proves Scenarist is intercepting the server-side HTTP calls.

## NPM Package Validation

Unlike apps in `apps/`, this demo installs Scenarist from **npm** (not workspace links):

```json
{
  "dependencies": {
    "@scenarist/nextjs-adapter": "^0.4.6",
    "@scenarist/playwright-helpers": "^0.4.6"
  }
}
```

This validates the published packages work correctly before users install them.

## Project Structure

```
├── db.json                 # Backend services data (json-server)
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard routes (sidebar layout)
│   │   │   ├── page.tsx       # Products page
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── checkout/      # Checkout with shipping & payment
│   │   │   └── orders/        # Order history
│   │   └── api/
│   │       ├── user/          # User Service proxy
│   │       ├── inventory/     # Inventory Service proxy
│   │       ├── shipping/      # Shipping Service proxy
│   │       ├── checkout/      # Checkout (calls all services)
│   │       └── orders/        # Orders API
│   ├── contexts/
│   │   ├── auth-context.tsx   # User context (fetches from User Service)
│   │   └── cart-context.tsx   # Shopping cart state
│   ├── instrumentation.ts     # Scenarist setup
│   └── scenarios.ts           # Scenario definitions
└── tests/
    └── scenarios.spec.ts      # Playwright tests for all scenarios
```

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint
```

## Related

- [Scenarist Documentation](https://github.com/citypaul/scenarist)
- [Original PayFlow (without Scenarist)](../payflow/)
- [Promotional Campaign Materials](../../docs/promotional-campaign/)
