import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildWeeklyEmailHtml({ subject, dateStr, weekRange, marketSnapshot, sections, premiumTeaser }) {

  function snapCard(m) {
    const isPos = String(m.change).startsWith('+');
    const isNeg = String(m.change).startsWith('-');
    const changeColor = isPos ? '#10b981' : isNeg ? '#ef4444' : '#9ca3af';
    const arrow = isPos ? '▲' : isNeg ? '▼' : '–';
    return `<table width="152" cellpadding="0" cellspacing="0" border="0" style="width:152px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      <tr><td width="152" style="padding:14px 12px;vertical-align:top;height:88px;">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;">${m.label}</div>
        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:8px;font-variant-numeric:tabular-nums;">${m.value}</div>
        <div style="font-size:11px;font-weight:700;color:${changeColor};">${arrow}&nbsp;${m.change}</div>
      </td></tr>
    </table>`;
  }

  const snap = (marketSnapshot || []).slice(0, 5);
  const snapshotHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>
        <td style="padding:0 4px 8px 0;">${snapCard(snap[0] || {label:'–',value:'–',change:'–'})}</td>
        <td style="padding:0 4px 8px 4px;">${snapCard(snap[1] || {label:'–',value:'–',change:'–'})}</td>
        <td style="padding:0 0 8px 4px;">${snapCard(snap[2] || {label:'–',value:'–',change:'–'})}</td>
      </tr>
      <tr>
        <td style="padding:0 4px 0 0;">${snapCard(snap[3] || {label:'–',value:'–',change:'–'})}</td>
        <td style="padding:0 4px 0 4px;">${snapCard(snap[4] || {label:'–',value:'–',change:'–'})}</td>
        <td style="padding:0;"></td>
      </tr>
    </table>`;

  const ACCENTS = ['#d97706','#3b82f6','#8b5cf6','#10b981','#f43f5e'];
  const sectionBlocks = sections.map((s, i) => {
    const accent = ACCENTS[i % ACCENTS.length];
    const bodyHtml = (s.body || '').replace(/\n/g, '<br/>');
    return `
    <tr><td style="padding-bottom:16px;">
      <div style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;">
        <div style="height:3px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);opacity:0.6;"></div>
        <div style="padding:24px 28px 28px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border-collapse:collapse;">
            <tr>
              <td width="8" height="9" style="padding:0 8px 0 0;vertical-align:middle;line-height:9px;">
                <table cellpadding="0" cellspacing="0" border="0" width="8" height="8" style="border-radius:50%;overflow:hidden;">
                  <tr><td width="8" height="8" bgcolor="${accent}" style="width:8px;height:8px;min-width:8px;min-height:8px;border-radius:50%;font-size:0;line-height:0;">&nbsp;</td></tr>
                </table>
              </td>
              <td style="vertical-align:middle;line-height:9px;">
                <span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};line-height:9px;display:inline-block;">${s.label}</span>
              </td>
            </tr>
          </table>
          <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${s.headline}</div>
          <div style="font-size:14px;color:#475569;line-height:1.85;">${bodyHtml}</div>
        </div>
      </div>
    </td></tr>`;
  }).join('');

  // Premium teaser block
  const premiumTeaserHtml = `
  <tr><td style="padding-bottom:16px;">
    <div style="border-radius:12px;border:2px solid #d97706;overflow:hidden;background:#fffbeb;">
      <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></div>
      <div style="padding:28px 32px;">
        <div style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#d97706;margin-bottom:12px;">Premium Members This Week</div>
        <div style="font-size:18px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">
          What our paid subscribers read this week — that you didn't
        </div>
        <div style="font-size:14px;color:#475569;line-height:1.85;margin-bottom:16px;">
          ${(premiumTeaser.items || []).map(item => `<div style="margin-bottom:10px;padding-left:14px;border-left:3px solid #d97706;">
            <div style="font-weight:600;color:#0f172a;margin-bottom:2px;">${item.title}</div>
            <div style="font-size:13px;color:#64748b;">${item.teaser}</div>
          </div>`).join('')}
        </div>
        <div style="font-size:13px;color:#92400e;background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-style:italic;">
          ${premiumTeaser.fomo_line}
        </div>
        <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:#d97706;color:#ffffff;font-size:12px;font-weight:800;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Upgrade to Premium &rarr;</a>
      </div>
    </div>
  </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- WORDMARK -->
  <tr><td style="padding-bottom:18px;text-align:center;">
    <span style="font-size:10px;letter-spacing:4px;color:#94a3b8;text-transform:uppercase;font-weight:700;">The Keystone Macro Weekly</span>
  </td></tr>

  <!-- FREE BADGE -->
  <tr><td style="padding-bottom:12px;text-align:center;">
    <span style="display:inline-block;background:#f0fdf4;border:1px solid #86efac;color:#15803d;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">Free Weekly Digest</span>
  </td></tr>

  <!-- HERO HEADER -->
  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;overflow:hidden;">
    <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></div>
    <div style="padding:36px 40px 32px;">
      <div style="font-size:10px;letter-spacing:2.5px;color:#d97706;text-transform:uppercase;font-weight:800;margin-bottom:12px;">Weekly Wrap &nbsp;&nbsp;·&nbsp;&nbsp; ${weekRange}</div>
      <div style="font-size:28px;font-weight:800;color:#f8fafc;line-height:1.25;font-family:Georgia,'Times New Roman',serif;">${subject}</div>
    </div>
  </td></tr>

  <!-- MARKET SNAPSHOT -->
  <tr><td style="background:#1e293b;padding:0 40px 28px;">
    <div style="font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;font-weight:700;padding-top:4px;margin-bottom:12px;">Weekly Market Snapshot</div>
    ${snapshotHtml}
  </td></tr>

  <!-- DIVIDER -->
  <tr><td style="height:8px;background:#f1f5f9;"></td></tr>

  <!-- SECTIONS -->
  <tr><td style="background:#f1f5f9;padding:0 0 4px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}
      ${premiumTeaserHtml}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#ffffff;border:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
    <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;margin-right:12px;">Read Online</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fkeystonemacro.com%2FNewsletter" style="display:inline-block;background:#0a66c2;color:#ffffff;font-size:12px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Share on LinkedIn</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
    <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
      <span style="font-size:11px;color:#94a3b8;line-height:2;">
        The Keystone Macro Weekly &nbsp;·&nbsp; Free Edition<br/>
        You are receiving this because you subscribed to the Keystone Macro mailing list.<br/>
        <a href="https://keystonemacro.com/Newsletter" style="color:#d97706;text-decoration:none;font-weight:600;">Manage subscription</a>
      </span>
    </div>
  </td></tr>

  <tr><td style="height:32px;"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const testEmail = body.test_email || null; // if provided, only send to this email

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Week range: Mon–Fri
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri
    const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now); monday.setDate(now.getDate() - daysToMon);
    const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
    const weekRange = `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    // Get subscribers — if test_email, just use that
    let recipients = [];
    if (testEmail) {
      recipients = [{ email: testEmail }];
    } else {
      const subs = await base44.asServiceRole.entities.NewsletterSubscriber.filter({ status: 'active' });
      recipients = subs || [];
    }

    if (recipients.length === 0) {
      return Response.json({ message: 'No recipients', sent: 0 });
    }

    // Generate weekly content via LLM
    const [metaRes, sectionsRes, premiumRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing the FREE weekly digest. Today is ${dateStr}. Week: ${weekRange}.

Return JSON:
- subject_line: Punchy weekly subject line referencing the single biggest story of this week (max 72 chars). No emojis.
- market_snapshot: array of 5 objects {label, value, change} — S&P 500 (weekly change), 10Y UST, DXY, Gold, Brent — with real weekly closing levels.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            subject_line: { type: 'string' },
            market_snapshot: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, change: { type: 'string' } } } }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing the FREE weekly digest. Today is ${dateStr}. Week covered: ${weekRange}.

Write 4 sections summarising the BIGGEST macro and market themes of THIS WEEK. Pick the 4 most important: e.g. Equities, Macro Data, Central Banks, Geopolitics, FX, Commodities. Each section should give a good summary but deliberately stop short of deep analysis — free readers get the WHAT, not the WHY or the trade.

No URLs, no emojis. Write authoritatively but accessibly — not as dense as a premium note. Each body is 3-4 sentences.

Return JSON:
- sections: array of 4 objects each with: label, headline (specific to this week), body (3-4 sentences, weekly recap)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            sections: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, headline: { type: 'string' }, body: { type: 'string' } } } }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro. Today is ${dateStr}. Week: ${weekRange}.

Generate content for a "Premium Teaser" block in the FREE weekly newsletter — designed to make free subscribers feel like they missed out and want to upgrade.

List 3 premium content items that would realistically have been published this week as deep-dive research notes or trade ideas. Make them sound compelling and specific — titles like "The Fed's Hidden Playbook: Why We're Positioned for a September Cut" or "Long Bund / Short BTP: Our Best Trade for Q3". Do NOT make them generic.

Also write a short FOMO line (1 sentence) that emphasises the value of the premium content this week.

Return JSON:
- items: array of 3 objects each with: title (compelling premium note/trade title), teaser (1 sentence, what the note argues — tantalising but incomplete)
- fomo_line: 1 punchy sentence making free readers feel they missed out this week`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, teaser: { type: 'string' } } } },
            fomo_line: { type: 'string' }
          }
        }
      })
    ]);

    const subject = metaRes.subject_line || `Keystone Macro Weekly — ${weekRange}`;
    const marketSnapshot = metaRes.market_snapshot || [];
    const sections = sectionsRes.sections || [];
    const premiumTeaser = premiumRes || { items: [], fomo_line: '' };

    const htmlBody = buildWeeklyEmailHtml({ subject, dateStr, weekRange, marketSnapshot, sections, premiumTeaser });

    let sent = 0;
    for (const recipient of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        subject: `Keystone Macro Weekly — ${subject}`,
        body: htmlBody,
        from_name: 'Keystone Macro',
      });
      sent++;
    }

    return Response.json({ message: `Weekly newsletter sent`, sent, subject, weekRange, test: !!testEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});