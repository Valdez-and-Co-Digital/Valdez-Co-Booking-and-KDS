import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
  appInfo: {
    name: 'SwiftKDS',
    version: '1.0.0',
    url: 'https://swiftkds.com',
  },
});

/** Platform fee percentage (1%) */
export const PLATFORM_FEE_PERCENT = 0.01;

/** Calculate application fee in cents */
export function calculatePlatformFee(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_PERCENT);
}

/** Format cents as currency string */
export function formatCents(cents: number, currency = 'USD'): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency,
  });
}
