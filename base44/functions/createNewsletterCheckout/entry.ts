import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

function getSafeOrigin(req: Request) {
  const fallback = 'https://keystonemacro.com';
  const raw = req.headers.get('origin') || req.headers.get('referer') || fallback;
  try {
    const origin = new URL(raw).origin;
    const host = new URL(origin).hostname;
    if (host === 'keystonemacro.com' || host === 'www.keystonemacro.com' || host.endsWith('.base44.app')) {
      return origin;
    }
  } catch (_) {}
  return fallback;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) {
      return Response.json({ error: 'Sign in before subscribing.' }, { status: 401 });
    }

    const { name } = await req.json().catch(() => ({}));
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const existingRecords = await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email });
    const existing = existingRecords?.[0];

    if (existing?.status === 'active' || existing?.status === 'cancelling') {
      return Response.json({ error: 'This account already has premium access.' }, { status: 409 });
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0] || await stripe.customers.create({
      email: user.email,
      name: name || user.full_name || undefined,
      metadata: { base44_user_id: user.id },
    });

    const origin = getSafeOrigin(req);
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'The Keystone Macro Brief',
            description: 'Morning and evening subscriber editions, Monday to Friday, with full archive access.',
          },
          unit_amount: 999,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/Newsletter?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Newsletter?checkout=cancelled`,
      customer_update: { address: 'auto' },
      metadata: {
        email: user.email,
        name: name || user.full_name || '',
        base44_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          email: user.email,
          base44_user_id: user.id,
        },
      },
    });

    const record = {
      email: user.email,
      user_id: user.id,
      name: name || user.full_name || '',
      stripe_customer_id: customer.id,
      status: 'pending',
    };

    if (existing?.id) {
      await base44.asServiceRole.entities.NewsletterSubscription.update(existing.id, record);
    } else {
      await base44.asServiceRole.entities.NewsletterSubscription.create(record);
    }

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to create checkout.' }, { status: 500 });
  }
});