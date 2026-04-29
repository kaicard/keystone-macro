import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name } = await req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({ email, name: name || undefined });
    }

    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';

    // Create checkout session with $19.99/month recurring
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'The Keystone Macro Brief',
              description: '10 editions per week (Mon-Fri). Morning brief at 7am + Evening wrap at 10pm. Institutional-grade macro research, market analysis, trade ideas, and geopolitical intelligence. Full archive access included.',
            },
            unit_amount: 999, // £9.99
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/Newsletter?subscribed=true`,
      cancel_url: `${appUrl}/Newsletter`,
      customer_update: { address: 'auto' },
      metadata: { email, name: name || '' },
    });

    // Update subscriber record with Stripe customer ID
    const subscribers = await base44.asServiceRole.entities.NewsletterSubscription.filter({ email });
    if (subscribers.length > 0) {
      await base44.asServiceRole.entities.NewsletterSubscription.update(subscribers[0].id, {
        stripe_customer_id: customer.id,
        status: 'pending',
      });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});