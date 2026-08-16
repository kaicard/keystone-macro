import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

async function sendCancellationEmail(base44, email, paid, periodEnd) {
  const accessText = paid && periodEnd
    ? `Premium access remains available until ${new Date(periodEnd).toLocaleDateString('en-GB')}.`
    : 'You will not receive further free editions.';
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    subject: paid ? 'Your Keystone Macro cancellation is scheduled' : 'You have unsubscribed from Keystone Macro Weekly',
    from_name: 'Keystone Macro',
    body: `<p>Your request has been processed.</p><p>${accessText}</p><p>If this was a mistake, visit <a href="https://keystonemacro.com/Newsletter">Keystone Macro</a>.</p>`,
  }).catch(() => {});
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in to manage your subscription.' }, { status: 401 });

    const { action } = await req.json().catch(() => ({}));
    if (action === 'cancel_free') {
      const record = (await base44.asServiceRole.entities.NewsletterSubscriber.filter({ email: user.email }))?.[0];
      if (!record) return Response.json({ error: 'No free subscription found for this account.' }, { status: 404 });
      await base44.asServiceRole.entities.NewsletterSubscriber.update(record.id, { status: 'unsubscribed' });
      await sendCancellationEmail(base44, user.email, false, null);
      return Response.json({ success: true, type: 'free' });
    }

    if (action === 'cancel_paid') {
      const record = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email }))?.[0];
      if (!record) return Response.json({ error: 'No paid subscription found for this account.' }, { status: 404 });

      let currentPeriodEnd = record.current_period_end || null;
      let status = 'cancelled';
      if (record.stripe_subscription_id) {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) return Response.json({ error: 'Stripe is not configured.' }, { status: 503 });
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
        const subscription = await stripe.subscriptions.update(record.stripe_subscription_id, { cancel_at_period_end: true });
        status = 'cancelling';
        currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : currentPeriodEnd;
      }
      await base44.asServiceRole.entities.NewsletterSubscription.update(record.id, {
        status,
        current_period_end: currentPeriodEnd,
      });
      await sendCancellationEmail(base44, user.email, true, currentPeriodEnd);
      return Response.json({ success: true, type: 'paid', status, current_period_end: currentPeriodEnd });
    }

    return Response.json({ error: 'Unknown subscription action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to manage subscription.' }, { status: 500 });
  }
});
