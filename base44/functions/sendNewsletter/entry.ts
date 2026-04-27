import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Determine edition type from args passed by the automation
    const body = await req.json().catch(() => ({}));
    const editionType = body.edition_type || 'morning'; // 'morning' or 'evening'

    // Get all active subscribers
    const subscribers = await base44.asServiceRole.entities.NewsletterSubscription.filter({ status: 'active' });

    if (!subscribers || subscribers.length === 0) {
      return Response.json({ message: 'No active subscribers', sent: 0 });
    }

    // Get the latest published edition of this type
    const today = new Date().toISOString().split('T')[0];
    const editions = await base44.asServiceRole.entities.NewsletterEdition.filter(
      { status: 'published', edition_type: editionType },
      '-publish_date',
      1
    );

    const edition = editions?.[0];

    if (!edition) {
      return Response.json({ message: `No published ${editionType} edition found`, sent: 0 });
    }

    // Build email content
    const timeLabel = editionType === 'morning' ? 'Morning Brief' : 'Evening Wrap';
    const subject = `Keystone Macro ${timeLabel} — ${edition.title}`;
    const body_text = `
${edition.title}

${edition.market_summary ? `Market Summary\n${edition.market_summary}\n\n` : ''}${edition.body || ''}

---
Read the full edition: https://keystonemacro.com/Newsletter/${edition.slug}

You're receiving this because you subscribed to Keystone Macro.
    `.trim();

    // Send to each active subscriber
    let sent = 0;
    for (const subscriber of subscribers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: subscriber.email,
        subject,
        body: body_text,
        from_name: 'Keystone Macro',
      });
      sent++;
    }

    return Response.json({ message: `${timeLabel} sent successfully`, sent, edition: edition.title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});