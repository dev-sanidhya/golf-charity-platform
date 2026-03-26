import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  }
  return _stripe
}

// Keep named export for backward-compat — resolves lazily
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PLANS = {
  monthly: {
    name: 'Monthly',
    price: 19.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    interval: 'month' as const,
  },
  yearly: {
    name: 'Yearly',
    price: 179.99,
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    interval: 'year' as const,
    savings: '25%',
  },
}

// Prize pool: fixed % of subscription goes to prize pool
export const PRIZE_POOL_PERCENTAGE = 0.3 // 30% of subscription fee
export const CHARITY_MIN_PERCENTAGE = 0.1 // 10% minimum charity contribution
