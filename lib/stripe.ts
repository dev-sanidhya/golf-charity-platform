import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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
