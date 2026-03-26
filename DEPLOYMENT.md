# GolfGives — Deployment Guide

## Stack
- **Frontend/Backend**: Next.js 14 (App Router)
- **Database + Auth**: Supabase
- **Payments**: Stripe
- **Deployment**: Vercel

---

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a **new project** (new account as required)
2. In the SQL Editor, paste and run the entire contents of `supabase/schema.sql`
3. After running, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

4. Create admin user:
   - Go to **Authentication → Users → Add User**
   - Email: `admin@golfcharity.com` | Password: `Admin@1234` (change this!)
   - Then run in SQL Editor: `UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@golfcharity.com';`

---

## Step 2: Stripe Setup

1. Go to [stripe.com](https://stripe.com) and create a **new account**
2. In the Dashboard (test mode):
   - Go to **Products → Add Product**
   - Create **Monthly Plan**: £19.99/month recurring → copy Price ID → `STRIPE_MONTHLY_PRICE_ID`
   - Create **Yearly Plan**: £179.99/year recurring → copy Price ID → `STRIPE_YEARLY_PRICE_ID`
3. Go to **Developers → API Keys**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and create a **new account**
2. Import this repository (push to GitHub first)
3. Add all environment variables from `.env.local` (real values, not placeholders)
4. Deploy — Vercel will auto-detect Next.js

5. After deployment, go to Stripe **Developers → Webhooks → Add Endpoint**:
   - URL: `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy Webhook Signing Secret → `STRIPE_WEBHOOK_SECRET`
   - Update this env var in Vercel and redeploy

---

## Step 4: Configure App URL

Update `NEXT_PUBLIC_APP_URL` in Vercel to your actual deployment URL.

---

## Test Credentials

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@golfcharity.com    | Admin@1234  |
| User  | Create via signup flow   | Any         |

---

## Stripe Test Cards

| Card             | Number              | Use                  |
|------------------|---------------------|----------------------|
| Success          | 4242 4242 4242 4242 | Successful payment   |
| Auth Required    | 4000 0025 0000 3155 | 3D Secure            |
| Declined         | 4000 0000 0000 9995 | Card declined        |

Use any future expiry date and any 3-digit CVC.

---

## Environment Variables Reference

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```
