import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── HTML email template ───────────────────────────────────────────────────────
function buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote }) {
  const sectionHtml = sections.map(s => `
    <tr>
      <td style="padding: 0 0 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom: 10px;">
              <span style="display:inline-block; background: linear-gradient(135deg,#c9a84c,#e8c66a); color:#0d1117; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:4px;">${s.label}</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:18px; font-weight:700; color:#f0f0f0; line-height:1.3; padding-bottom:10px; font-family:'Georgia',serif;">${s.headline}</td>
          </tr>
          <tr>
            <td style="font-size:14px; color:#a8b3c0; line-height:1.75; padding-bottom:10px;">${s.body.replace(/\n/g, '<br/>')}</td>
          </tr>
          ${s.callout ? `<tr><td style="background:#1a2235; border-left:3px solid #c9a84c; border-radius:0 6px 6px 0; padding:12px 16px; margin-top:4px;">
            <span style="font-size:13px; color:#c9a84c; font-weight:600;">⚡ Key Takeaway</span><br/>
            <span style="font-size:13px; color:#d4dce8; line-height:1.6;">${s.callout}</span>
          </td></tr>` : ''}
        </table>
      </td>
    </tr>
    <tr><td style="border-top:1px solid #1e2d3d; padding-bottom:28px;"></td></tr>
  `).join('');

  const snapshotRows = marketSnapshot.map(m => `
    <td style="padding:0 8px; text-align:center; border-right:1px solid #1e2d3d; last-child:border-right:none;">
      <div style="font-size:10px; color:#6b7c93; letter-spacing:0.8px; text-transform:uppercase; margin-bottom:4px;">${m.label}</div>
      <div style="font-size:15px; font-weight:700; color:#f0f0f0;">${m.value}</div>
      <div style="font-size:11px; font-weight:600; color:${m.change.startsWith('+') ? '#34d399' : m.change.startsWith('-') ? '#f87171' : '#9ca3af'};">${m.change}</div>
    </td>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#080e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080e1a;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0d1117 0%,#111827 100%); border:1px solid #1e2d3d; border-radius:12px 12px 0 0; padding:32px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <div style="font-size:11px; letter-spacing:2px; color:#c9a84c; text-transform:uppercase; margin-bottom:8px; font-weight:600;">Keystone Macro</div>
              <div style="font-size:26px; font-weight:800; color:#ffffff; line-height:1.2; font-family:'Georgia',serif;">${subject}</div>
              <div style="font-size:12px; color:#6b7c93; margin-top:8px; letter-spacing:0.3px;">${editionLabel} &nbsp;·&nbsp; ${dateStr}</div>
            </td>
            <td style="text-align:right; vertical-align:top;">
              <div style="display:inline-block; background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.3); border-radius:50%; width:48px; height:48px; line-height:48px; text-align:center; font-size:22px;">◈</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Market Snapshot Bar -->
      <tr><td style="background:#0d1420; border-left:1px solid #1e2d3d; border-right:1px solid #1e2d3d; padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>${snapshotRows}</tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#0d1117; border:1px solid #1e2d3d; border-top:none; padding:36px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${sectionHtml}

          <!-- CTA -->
          <tr><td style="padding-top:8px; padding-bottom:28px; text-align:center;">
            <a href="https://keystonemacro.com/Research" style="display:inline-block; background:linear-gradient(135deg,#c9a84c,#e8c66a); color:#0d1117; font-size:13px; font-weight:700; letter-spacing:0.5px; padding:13px 32px; border-radius:8px; text-decoration:none;">
              Read Full Analysis →
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#080e1a; border:1px solid #1e2d3d; border-top:none; border-radius:0 0 12px 12px; padding:24px 36px; text-align:center;">
        <div style="font-size:11px; color:#3d5166; line-height:1.8;">
          <strong style="color:#4a6080;">Keystone Macro</strong> &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence<br/>
          ${footerNote}<br/><br/>
          <span style="color:#2d3f52;">You're receiving this because you subscribed to Keystone Macro. To unsubscribe, reply with "unsubscribe".</span>
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
    const editionLabel = editionType === 'morning' ? '🌅 Morning Brief' : '🌆 Evening Wrap';
    const timeContext = editionType === 'morning'
      ? 'pre-market brief covering overnight developments, Asian session, European open and what to watch today'
      : 'end-of-day wrap covering everything that moved markets today — equities, bonds, FX, commodities, M&A, macro data releases, geopolitical developments, central bank commentary, and corporate news';

    // ── Generate content via LLM ────────────────────────────────────────────
    const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the lead analyst at Keystone Macro, a premium institutional research platform. Today is ${dateStr}.

Write a comprehensive ${timeContext} newsletter. Cover EVERYTHING material: equities (US, EU, UK, Asia), FX, rates/bonds, commodities, crypto, M&A deals, earnings, macro data releases, central bank commentary, geopolitical risk, and regulatory news.

Be specific with numbers, tickers, levels, percentages. Write like a senior sell-side analyst — sharp, authoritative, no fluff.

Return JSON with:
- subject_line: A single PUNCHY, ENTICING subject line (max 70 chars). Make it urgent, provocative, specific. Examples: "The Dollar Is Breaking Down. Here's What Comes Next." / "Fed Flinches, Yields Surge — What You Missed Today" / "Recession Clock Ticks Louder: Everything That Moved Markets"
- market_snapshot: array of 5 objects with {label, value, change} — key levels right now (e.g. S&P 500, 10Y UST, DXY, Gold, Brent)
- sections: array of 5-7 objects, each with:
  - label: short category tag (e.g. "Equities", "Fixed Income", "FX", "Commodities", "M&A", "Macro Data", "Geopolitics", "Central Banks", "Crypto", "Earnings")
  - headline: punchy 1-line headline for this section
  - body: 3-5 sentences, highly specific with data, names, levels
  - callout: (optional) 1 punchy sentence — the single most important thing to know
- footer_note: A 1-line closing thought or forward-looking observation for the week ahead`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          subject_line: { type: 'string' },
          market_snapshot: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, value: { type: 'string' }, change: { type: 'string' } }
            }
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

    // ── Optionally persist as a NewsletterEdition record ────────────────────
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