import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getCaller, signInRequired, limitRequests } from '../../shared/requestSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getCaller(base44);
    if (!user) return signInRequired();
    const data = await req.json().catch(() => ({}));
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const subject = typeof data.subject === 'string' ? data.subject.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    const type = typeof data.type === 'string' ? data.type : 'general';
    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || subject.length > 200 || /[\r\n]/.test(name + email + subject) || !message || message.length > 10000) {
      return Response.json({ error: 'Please provide a valid name, email and message.' }, { status: 400 });
    }

    const typeLabels = {
      general: 'General Inquiry',
      collaboration: 'Collaboration',
      'early-careers': 'Early Careers & Contributing',
      media: 'Media / Speaking',
      speaking: 'Career Opportunity',
    };

    if (!Object.hasOwn(typeLabels, type)) return Response.json({ error: 'Invalid message type.' }, { status: 400 });
    const limited = await limitRequests(base44, user, 'contact', { minute: 1, day: 5 });
    if (limited) return limited;
    await base44.asServiceRole.entities.ContactMessage.create({ name, email, subject, message, type, status: 'new' });
    const typeLabel = typeLabels[type];
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
      text: body,
      category: 'transactional',
      from_name: 'Keystone Macro Contact',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}