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

  // Market snapshot — 2-row grid: row1 = 3 cards, row2 = 2 cards, fixed pixel widths
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

  // Sections — each a styled card
  const sectionBlocks = sections.map((s, i) => {
    const accent = SECTION_ACCENTS[i % SECTION_ACCENTS.length];
    const cleanLabel = prettyLabel(s.label || '');
    // Strip any URLs/citations the LLM may have included
    const cleanBody = (s.body || '')
      .replace(/\s*\(https?:\/\/[^\)]+\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s*\[[^\]]*\]\s*\(https?:\/\/[^\)]+\)/g, '');
    const bodyHtml = cleanBody.replace(/\n/g, '<br/>');
    return `
    <tr><td style="padding-bottom:16px;">
      <div style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;">
        <!-- card top accent line -->
        <div style="height:3px;${headerAccent}opacity:0.6;"></div>
        <div style="padding:24px 28px 28px;">
          <!-- label row -->
          ${cleanLabel ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border-collapse:collapse;">
            <tr>
              <td width="8" height="9" style="padding:0 8px 0 0;vertical-align:middle;line-height:9px;">
                <table cellpadding="0" cellspacing="0" border="0" width="8" height="8" style="border-radius:50%;overflow:hidden;">
                  <tr><td width="8" height="8" bgcolor="${accent}" style="width:8px;height:8px;min-width:8px;min-height:8px;border-radius:50%;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
                </table>
              </td>
              <td style="vertical-align:middle;line-height:9px;">
                <span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};line-height:9px;display:inline-block;">${cleanLabel}</span>
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
    ${snapshotHtml}
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
    const isoDate = now.toISOString().split('T')[0];
    const cutoffISO = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const editionLabel = editionType === 'morning' ? 'Morning Brief' : 'Evening Wrap';
    const timeContext = editionType === 'morning'
      ? 'pre-market brief covering overnight developments, Asian session, European open and what to watch today'
      : 'end-of-day wrap covering everything that moved markets today — equities, bonds, FX, commodities, M&A, macro data releases, geopolitical developments, central bank commentary, and corporate news';

    // ── Load recent editions for uniqueness context ──────────────────────────
    const recentEditions = await base44.asServiceRole.entities.NewsletterEdition.list('-publish_date', 4);
    const recentContext = recentEditions.length > 0
      ? `\n\nRECENT EDITIONS ALREADY SENT (do NOT repeat these subjects, angles, or lead stories):\n${recentEditions.map(e => `- ${e.publish_date}: "${e.title}" | Topics: ${(e.tags || []).join(', ')}`).join('\n')}`
      : '';

    // ── Rotating tone/angle directive (cycles by day of week) ────────────────
    const toneOptions = [
      'Lead with the most surprising or counterintuitive market move. Challenge consensus views where the data supports it.',
      'Lead with the macro-structural angle — what does today tell us about the longer-term regime? Connect dots across asset classes.',
      'Lead with the policy angle — central banks, fiscal decisions, regulatory moves. How are they shaping the near-term outlook?',
      'Lead with the geopolitical or cross-border angle — trade flows, sanctions, elections, war risk. Quantify the market impact.',
      'Lead with the sector or single-name story that best captures the broader market narrative today.',
      'Lead with the rates and credit angle — yield moves, spread dynamics, financing conditions. What is the bond market signalling?',
      'Lead with the commodity or energy angle — supply shocks, demand shifts, China dynamics. Connect to inflation and growth.',
    ];
    const toneDirective = toneOptions[now.getDay()];

    // ── Generate content via two LLM calls to avoid JSON truncation ─────────
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing The Keystone Macro Brief. Today is ${dateStr} (${isoDate}). This is the ${editionLabel}.

CRITICAL: All data must be from TODAY (${isoDate}) only. Do not use figures, levels, or events from any previous date.
${recentContext}

${toneDirective}

Return JSON with:
- subject_line: A PUNCHY, UNIQUE subject line (max 72 chars) reflecting the single most important story from today. Must be DIFFERENT in structure and topic from the recent editions above. Urgent, specific, no emojis.
- market_snapshot: array of exactly 5 objects {label, value, change} — S&P 500, 10Y UST, DXY, Gold, Brent — with real current levels from today.
- footer_note: A sharp, memorable 1-line closing thought — a market aphorism, a bold forward view, or a wry observation on today's action. Vary the style each edition. No emojis.`,
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
        prompt: `You are the lead analyst at Keystone Macro writing The Keystone Macro Brief. Today is ${dateStr} (${isoDate}). This is the ${editionLabel} — a ${timeContext}.
${recentContext}

EDITORIAL DIRECTIVE FOR THIS EDITION: ${toneDirective}

CRITICAL RULES — failure invalidates the entire edition:
1. Every fact, figure, price level, and event MUST be from TODAY (${isoDate}) — published after ${cutoffISO}. Do not recycle yesterday's or last week's news.
2. If you cannot verify a development happened today, do NOT include it. Write "Markets were quiet in [sector]" rather than fabricating.
3. No URLs, hyperlinks, source citations, footnotes, or "(source.com)" references anywhere. Pure prose only.
4. No emojis anywhere.
5. UNIQUENESS: Check the recent editions above. Do NOT repeat the same lead story angle, the same headlines, or the same framing used in prior editions. Find a fresh angle on today's events.
6. Vary the section order — do not always start with Equities. Let the day's most important story lead.

Write 6 analytical sections. Cover the key themes: Equities, Fixed Income, FX, Commodities, Macro Data, and one of (Geopolitics / Central Banks / M&A / Corporate) based on what was most significant today. Each section: exact tickers, levels, percentages, named policymakers, named companies. Write like a senior Goldman Sachs analyst — sharp, authoritative, precise, with a distinct point of view.

Return JSON with:
- sections: array of exactly 6 objects, each with:
  - label: short category tag (e.g. "Equities", "Fixed Income", "FX", "Commodities", "Macro", "Geopolitics", "Central Banks", "M&A")
  - headline: punchy, specific 1-line headline anchored to today's development — must be unique vs recent editions
  - body: 4-5 dense sentences with exact data from today only. NO URLs or citations. Take a clear analytical stance.
  - callout: 1 forward-looking sentence — what to watch next or the key risk to the view`,
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

    // ── Persist as a NewsletterEdition record (upsert — no duplicates) ──────
    const todaySlug = `${editionType}-${now.toISOString().split('T')[0]}`;
    const editionData = {
      title: subject,
      slug: todaySlug,
      edition_type: editionType,
      publish_date: now.toISOString().split('T')[0],
      published_at: now.toISOString(),
      status: 'published',
      market_summary: marketSnapshot.map(m => {
        // Normalise change to a bare percentage string, stripping any nested parens
        // e.g. "-76.49 (-1.07%)" → "-1.07%"  |  "-1.07%" → "-1.07%"
        const rawChange = String(m.change || '');
        const pctMatch = rawChange.match(/([-+]?[0-9.,]+%)/);
        const cleanChange = pctMatch ? pctMatch[1] : rawChange;
        return `${m.label}: ${m.value} (${cleanChange})`;
      }).join(' · '),
      body: sections.map(s => `## ${prettyLabel(s.label || '')}: ${s.headline}\n\n${s.body}${s.callout ? `\n\n> ${s.callout}` : ''}`).join('\n\n---\n\n'),
      tags: sections.map(s => s.label),
    };
    const existingEditions = await base44.asServiceRole.entities.NewsletterEdition.filter({ slug: todaySlug });
    if (existingEditions?.length > 0) {
      await base44.asServiceRole.entities.NewsletterEdition.update(existingEditions[0].id, editionData);
    } else {
      await base44.asServiceRole.entities.NewsletterEdition.create(editionData);
    }

    return Response.json({ message: `The Keystone Macro Brief — ${editionLabel} sent successfully`, sent, subject });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});