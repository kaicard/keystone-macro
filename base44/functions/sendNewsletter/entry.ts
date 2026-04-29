import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Prettify label — strip underscores, title-case ───────────────────────────
function prettyLabel(raw) {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ─── Section accent colours (cycling) ────────────────────────────────────────
const SECTION_ACCENTS = ['#d97706','#3b82f6','#8b5cf6','#10b981','#f43f5e','#06b6d4'];

// ─── HTML email template ───────────────────────────────────────────────────────
function buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote, isMorning }) {

  const headerAccent = isMorning
    ? 'background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);'
    : 'background:linear-gradient(90deg,#3b82f6,#6366f1,#60a5fa);';

  const editionColor = isMorning ? '#d97706' : '#3b82f6';

  // Market snapshot — equal fixed-width cells, consistent height
  const snapshotCards = marketSnapshot.map(m => {
    const isPos = String(m.change).startsWith('+');
    const isNeg = String(m.change).startsWith('-');
    const changeColor = isPos ? '#10b981' : isNeg ? '#ef4444' : '#9ca3af';
    const arrow = isPos ? '▲' : isNeg ? '▼' : '–';
    return `<td width="20%" style="padding:4px;vertical-align:top;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;height:90px;">
        <tr><td style="padding:12px 10px;vertical-align:top;">
          <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.label}</div>
          <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:7px;font-variant-numeric:tabular-nums;white-space:nowrap;">${m.value}</div>
          <div style="font-size:11px;font-weight:700;color:${changeColor};">${arrow} ${m.change}</div>
        </td></tr>
      </table>
    </td>`;
  }).join('');

  // Sections — each a styled card
  const sectionBlocks = sections.map((s, i) => {
    const accent = SECTION_ACCENTS[i % SECTION_ACCENTS.length];
    const cleanLabel = prettyLabel(s.label || '');
    const bodyHtml = (s.body || '').replace(/\n/g, '<br/>');
    return `
    <tr><td style="padding-bottom:16px;">
      <div style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;">
        <!-- card top accent line -->
        <div style="height:3px;${headerAccent}opacity:0.6;"></div>
        <div style="padding:24px 28px 28px;">
          <!-- label row -->
          ${cleanLabel ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
            <tr>
              <td width="14" style="vertical-align:middle;padding-right:6px;">
                <table cellpadding="0" cellspacing="0" border="0" width="7" height="7"><tr><td width="7" height="7" style="width:7px;height:7px;background:${accent};border-radius:50%;font-size:0;line-height:0;">&nbsp;</td></tr></table>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};">${cleanLabel}</span>
              </td>
            </tr>
          </table>` : ''}
          <!-- headline -->
          <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${s.headline}</div>
          <!-- body -->
          <div style="font-size:14px;color:#475569;line-height:1.85;margin-bottom:${s.callout ? '18px' : '0'};">${bodyHtml}</div>
          <!-- callout block -->
          ${s.callout ? `
          <div style="border-radius:8px;background:#f8fafc;border-left:3px solid ${accent};padding:14px 18px;">
            <div style="font-size:13px;color:#374151;line-height:1.7;font-style:italic;">${s.callout}</div>
          </div>` : ''}
        </div>
      </div>
    </td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${subject}</title>
  <style>
    @media only screen and (max-width:600px) {
      .wrap { padding: 0 !important; }
      .card { border-radius: 0 !important; }
      .pad { padding: 24px 18px !important; }
      .snap-cell { display: block !important; width: 100% !important; margin-bottom: 8px; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;" class="wrap">
<tr><td align="center" style="padding:32px 16px;" class="wrap">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ── WORDMARK ── -->
  <tr><td style="padding-bottom:18px;text-align:center;">
    <span style="font-size:10px;letter-spacing:4px;color:#94a3b8;text-transform:uppercase;font-weight:700;">The Keystone Macro Brief</span>
  </td></tr>

  <!-- ── HERO HEADER ── -->
  <tr><td class="card" style="background:#0f172a;border-radius:16px 16px 0 0;overflow:hidden;">
    <!-- accent bar -->
    <div style="height:4px;${headerAccent}"></div>
    <div class="pad" style="padding:36px 40px 32px;">
      <div style="font-size:10px;letter-spacing:2.5px;color:${editionColor};text-transform:uppercase;font-weight:800;margin-bottom:12px;">${editionLabel}&nbsp;&nbsp;·&nbsp;&nbsp;${dateStr}</div>
      <div style="font-size:28px;font-weight:800;color:#f8fafc;line-height:1.25;font-family:Georgia,'Times New Roman',serif;">${subject}</div>
    </div>
  </td></tr>

  <!-- ── MARKET SNAPSHOT ── -->
  <tr><td style="background:#1e293b;padding:0 40px 28px;" class="pad">
    <div style="font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;font-weight:700;padding-top:4px;margin-bottom:12px;">Market Snapshot</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>${snapshotCards}</tr>
    </table>
  </td></tr>

  <!-- ── DIVIDER ── -->
  <tr><td style="height:8px;background:#f1f5f9;"></td></tr>

  <!-- ── SECTIONS ── -->
  <tr><td style="background:#f1f5f9;padding:0 0 4px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}
    </table>
  </td></tr>

  <!-- ── CTA ── -->
  <tr><td style="background:#ffffff;border:1px solid #e2e8f0;padding:24px 40px;text-align:center;" class="pad">
    <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;margin-right:12px;">Read Full Edition Online</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fkeystonemacro.com%2FNewsletter" style="display:inline-block;background:#0a66c2;color:#ffffff;font-size:12px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Share on LinkedIn</a>
  </td></tr>

  <!-- ── FOOTER ── -->
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;" class="pad">
    <div style="font-size:12px;color:#64748b;line-height:1.8;margin-bottom:12px;font-style:italic;">${footerNote}</div>
    <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px;">
      <span style="font-size:11px;color:#94a3b8;line-height:2;">
        The Keystone Macro Brief &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence<br/>
        You are receiving this because you subscribed to Keystone Macro.<br/>
        <a href="https://keystonemacro.com/Newsletter#manage" style="color:${editionColor};text-decoration:none;font-weight:600;">Manage or cancel subscription</a>
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

    // ── Generate content via two LLM calls to avoid JSON truncation ─────────
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing The Keystone Macro Brief. Today is ${dateStr}. This is the ${editionLabel}.

Return JSON with:
- subject_line: A PUNCHY subject line (max 72 chars). Urgent, specific, no emojis.
- market_snapshot: array of exactly 5 objects {label, value, change} — S&P 500, 10Y UST, DXY, Gold, Brent — with real current levels.
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
            footer_note: { type: 'string' }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing The Keystone Macro Brief. Today is ${dateStr}. This is the ${editionLabel} — a ${timeContext}.

Write 6 analytical sections covering: Equities, Fixed Income, FX, Commodities, Macro Data, and Geopolitics (or Central Banks or M&A as relevant). Each section must be thorough: exact tickers, levels, percentages, named policymakers, named companies. Write like a senior Goldman Sachs analyst — sharp, authoritative, precise. No emojis anywhere.

Return JSON with:
- sections: array of exactly 6 objects, each with:
  - label: short category tag
  - headline: punchy 1-line headline
  - body: 4-5 dense specific sentences with exact data
  - callout: 1 forward-looking actionable sentence`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
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
            }
          }
        }
      })
    ]);

    const subject = metaRes.subject_line || `The Keystone Macro Brief — ${editionLabel} — ${dateStr}`;
    const marketSnapshot = metaRes.market_snapshot || [];
    const sections = sectionsRes.sections || [];
    const footerNote = metaRes.footer_note || 'Markets close. The analysis never stops.';

    const htmlBody = buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sections, footerNote, isMorning: editionType === 'morning' });

    // ── Send to all active subscribers ──────────────────────────────────────
    let sent = 0;
    for (const subscriber of subscribers) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: subscriber.email,
        subject: `The Keystone Macro Brief — ${subject}`,
        body: htmlBody,
        from_name: 'The Keystone Macro Brief',
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

    return Response.json({ message: `The Keystone Macro Brief — ${editionLabel} sent successfully`, sent, subject });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});