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

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

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

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Dashboard routes (sidebar layout)
│   │   ├── page.tsx       # Products page
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout page
│   │   └── orders/        # Order history
│   ├── login/             # Login page
│   └── api/
│       └── checkout/      # Checkout API
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── app-sidebar.tsx    # Main navigation sidebar
│   └── nav-user.tsx       # User menu component
├── contexts/
│   └── auth-context.tsx   # Auth0 integration context
├── hooks/
│   └── use-mobile.ts      # Mobile detection hook
└── lib/
    ├── auth0.ts           # Auth0 client configuration
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
