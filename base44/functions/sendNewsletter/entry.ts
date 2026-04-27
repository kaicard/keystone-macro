import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── HTML email template ───────────────────────────────────────────────────────
function buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote }) {

  // Market snapshot — stacked rows for mobile friendliness
  const snapshotRows = marketSnapshot.map(m => {
    const isPos = m.change.startsWith('+');
    const isNeg = m.change.startsWith('-');
    const changeColor = isPos ? '#15803d' : isNeg ? '#dc2626' : '#6b7280';
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;font-weight:500;">${m.label}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:13px;font-weight:700;color:#111827;">${m.value}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:12px;font-weight:600;color:${changeColor};padding-left:16px;">${m.change}</td>
      </tr>`;
  }).join('');

  const sectionBlocks = sections.map(s => `
    <tr><td style="padding:0 0 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:10px;">
          <span style="font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#d97706;">${s.label}</span>
        </td></tr>
        <tr><td style="font-size:19px;font-weight:700;color:#111827;line-height:1.35;padding-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${s.headline}</td></tr>
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.85;padding-bottom:${s.callout ? '16px' : '0'};">${s.body.replace(/\n/g, '<br/><br/>')}</td></tr>
        ${s.callout ? `
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="3" style="background:#d97706;border-radius:2px;">&nbsp;</td>
              <td style="padding:12px 0 12px 16px;font-size:13px;color:#374151;line-height:1.65;font-style:italic;">${s.callout}</td>
            </tr>
          </table>
        </td></tr>` : ''}
      </table>
    </td></tr>
    <tr><td style="border-top:1px solid #f3f4f6;padding-bottom:40px;"></td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${subject}</title>
  <style>
    @media only screen and (max-width:600px) {
      .outer-table { padding: 0 !important; }
      .main-card { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .content-pad { padding: 28px 20px !important; }
      .header-pad { padding: 28px 20px 20px !important; }
      .snap-pad { padding: 16px 20px !important; }
      .footer-pad { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;" class="outer-table">
<tr><td align="center" style="padding:32px 16px;" class="outer-table">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

    <!-- ── WORDMARK BAR ── -->
    <tr><td style="padding-bottom:20px;text-align:center;">
      <span style="font-size:10px;letter-spacing:3px;color:#9ca3af;text-transform:uppercase;font-weight:600;">The Keystone Macro Letter</span>
    </td></tr>

    <!-- ── HEADER ── -->
    <tr><td class="main-card" style="background:#ffffff;border-radius:12px 12px 0 0;border:1px solid #e5e7eb;border-bottom:none;">
      <div class="header-pad" style="padding:36px 40px 28px;">
        <div style="font-size:10px;letter-spacing:2px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:10px;">${editionLabel}&nbsp;&nbsp;·&nbsp;&nbsp;${dateStr}</div>
        <div style="font-size:26px;font-weight:800;color:#0f172a;line-height:1.25;font-family:Georgia,'Times New Roman',serif;">${subject}</div>
      </div>
    </td></tr>

    <!-- ── MARKET SNAPSHOT ── -->
    <tr><td class="main-card" style="background:#fafafa;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #eeeeee;">
      <div class="snap-pad" style="padding:20px 40px;">
        <div style="font-size:9px;letter-spacing:1.8px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Market Snapshot</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${snapshotRows}
        </table>
      </div>
    </td></tr>

    <!-- ── BODY ── -->
    <tr><td class="main-card" style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <div class="content-pad" style="padding:40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${sectionBlocks}

          <!-- LinkedIn -->
          <tr><td style="padding-top:8px;padding-bottom:4px;text-align:center;">
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fkeystonemacro.com%2FNewsletter" style="display:inline-block;background:#0a66c2;color:#ffffff;font-size:12px;font-weight:600;padding:10px 24px;border-radius:6px;text-decoration:none;letter-spacing:0.2px;">Share on LinkedIn</a>
          </td></tr>
        </table>
      </div>
    </td></tr>

    <!-- ── FOOTER ── -->
    <tr><td class="main-card" style="background:#fafafa;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
      <div class="footer-pad" style="padding:24px 40px;text-align:center;">
        <div style="font-size:12px;color:#6b7280;line-height:1.8;margin-bottom:6px;">${footerNote}</div>
        <div style="border-top:1px solid #eeeeee;padding-top:16px;margin-top:14px;">
          <span style="font-size:11px;color:#9ca3af;line-height:1.9;">
            The Keystone Macro Letter&nbsp;&nbsp;·&nbsp;&nbsp;Institutional Research &amp; Market Intelligence<br/>
            You are receiving this because you subscribed to Keystone Macro.<br/>
            <a href="https://keystonemacro.com/Newsletter#manage" style="color:#d97706;text-decoration:none;border-bottom:1px solid #d97706;">Manage or cancel subscription</a>
          </span>
        </div>
      </div>
    </td></tr>

    <!-- ── BOTTOM SPACER ── -->
    <tr><td style="height:32px;"></td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const editionType = body.edition_type || 'morning';

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscription.filter({ status: 'active' });
    if (!subscribers || subscribers.length === 0) {
      return Response.json({ message: 'No active subscribers', sent: 0 });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const editionLabel = editionType === 'morning' ? 'Morning Brief' : 'Evening Wrap';
    const timeContext = editionType === 'morning'
      ? 'pre-market brief covering overnight developments, Asian session, European open and what to watch today'
      : 'end-of-day wrap covering everything that moved markets today — equities, bonds, FX, commodities, M&A, macro data releases, geopolitical developments, central bank commentary, and corporate news';

    // ── Generate content via LLM with live internet context ─────────────────
    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the lead analyst at Keystone Macro, a premium institutional research platform writing The Keystone Macro Letter. Today is ${dateStr}.

Write a comprehensive ${timeContext}. Cover EVERYTHING material: equities (US, EU, UK, Asia), FX, rates/bonds, commodities, crypto, M&A deals, earnings, macro data releases, central bank commentary, geopolitical risk, and regulatory news.

CRITICAL: Every section body must be thorough and complete — minimum 5-6 sentences per section, packed with specifics: exact tickers, exact levels, exact percentages, named policymakers, named companies, named countries. Leave nothing out. This is the complete briefing — readers rely solely on this email for their intelligence. Do not be vague. Do not say "several companies" — name them. Do not say "yields rose" — say by exactly how many basis points and to what level.

Write like a senior sell-side analyst at Goldman Sachs or JPMorgan — sharp, authoritative, precise. No emojis anywhere.

Return JSON with:
- subject_line: A PUNCHY, ENTICING subject line (max 72 chars). Urgent, provocative, specific. No emojis.
- market_snapshot: array of exactly 5 objects {label, value, change} — key levels right now (e.g. S&P 500, 10Y UST, DXY, Gold, Brent)
- sections: array of 6-8 objects, each with:
  - label: short category tag (e.g. "Equities", "Fixed Income", "FX", "Commodities", "M&A", "Macro Data", "Geopolitics", "Central Banks", "Earnings", "Credit")
  - headline: punchy 1-line headline — no emojis
  - body: 5-6 dense, specific sentences with exact data. No emojis. Newline (\\n) between paragraphs if needed.
  - callout: 1 concise forward-looking sentence — the most actionable takeaway. No emojis.
- footer_note: A sharp 1-line closing observation. No emojis.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          subject_line: { type: 'string' },
          market_snapshot: {
            type: 'array',
            items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, change: { type: 'string' } } }
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                headline: { type: 'string' },
                body: { type: 'string' },
                callout: { type: 'string' }
              }
            }
          },
          footer_note: { type: 'string' }
        }
      }
    });

    const subject = generated.subject_line || `The Keystone Macro Letter — ${editionLabel} — ${dateStr}`;
    const marketSnapshot = generated.market_snapshot || [];
    const sections = generated.sections || [];
    const footerNote = generated.footer_note || 'Markets close. The analysis never stops.';

    const htmlBody = buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote });

    // ── Send to all active subscribers ──────────────────────────────────────
    let sent = 0;
    for (const subscriber of subscribers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: subscriber.email,
        subject: `The Keystone Macro Letter — ${subject}`,
        body: htmlBody,
        from_name: 'The Keystone Macro Letter',
      });
      sent++;
    }

    // ── Persist as a NewsletterEdition record ────────────────────────────────
    const slug = `${editionType}-${now.toISOString().split('T')[0]}`;
    await base44.asServiceRole.entities.NewsletterEdition.create({
      title: subject,
      slug,
      edition_type: editionType,
      publish_date: now.toISOString().split('T')[0],
      published_at: now.toISOString(),
      status: 'published',
      market_summary: marketSnapshot.map(m => `${m.label}: ${m.value} (${m.change})`).join(' · '),
      body: sections.map(s => `## ${s.label}: ${s.headline}\n\n${s.body}${s.callout ? `\n\n> ${s.callout}` : ''}`).join('\n\n---\n\n'),
      tags: sections.map(s => s.label),
    });

    return Response.json({ message: `${editionLabel} sent successfully`, sent, subject });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});