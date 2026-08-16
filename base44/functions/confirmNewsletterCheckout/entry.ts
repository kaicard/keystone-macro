import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in to confirm checkout.' }, { status: 401 });

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id) return Response.json({ error: 'Missing checkout session.' }, { status: 400 });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return Response.json({ error: 'Stripe is not configured.' }, { status: 503 });

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription', 'customer'] });
    const sessionEmail = session.customer_details?.email || session.customer_email || session.metadata?.email;
    const belongsToUser = session.client_reference_id === user.id || sessionEmail?.toLowerCase() === user.email.toLowerCase();
    if (!belongsToUser || session.mode !== 'subscription') {
      return Response.json({ error: 'This checkout does not belong to your account.' }, { status: 403 });
    }

    const subscription = typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;
    const active = subscription && ['active', 'trialing'].includes(subscription.status);
    if (!active || !['paid', 'no_payment_required'].includes(session.payment_status)) {
      return Response.json({ active: false, status: subscription?.status || session.payment_status });
    }

    const existing = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email }))?.[0];
    const record = {
      email: user.email,
      user_id: user.id,
      name: session.metadata?.name || user.full_name || '',
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: subscription.id,
      status: subscription.cancel_at_period_end ? 'cancelling' : 'active',
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    };
    if (existing?.id) await base44.asServiceRole.entities.NewsletterSubscription.update(existing.id, record);
    else await base44.asServiceRole.entities.NewsletterSubscription.create(record);

    return Response.json({ active: true, status: record.status, current_period_end: record.current_period_end });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to confirm checkout.' }, { status: 500 });
  }
});
