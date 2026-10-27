import Stripe from 'npm:stripe@14.21.0';
import { secrets } from 'base44:runtime';

// Resolves the current user's premium newsletter entitlement, verifying against
// stored status first and falling back to Stripe. Shared by every function that
// needs to gate premium content.
export async function resolvePremiumAccess(base44) {
  const user = await base44.auth.me().catch(() => null);
  if (!user?.email) return { authenticated: false, active: false, user: null };

  const records = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email })) || [];
  if (records.length === 0) return { authenticated: true, active: false, user };

  // Stored access is valid only for an unexpired paid period. Expired or missing
  // dates must be checked with Stripe, including subscriptions that may have renewed.
  const activeRecord = records.find((r) =>
    ['active', 'cancelling'].includes(r.status) && Date.parse(r.current_period_end) > Date.now()
  );
  if (activeRecord) {
    return {
      authenticated: true,
      active: true,
      status: activeRecord.status,
      current_period_end: activeRecord.current_period_end || null,
      user,
    };
  }

  const record = records.find((r) => r.stripe_customer_id) || records[0];

  const stripeKey = secrets.get('STRIPE_SECRET_KEY');
  if (!stripeKey || !record.stripe_customer_id) {
    return { authenticated: true, active: false, status: record.status, user };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const subscriptions = await stripe.subscriptions.list({ customer: record.stripe_customer_id, status: 'all', limit: 10 });
  const subscription = subscriptions.data.find((item) =>
    ['active', 'trialing'].includes(item.status) && item.current_period_end * 1000 > Date.now()
  );
  if (!subscription) return { authenticated: true, active: false, status: record.status, user };

  const status = subscription.cancel_at_period_end ? 'cancelling' : 'active';
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await base44.asServiceRole.entities.NewsletterSubscription.update(record.id, {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    status,
    current_period_end: currentPeriodEnd,
  });

  return { authenticated: true, active: true, status, current_period_end: currentPeriodEnd, user };
}