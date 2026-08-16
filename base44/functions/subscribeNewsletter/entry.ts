import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user?.email) return Response.json({ error: 'Sign in before subscribing.' }, { status: 401 });

    const { name } = await req.json().catch(() => ({}));
    const records = await base44.asServiceRole.entities.NewsletterSubscriber.filter({ email: user.email });
    const existing = records?.[0];
    const record = { email: user.email, name: name || user.full_name || '', status: 'active' };

    if (existing?.id) await base44.asServiceRole.entities.NewsletterSubscriber.update(existing.id, record);
    else await base44.asServiceRole.entities.NewsletterSubscriber.create(record);

    if (!existing || existing.status !== 'active') {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: "You're on the list — Keystone Macro Weekly",
        from_name: 'Keystone Macro',
        body: '<p>Welcome to Keystone Macro Weekly.</p><p>You will receive the free Friday macro digest. You can manage your subscription from your signed-in account.</p><p>— Keystone Macro</p>',
      }).catch(() => {});
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to subscribe.' }, { status: 500 });
  }
});
