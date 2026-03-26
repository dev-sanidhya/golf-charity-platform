# Golf Charity Platform

A subscription-based golf platform where players submit Stableford scores, enter monthly prize draws, and direct part of their subscription to a charity of their choice.

Live deployment: https://golf-charity-platform-flame-iota.vercel.app

## Overview

This project combines:

- a public marketing site for the product
- Supabase authentication and profile management
- Stripe-powered monthly and yearly subscriptions
- a member dashboard for score submission, draw participation, and charity preferences
- an admin area for user management, charity management, draw publishing, and winner verification

The app is built with Next.js App Router and uses Supabase as the backing database and auth provider.

## Core User Flow

1. A visitor signs up and creates an account.
2. During signup they choose a charity and a contribution percentage.
3. They choose a monthly or yearly subscription plan.
4. Stripe Checkout creates and manages the subscription.
5. Once active, the user can submit up to 5 rolling Stableford scores.
6. Those scores are used for monthly draw participation.
7. Admins can simulate or publish a draw and review winning entries.

## Feature Set

### Public pages

- `/` landing page with product positioning, prize pool explanation, and charity messaging
- `/how-it-works` explainer page
- `/charities` charity listing page
- `/pricing` monthly/yearly plans with Stripe checkout
- `/signup` multi-step signup flow
- `/login` login page

### Member experience

- authenticated dashboard at `/dashboard`
- view subscription status and renewal date
- submit Stableford scores from 1 to 45
- rolling scorecard that keeps only the latest 5 scores
- see latest published draw numbers
- review draw history and winnings
- choose or update supported charity
- adjust charity contribution percentage

### Admin experience

- protected admin panel at `/admin`
- overview metrics for users, subscribers, prize pool, and charity total
- activate/deactivate subscriptions manually
- simulate random or algorithmic draws
- publish monthly draws
- add, feature, and deactivate charities
- review winners and mark payments as paid or rejected

## Tech Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Stripe Checkout + Billing Portal + Webhooks
- Vercel deployment

## Project Structure

```text
app/
  api/
    admin/stats/
    charities/
    draws/
    scores/
    subscriptions/
    webhooks/stripe/
  admin/
  charities/
  dashboard/
  how-it-works/
  login/
  pricing/
  signup/
components/
lib/
supabase/
types/
```

## Important Application Logic

### Scores

- valid score range is `1-45`
- only the latest 5 scores are retained per user
- users must have an active subscription to submit scores

### Prize pools

The current prize pool logic uses `30%` of subscription revenue for the prize pool:

- `40%` of the prize pool for 5-number matches
- `35%` of the prize pool for 4-number matches
- `25%` of the prize pool for 3-number matches

There is also a minimum charity contribution of `10%`.

### Draw modes

- `random`: generates 5 unique numbers between 1 and 45
- `algorithmic`: generates 5 unique numbers with weighting based on submitted score frequency

## API Routes

### Public or semi-public

- `GET /api/charities` returns active charities
- `GET /api/draws` returns published draws

### Authenticated user routes

- `GET /api/scores` fetch current user's latest scores
- `POST /api/scores` add a score
- `DELETE /api/scores` remove a score
- `POST /api/subscriptions/checkout` create Stripe Checkout session
- `POST /api/subscriptions/portal` create Stripe Billing Portal session

### Admin routes

- `GET /api/admin/stats` fetch admin dashboard metrics
- `POST /api/charities` create a charity
- `PATCH /api/charities` update a charity
- `POST /api/draws` simulate or publish a draw

### Stripe webhook

- `POST /api/webhooks/stripe` handles subscription lifecycle events

Handled events include:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Database

The Supabase schema lives in `supabase/schema.sql`.

Main tables:

- `profiles`
- `scores`
- `charities`
- `draws`
- `draw_results`
- `charity_contributions`

The schema also includes:

- row-level security policies
- profile creation trigger on auth signup
- `updated_at` trigger for profiles
- seed charities

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set:

```env
NEXT_PUBLIC_APP_URL=https://golf-charity-platform-flame-iota.vercel.app
```

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy the project URL and API keys into `.env.local`.

### 3. Configure Stripe

1. Create monthly and yearly recurring products in Stripe.
2. Copy the publishable key, secret key, and price IDs into `.env.local`.
3. Add a webhook endpoint pointing to:

```text
https://golf-charity-platform-flame-iota.vercel.app/api/webhooks/stripe
```

For local testing, you can also point Stripe CLI forwarding to:

```text
http://localhost:3000/api/webhooks/stripe
```

### 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Deployment

This project is deployed on Vercel:

- Production URL: https://golf-charity-platform-flame-iota.vercel.app

Deployment requirements:

1. Import the repository into Vercel.
2. Add all environment variables from `.env.local`.
3. Set `NEXT_PUBLIC_APP_URL` to the production URL.
4. Configure the Stripe webhook to the production webhook endpoint.
5. Redeploy after webhook secrets or Stripe keys change.

## Admin Setup

To create an admin:

1. Create the user through Supabase Auth.
2. Run this SQL in Supabase:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@golfcharity.com';
```

Update the email to the correct admin account if needed.

## Scripts

- `npm run dev` start local development server
- `npm run build` build for production
- `npm run start` run the production build
- `npm run lint` run linting

## Notes

- Route protection for `/dashboard` and `/admin` is handled in `middleware.ts`.
- Stripe subscription state is synchronized back into Supabase through the webhook route.
- The separate deployment guide has been removed and merged into this README so setup and deployment live in one place.
