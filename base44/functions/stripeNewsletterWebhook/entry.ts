import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

function mappedStatus(subscription) {
  if (subscription.status === 'canceled') return 'cancelled';
  if (subscription.cancel_at_period_end && ['active', 'trialing'].includes(subscription.status)) return 'cancelling';
  if (['active', 'trialing'].includes(subscription.status)) return 'active';
  if (subscription.status === 'past_due' || subscription.status === 'unpaid') return 'past_due';
  return 'pending';
}

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const signature = req.headers.get('stripe-signature');
    if (!stripeKey || !webhookSecret || !signature) {
      return Response.json({ error: 'Webhook is not configured.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const event = await stripe.webhooks.constructEventAsync(await req.text(), signature, webhookSecret);
    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
      if (email && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        const existing = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email }))?.[0];
        const record = {
          email,
          user_id: session.client_reference_id || session.metadata?.base44_user_id || '',
          name: session.metadata?.name || '',
          stripe_customer_id: String(session.customer || ''),
          stripe_subscription_id: subscription.id,
          status: mappedStatus(subscription),
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        };
        if (existing?.id) await base44.asServiceRole.entities.NewsletterSubscription.update(existing.id, record);
        else await base44.asServiceRole.entities.NewsletterSubscription.create(record);
      }
    }

    if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
      const subscription = event.data.object;
      const record = (await base44.asServiceRole.entities.NewsletterSubscription.filter({
        stripe_customer_id: String(subscription.customer),
      }))?.[0];
      if (record?.id) {
        await base44.asServiceRole.entities.NewsletterSubscription.update(record.id, {
          stripe_subscription_id: subscription.id,
          status: mappedStatus(subscription),
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : record.current_period_end,
        });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const record = (await base44.asServiceRole.entities.NewsletterSubscription.filter({
        stripe_customer_id: String(invoice.customer),
      }))?.[0];
      if (record?.id) await base44.asServiceRole.entities.NewsletterSubscription.update(record.id, { status: 'past_due' });
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Webhook processing failed.' }, { status: 400 });
  }
});
