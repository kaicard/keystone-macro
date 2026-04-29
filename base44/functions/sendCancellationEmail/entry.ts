import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    await resend.emails.send({
      from: 'Keystone Macro <brief@keystonemacro.com>',
      to: email,
      subject: 'Your Keystone Macro subscription has been cancelled',
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <div style="font-size:10px;letter-spacing:2px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Keystone Macro</div>
        <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px;font-family:Georgia,serif;">Subscription Cancelled</h1>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">Your subscription to The Keystone Macro Brief has been cancelled. You will not receive any further editions.</p>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 24px;">If you cancelled by mistake, you can resubscribe at any time at <a href="https://keystonemacro.com/Newsletter" style="color:#d97706;">keystonemacro.com/Newsletter</a>.</p>
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#9ca3af;">Keystone Macro &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence</div>
      </div>`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});