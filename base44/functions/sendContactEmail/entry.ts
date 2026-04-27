import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, subject, message, type } = await req.json();

    const typeLabels = {
      general: 'General Inquiry',
      collaboration: 'Collaboration',
      media: 'Media / Speaking',
      speaking: 'Career Opportunity',
    };

    const typeLabel = typeLabels[type] || type;
    const emailSubject = subject ? `[${typeLabel}] ${subject}` : `[${typeLabel}] New message from ${name}`;

    const body = `New contact message from keystonemacro.com

From: ${name} <${email}>
Type: ${typeLabel}
${subject ? `Subject: ${subject}\n` : ''}
Message:
${message}

---
Reply directly to: ${email}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'hello@keystonemacro.com',
      subject: emailSubject,
      body,
      from_name: 'Keystone Macro Contact',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});