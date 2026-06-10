import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { email, name, type } = body; // type: 'free' | 'paid'

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const firstName = name ? name.split(' ')[0] : null;
    const isPaid = type === 'paid';

    const subject = isPaid
      ? `Welcome to Keystone Macro Premium, ${firstName}`
      : `You're on the list — Keystone Macro Weekly`;

    const bodyHtml = isPaid ? `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <div style="font-size:10px;letter-spacing:3px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:24px;">Keystone Macro · Premium</div>
    <div style="font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:16px;font-family:Georgia,'Times New Roman',serif;">${firstName ? `Welcome, ${firstName}.` : 'Welcome.'}</div>
    <div style="font-size:15px;color:#475569;line-height:1.8;margin-bottom:24px;">
      Your Keystone Macro Premium subscription is now active. Here's what you have access to:
    </div>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px;">
      ${[
        ['Morning Brief', 'Delivered at 7am every trading day — overnight developments, Asian session, and what to watch'],
        ['Evening Wrap', 'Delivered at 10pm — full-day market review, desk views, and positioning insights'],
        ['Deep-Dive Research', 'Institutional-grade research notes on macro, equities, fixed income, and more'],
        ['Trade Ideas', 'Illustrative ideas with full thesis, entry/exit levels, and risk analysis'],
        ['Keystone AI', 'Ask our macro analyst AI any market question, or generate a custom portfolio allocation'],
        ['Full Archive', 'Every edition and research note ever published, searchable and categorised'],
      ].map(([title, desc]) => `
      <tr><td style="padding-bottom:12px;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
          <tr><td style="padding:14px 16px;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;">${title}</div>
            <div style="font-size:12px;color:#64748b;line-height:1.6;">${desc}</div>
          </td></tr>
        </table>
      </td></tr>`).join('')}
    </table>
    <a href="https://keystonemacro.com" style="display:inline-block;background:#d97706;color:#ffffff;font-size:13px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Go to Keystone Macro &rarr;</a>
    <div style="margin-top:24px;font-size:13px;color:#94a3b8;">
      Questions? Reply to this email — we read every message.<br/>
      <a href="https://keystonemacro.com/Newsletter#manage" style="color:#d97706;text-decoration:none;">Manage subscription</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <span style="font-size:11px;color:#94a3b8;">Keystone Macro &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence</span>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>` : `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <div style="font-size:10px;letter-spacing:3px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:24px;">Keystone Macro Weekly</div>
    <div style="font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:16px;font-family:Georgia,'Times New Roman',serif;">${firstName ? `You're on the list, ${firstName}.` : `You're on the list!`}</div>
    <div style="font-size:15px;color:#475569;line-height:1.8;margin-bottom:24px;">
      Every Friday at 10pm, you'll receive the Keystone Macro Weekly — a free digest covering the biggest market themes of the week, delivered straight to your inbox.
    </div>
    <div style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;padding:20px 22px;margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#92400e;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Want more?</div>
      <div style="font-size:13px;color:#78350f;line-height:1.7;margin-bottom:14px;">Premium subscribers get 10 editions per week — morning briefs, evening wraps, deep-dive research notes, trade ideas, and full Keystone AI access.</div>
      <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:#d97706;color:#ffffff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:7px;text-decoration:none;letter-spacing:0.5px;">Upgrade to Premium &rarr;</a>
    </div>
    <div style="font-size:13px;color:#94a3b8;">
      <a href="https://keystonemacro.com/Newsletter#manage" style="color:#64748b;text-decoration:none;">Unsubscribe at any time</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <span style="font-size:11px;color:#94a3b8;">Keystone Macro &nbsp;·&nbsp; Free Weekly Digest</span>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject,
      body: bodyHtml,
      from_name: 'Keystone Macro',
    });

    return Response.json({ success: true, type: isPaid ? 'paid' : 'free' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});