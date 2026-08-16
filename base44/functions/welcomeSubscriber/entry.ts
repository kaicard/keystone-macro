import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const paid = (await base44.asServiceRole.entities.NewsletterSubscription.filter({ email: user.email }))?.[0];
    const type = paid && ['active', 'cancelling'].includes(paid.status) ? 'paid' : 'free';
    const subject = type === 'paid' ? 'Welcome to The Keystone Macro Brief' : "You're on the list — Keystone Macro Weekly";
    const body = type === 'paid'
      ? '<p>Your premium Keystone Macro subscription is active.</p><p>You now have access to morning and evening editions and the subscriber archive.</p>'
      : '<p>You are subscribed to the free weekly Keystone Macro digest.</p>';

    await base44.asServiceRole.integrations.Core.SendEmail({ to: user.email, subject, body, from_name: 'Keystone Macro' });
    return Response.json({ success: true, type });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to send welcome email.' }, { status: 500 });
  }
});
