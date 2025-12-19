# PayFlow Demo App

A payment integration dashboard built with Next.js 16, Auth0, and Stripe. This demo showcases scenario-based testing with [Scenarist](https://github.com/citypaul/scenarist).

## Prerequisites

- Node.js 18+
- pnpm, npm, or yarn

## Quick Start

```bash
# Clone and navigate to the demo
cd demo/payflow

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Fill in your credentials (see setup guides below)

# Terminal 1: Start the Inventory Service
npm run inventory

# Terminal 2: Start the Next.js app
pnpm dev

# Terminal 3 (optional): Forward Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Three Services Architecture

PayFlow demonstrates a realistic app with three external services:

1. **Next.js App** (localhost:3000) - The main application
2. **Inventory Service** (localhost:3001) - Internal microservice for promotional offer availability
3. **Stripe** - Payment processing (webhooks via Stripe CLI)

## Environment Variables

All credentials are configured via environment variables. Copy `.env.example` to `.env.local` and fill in your values.

| Variable                             | Description                         | Required     |
| ------------------------------------ | ----------------------------------- | ------------ |
| `AUTH0_DOMAIN`                       | Your Auth0 tenant domain            | Yes          |
| `AUTH0_CLIENT_ID`                    | Auth0 application client ID         | Yes          |
| `AUTH0_CLIENT_SECRET`                | Auth0 application client secret     | Yes          |
| `AUTH0_SECRET`                       | Random string for cookie encryption | Yes          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key              | Yes          |
| `STRIPE_SECRET_KEY`                  | Stripe secret key                   | Yes          |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret       | For webhooks |
| `NEXT_PUBLIC_APP_URL`                | Application URL                     | Yes          |
| `APP_BASE_URL`                       | Application URL for Auth0           | Yes          |
| `INVENTORY_SERVICE_URL`              | Inventory API URL (default: 3001)   | No           |

## Service Setup Guides

### Auth0 Setup

1. **Create a free Auth0 account**
   - Go to [https://auth0.com/signup](https://auth0.com/signup)
   - Sign up for a free account

2. **Create a new application**
   - In the Auth0 Dashboard, go to **Applications > Applications**
   - Click **Create Application**
   - Name it "PayFlow" and select **Regular Web Applications**
   - Click **Create**

3. **Configure the application**
   - Go to the **Settings** tab
   - Add these URLs to **Allowed Callback URLs**:
     ```
     http://localhost:3000/auth/callback
     ```
   - Add these URLs to **Allowed Logout URLs**:
     ```
     http://localhost:3000
     ```
   - Add these URLs to **Allowed Web Origins**:
     ```
     http://localhost:3000
     ```
   - Click **Save Changes**

4. **Get your credentials**
   - Copy **Domain** (e.g., `your-tenant.us.auth0.com`)
   - Copy **Client ID**
   - Copy **Client Secret**

5. **Generate AUTH0_SECRET**

   ```bash
   openssl rand -hex 32
   ```

6. **Add to `.env.local`**
   ```
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=your-generated-secret
   ```

### Stripe Setup

1. **Create a free Stripe account**
   - Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
   - Sign up for a free account

2. **Get your API keys**
   - In the Stripe Dashboard, go to **Developers > API keys**
   - Copy the **Publishable key** (the one safe to expose client-side)
   - Copy the **Secret key** (keep this server-side only)

3. **Add to `.env.local`**

   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
   STRIPE_SECRET_KEY=your_secret_key
   ```

4. **(Optional) Set up webhooks for payment events**
   - Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Click **Add endpoint** (or **Add destination** in newer UI)
   - Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
   - Select events to listen for (e.g., `checkout.session.completed`)
   - After creating, click on the endpoint and reveal the **Signing secret**
   - Add to `.env.local`:
     ```
     STRIPE_WEBHOOK_SECRET=your_signing_secret
     ```

   **For local development**, use Stripe CLI instead:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Test Mode vs Live Mode

**Test Mode (Development)**

- Use test API keys from Stripe Dashboard
- Use test card numbers (e.g., `4242 4242 4242 4242`)
- No real charges are made

**Live Mode (Production)**

- Requires completing Stripe account verification
- Use live API keys
- Real payments are processed

### Inventory Service (Promotional Offers)

The Inventory Service represents an internal microservice that your team consumes but doesn't own—the kind of service that has no "test mode" or special tooling for testing.

For this demo, it tracks **promotional offer availability**:

- **Launch pricing** (Pro Plan) - Limited slots at a special introductory price
- **Founding member spots** (Enterprise Plan) - Exclusive early adopter pricing

When slots run out, the offer ends and the product shows "Offer Ended" instead of being purchasable at the promotional price.

We simulate this service using [json-server](https://github.com/typicode/json-server).

**Starting the service:**

```bash
npm run inventory
```

This starts json-server on port 3001, serving data from `db.json`.

**Endpoints:**

| Endpoint             | Description                 |
| -------------------- | --------------------------- |
| `GET /inventory`     | List all offer availability |
| `GET /inventory/:id` | Get specific offer by ID    |

**Sample response:**

```json
{
  "id": "2",
  "productId": "2",
  "quantity": 15,
  "reserved": 0
}
```

The app calculates `available = quantity - reserved` to determine offer status:

- `available > 20`: "available" (no urgency badge)
- `available <= 20`: "limited_offer" (shows "X left at this price")
- `available <= 0`: "offer_ended" (cannot purchase at promotional price)

**Why this matters for testing:**

Unlike Stripe (which has test cards) or Auth0 (which you can configure), internal microservices often have:

- No test mode
- Shared state across tests
- No way to simulate edge cases (offer ended, service errors, etc.)

**The killer scenario:** How do you test "offer ends during checkout"—where the user adds a product to cart, but the promotional slots sell out before they complete payment? Without Scenarist, this is essentially impossible to test reliably.

This is exactly what [Scenarist](https://github.com/citypaul/scenarist) solves.

## Project Structure

```
├── db.json                 # Promotional offer data (json-server)
└── src/
    ├── app/
    │   ├── (dashboard)/       # Dashboard routes (sidebar layout)
    │   │   ├── page.tsx       # Products page (with offer badges)
    │   │   ├── cart/          # Shopping cart
    │   │   ├── checkout/      # Checkout page (with offer verification)
    │   │   └── orders/        # Order history
    │   ├── login/             # Login page
    │   └── api/
    │       ├── checkout/      # Checkout API (verifies offer availability)
    │       ├── inventory/     # Inventory/offer proxy API
    │       ├── orders/        # Orders API
    │       └── webhooks/      # Stripe webhooks
    ├── components/
    │   ├── ui/                # shadcn/ui components
    │   ├── app-sidebar.tsx    # Main navigation sidebar
    │   └── nav-user.tsx       # User menu component
    ├── contexts/
    │   ├── auth-context.tsx   # Auth0 integration context
    │   └── cart-context.tsx   # Shopping cart state
    ├── hooks/
    │   └── use-mobile.ts      # Mobile detection hook
    └── lib/
        ├── auth0.ts           # Auth0 client configuration
        ├── inventory.ts       # Promotional offer service client
        ├── stripe.ts          # Stripe client configuration
        └── utils.ts           # Utility functions
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Auth0 (via @auth0/nextjs-auth0)
- **Payments**: Stripe
- **UI**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Related

- [Scenarist Documentation](https://github.com/citypaul/scenarist)
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
