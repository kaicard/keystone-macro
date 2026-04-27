import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── HTML email template (light/white theme, mobile-first) ────────────────────
function buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote }) {

  const snapshotCells = marketSnapshot.map(m => {
    const isPos = m.change.startsWith('+');
    const isNeg = m.change.startsWith('-');
    const changeColor = isPos ? '#16a34a' : isNeg ? '#dc2626' : '#6b7280';
    return `<td style="padding:0 12px;text-align:center;border-right:1px solid #e5e7eb;">
      <div style="font-size:10px;color:#9ca3af;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:3px;">${m.label}</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${m.value}</div>
      <div style="font-size:11px;font-weight:600;color:${changeColor};">${m.change}</div>
    </td>`;
  }).join('');

  const sectionBlocks = sections.map(s => `
    <tr><td style="padding:0 0 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom:8px;">
          <span style="display:inline-block;background:#f5f0e8;color:#92400e;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:3px 10px;border-radius:4px;">${s.label}</span>
        </td></tr>
        <tr><td style="font-size:18px;font-weight:700;color:#111827;line-height:1.3;padding-bottom:10px;font-family:Georgia,serif;">${s.headline}</td></tr>
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.8;padding-bottom:${s.callout ? '12px' : '0'};">${s.body.replace(/\n/g, '<br/>')}</td></tr>
        ${s.callout ? `<tr><td style="background:#fffbeb;border-left:3px solid #d97706;border-radius:0 6px 6px 0;padding:12px 16px;">
          <span style="font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.8px;">Key Takeaway</span><br/>
          <span style="font-size:13px;color:#374151;line-height:1.6;">${s.callout}</span>
        </td></tr>` : ''}
      </table>
    </td></tr>
    <tr><td style="border-top:1px solid #f3f4f6;padding-bottom:32px;"></td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;border:1px solid #e5e7eb;border-bottom:none;padding:32px 36px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:10px;letter-spacing:2px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:6px;">Keystone Macro</div>
          <div style="font-size:22px;font-weight:800;color:#111827;line-height:1.25;font-family:Georgia,serif;">${subject}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:6px;">${editionLabel}&nbsp;&nbsp;·&nbsp;&nbsp;${dateStr}</div>
        </td>
        <td style="text-align:right;vertical-align:middle;padding-left:16px;">
          <div style="width:44px;height:44px;border-radius:10px;background:#fef3c7;display:inline-block;line-height:44px;text-align:center;">
            <span style="font-size:20px;color:#d97706;">K</span>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Market Snapshot -->
  <tr><td style="background:#f9fafb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:16px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td colspan="5" style="font-size:10px;letter-spacing:1px;color:#9ca3af;text-transform:uppercase;padding-bottom:10px;font-weight:600;">Market Snapshot</td></tr>
      <tr>${snapshotCells}</tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:0 36px;">
    <div style="height:1px;background:#f3f4f6;"></div>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:36px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}

      <!-- CTA Button -->
      <tr><td style="padding:8px 0 32px;text-align:center;">
        <a href="https://keystonemacro.com/Research" style="display:inline-block;background:#d97706;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.3px;padding:13px 32px;border-radius:8px;text-decoration:none;">Read Full Analysis</a>
      </td></tr>

      <!-- LinkedIn Share -->
      <tr><td style="padding-bottom:8px;text-align:center;">
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fkeystonemacro.com%2FResearch" style="display:inline-block;background:#0a66c2;color:#ffffff;font-size:12px;font-weight:600;padding:9px 22px;border-radius:6px;text-decoration:none;">Share on LinkedIn</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 36px;text-align:center;">
    <div style="font-size:12px;color:#6b7280;line-height:2;">
      <strong style="color:#374151;">Keystone Macro</strong>&nbsp;&nbsp;·&nbsp;&nbsp;Institutional Research &amp; Market Intelligence
    </div>
    <div style="font-size:12px;color:#9ca3af;margin-top:4px;margin-bottom:12px;line-height:1.6;">${footerNote}</div>
    <div style="border-top:1px solid #e5e7eb;padding-top:14px;font-size:11px;color:#9ca3af;line-height:1.8;">
      You are receiving this because you subscribed to Keystone Macro.<br/>
      <a href="https://keystonemacro.com/Newsletter#manage" style="color:#d97706;text-decoration:underline;">Manage subscription or cancel</a>
    </div>
  </td></tr>

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
      prompt: `You are the lead analyst at Keystone Macro, a premium institutional research platform. Today is ${dateStr}.

Write a comprehensive ${timeContext} newsletter. Cover EVERYTHING material: equities (US, EU, UK, Asia), FX, rates/bonds, commodities, crypto, M&A deals, earnings, macro data releases, central bank commentary, geopolitical risk, and regulatory news.

Be specific with numbers, tickers, levels, percentages. Write like a senior sell-side analyst — sharp, authoritative, no fluff.

Return JSON with:
- subject_line: A PUNCHY, ENTICING subject line (max 72 chars). Make it urgent, provocative, specific — no emojis. Examples: "The Dollar Is Breaking Down. Here's What Comes Next." or "Fed Flinches, Yields Surge — What You Missed Today"
- market_snapshot: array of exactly 5 objects {label, value, change} covering key levels right now (e.g. S&P 500, 10Y UST, DXY, Gold, Brent)
- sections: array of 5-7 objects, each with:
  - label: short category tag (e.g. "Equities", "Fixed Income", "FX", "Commodities", "M&A", "Macro Data", "Geopolitics", "Central Banks", "Earnings")
  - headline: punchy 1-line headline for this section — no emojis
  - body: 3-5 sentences, highly specific with data, names, levels. No emojis.
  - callout: (optional) 1 concise sentence — the single most important takeaway. No emojis.
- footer_note: A 1-line closing thought or forward-looking observation. No emojis.`,
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

    const subject = generated.subject_line || `Keystone Macro ${editionLabel} — ${dateStr}`;
    const marketSnapshot = generated.market_snapshot || [];
    const sections = generated.sections || [];
    const footerNote = generated.footer_note || 'Markets close. The analysis never stops.';

    const htmlBody = buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote });

    // ── Send to all active subscribers ──────────────────────────────────────
    let sent = 0;
    for (const subscriber of subscribers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: subscriber.email,
        subject,
        body: htmlBody,
        from_name: 'Keystone Macro',
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