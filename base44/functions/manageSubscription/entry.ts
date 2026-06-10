import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Sends "sorry to see you go" email with feedback ask
async function sendCancellationEmail(base44, email, name) {
  const firstName = name ? name.split(' ')[0] : 'there';
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: email,
    subject: 'Sorry to see you go — Keystone Macro',
    from_name: 'Keystone Macro',
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <div style="font-size:10px;letter-spacing:3px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:24px;">Keystone Macro</div>
    <div style="font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:16px;font-family:Georgia,'Times New Roman',serif;">Sorry to see you go, ${firstName}.</div>
    <div style="font-size:15px;color:#475569;line-height:1.8;margin-bottom:24px;">
      Your subscription has been cancelled and you won't receive any further emails from us. We're genuinely sorry to lose you.
    </div>
    <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:24px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px;">One quick question, if you don't mind:</div>
      <div style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:16px;">What made you decide to cancel? Your feedback helps us improve — even a sentence means a lot.</div>
      <a href="mailto:hello@keystonemacro.com?subject=Cancellation%20Feedback" style="display:inline-block;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Reply with Feedback</a>
    </div>
    <div style="font-size:14px;color:#475569;line-height:1.8;margin-bottom:8px;">If you ever want to come back, we'll be here.</div>
    <a href="https://keystonemacro.com/Newsletter" style="font-size:13px;color:#d97706;text-decoration:none;font-weight:600;">Resubscribe at any time &rarr;</a>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <span style="font-size:11px;color:#94a3b8;">Keystone Macro &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence</span>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Support GET for email unsubscribe links: ?action=cancel&email=...&token=...
    const action = body.action || url.searchParams.get('action');
    const email = body.email || url.searchParams.get('email');

    if (!action || !email) {
      return Response.json({ error: 'Missing action or email' }, { status: 400 });
    }

    if (action === 'cancel') {
      // Find in free list (NewsletterSubscriber)
      const freeSubs = await base44.asServiceRole.entities.NewsletterSubscriber.filter({ email });
      if (freeSubs?.length > 0) {
        await base44.asServiceRole.entities.NewsletterSubscriber.update(freeSubs[0].id, { status: 'unsubscribed' });
        await sendCancellationEmail(base44, email, freeSubs[0].name);
        return Response.json({ success: true, type: 'free', message: 'Unsubscribed from free newsletter' });
      }

      // Find in paid list (NewsletterSubscription)
      const paidSubs = await base44.asServiceRole.entities.NewsletterSubscription.filter({ email });
      if (paidSubs?.length > 0) {
        const sub = paidSubs[0];

        // Cancel Stripe subscription if present
        if (sub.stripe_subscription_id) {
          const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
          if (stripeKey) {
            const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
            await stripe.subscriptions.cancel(sub.stripe_subscription_id).catch(() => {});
          }
        }

        await base44.asServiceRole.entities.NewsletterSubscription.update(sub.id, { status: 'cancelled' });
        await sendCancellationEmail(base44, email, sub.name);
        return Response.json({ success: true, type: 'paid', message: 'Subscription cancelled' });
      }

      return Response.json({ error: 'No subscription found for that email' }, { status: 404 });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});