import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ authenticated: false, active: false });

    const records = await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email });
    const record = records?.[0];
    if (!record) return Response.json({ authenticated: true, active: false });

    if (['active', 'cancelling'].includes(record.status)) {
      return Response.json({
        authenticated: true,
        active: true,
        status: record.status,
        current_period_end: record.current_period_end || null,
      });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey || !record.stripe_customer_id) {
      return Response.json({ authenticated: true, active: false, status: record.status });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const subscriptions = await stripe.subscriptions.list({ customer: record.stripe_customer_id, status: 'all', limit: 10 });
    const subscription = subscriptions.data.find((item) => ['active', 'trialing'].includes(item.status));
    if (!subscription) return Response.json({ authenticated: true, active: false, status: record.status });

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

    return Response.json({ authenticated: true, active: true, status, current_period_end: currentPeriodEnd });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to verify access.' }, { status: 500 });
  }
});
