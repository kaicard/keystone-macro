import Stripe from 'npm:stripe@14.21.0';

// Resolves the current user's premium newsletter entitlement, verifying against
// stored status first and falling back to Stripe. Shared by every function that
// needs to gate premium content.
export async function resolvePremiumAccess(base44) {
  const user = await base44.auth.me().catch(() => null);
  if (!user?.email) return { authenticated: false, active: false, user: null };

  const records = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email })) || [];
  if (records.length === 0) return { authenticated: true, active: false, user };

  // An email can hold more than one row (e.g. a stale pending row alongside a live
  // subscription). Access is granted if ANY record for this email is active.
  const activeRecord = records.find((r) => ['active', 'cancelling'].includes(r.status));
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

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey || !record.stripe_customer_id) {
    return { authenticated: true, active: false, status: record.status, user };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const subscriptions = await stripe.subscriptions.list({ customer: record.stripe_customer_id, status: 'all', limit: 10 });
  const subscription = subscriptions.data.find((item) => ['active', 'trialing'].includes(item.status));
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