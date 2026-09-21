import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Fetch real snapshot data via v8 chart endpoint ────────────────────────────
async function fetchSnapshotData() {
  const instruments = [
    { sym: '^GSPC', name: 'S&P 500' },
    { sym: '^TNX', name: 'US 10Y Yield' },
    { sym: 'DX-Y.NYB', name: 'DXY Index' },
    { sym: 'GC=F', name: 'Gold Futures' },
    { sym: 'BZ=F', name: 'Brent Crude' },
  ];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  };
  const results = await Promise.allSettled(instruments.map(async (inst) => {
    for (const host of ['query1', 'query2']) {
      try {
        const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(inst.sym)}?interval=1m&range=1d&includePrePost=false`;
        const res = await fetch(url, { headers });
        if (!res.ok) continue;
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) continue;
        const price = meta.regularMarketPrice;
        const prev = meta.previousClose ?? meta.chartPreviousClose;
        if (price == null || prev == null || price <= 0 || prev <= 0) continue;
        return { name: inst.name, sym: inst.sym, price, prev };
      } catch (_) {}
    }
    return null;
  }));
  const snapshot = [];
  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value) continue;
    const { name, sym, price, prev } = r.value;
    const changePct = ((price - prev) / prev) * 100;
    const isUp = changePct >= 0;
    const arrow = isUp ? '▲' : '▼';
    const sign = changePct >= 0 ? '+' : '';
    let formattedValue;
    if (sym === '^TNX') {
      formattedValue = `${price.toFixed(2)}%`;
    } else if (sym === 'GC=F' || sym === 'BZ=F') {
      formattedValue = `$${price.toFixed(2)}`;
    } else if (sym === '^GSPC') {
      formattedValue = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (sym === 'DX-Y.NYB') {
      formattedValue = price.toFixed(2);
    } else {
      formattedValue = String(price);
    }
    snapshot.push({
      label: name,
      value: formattedValue,
      change: `${arrow} ${sign}${Math.abs(changePct).toFixed(2)}%`
    });
  }
  return snapshot;
}

// ─── Snapshot row (same premium dark style) ────────────────────────────────────
function snapRow(m, isLast) {
  const rawFull = String(m.change || '').trim();
  const raw = rawFull.replace(/^[▲▼↑↓\+\-\s]+/, '').trim();
  const isNA = !rawFull || rawFull === 'N/A' || rawFull === '0' || rawFull === '0%' || rawFull === '—';
  const isPos = !isNA && (rawFull.startsWith('▲') || rawFull.startsWith('+') || rawFull.toLowerCase().includes('+'));
  const changeColor = isNA ? '#64748b' : isPos ? '#10b981' : '#f87171';
  const changeBg   = isNA ? 'rgba(100,116,139,0.15)' : isPos ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)';
  const accentBar  = isNA ? '#334155' : isPos ? '#10b981' : '#f87171';
  const arrow = isNA ? '' : isPos ? '▲' : '▼';
  const displayChange = isNA ? '—' : `${arrow} ${raw}`;
  return `<tr>
    <td style="padding-bottom:${isLast ? '0' : '8px'};">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#1a2540;border:1px solid #263352;border-left:4px solid ${accentBar};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:13px 16px 13px 14px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin-bottom:6px;">${m.label}</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle;width:55%;">
                  <span style="font-size:18px;font-weight:800;color:#f1f5f9;font-variant-numeric:tabular-nums;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${m.value}</span>
                </td>
                <td style="text-align:right;vertical-align:middle;width:45%;white-space:nowrap;">
                  <span style="display:inline-block;background:${changeBg};border-radius:5px;padding:4px 8px;font-size:10.5px;font-weight:700;color:${changeColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;white-space:nowrap;line-height:1.2;">${displayChange}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildWeeklyEmailHtml({ subject, weekRange, marketSnapshot, sections, premiumItems }) {
  const ACCENTS = ['#d97706','#3b82f6','#8b5cf6','#10b981','#f43f5e'];
  const snap = (marketSnapshot || []).slice(0, 5);
  const snapshotRows = snap.map((m, i) => snapRow(m, i === snap.length - 1)).join('');

  const sectionBlocks = sections.map((s, i) => {
    const accent = ACCENTS[i % ACCENTS.length];
    const bodyHtml = (s.body || '').replace(/\n/g, '<br/>');
    return `<tr><td style="padding:0 0 16px 0;">
      <div style="border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <div style="height:3px;background:${accent};"></div>
        <div style="padding:24px 28px 26px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
            <tr>
              <td style="padding-right:8px;vertical-align:middle;"><div style="width:7px;height:7px;background:${accent};border-radius:50%;"></div></td>
              <td style="vertical-align:middle;"><span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};">${s.label}</span></td>
            </tr>
          </table>
          <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${s.headline}</div>
          <div style="font-size:14px;color:#475569;line-height:1.9;">${bodyHtml}</div>
        </div>
      </div>
    </td></tr>`;
  }).join('');

  const premiumTeaserHtml = (premiumItems || []).length === 0 ? '' : `<tr><td style="padding:0 0 16px 0;">
    <div style="border-radius:14px;border:2px solid #d97706;overflow:hidden;background:#fffbeb;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
      <div style="height:3px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></div>
      <div style="padding:26px 28px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td style="padding-right:8px;vertical-align:middle;"><div style="width:7px;height:7px;background:#d97706;border-radius:50%;"></div></td>
            <td style="vertical-align:middle;"><span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#d97706;">Premium This Week</span></td>
          </tr>
        </table>
        <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">What our paid subscribers read this week</div>
        <div style="margin-bottom:16px;">
          ${premiumItems.map(item => `<div style="margin-bottom:10px;padding-left:14px;border-left:3px solid #d97706;">
            <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:2px;">${item.title}</div>
            ${item.teaser ? `<div style="font-size:13px;color:#64748b;line-height:1.6;">${item.teaser}</div>` : ''}
          </div>`).join('')}
        </div>
        <div style="border-radius:8px;background:#fef3c7;border-left:3px solid #d97706;padding:14px 18px;margin-bottom:20px;">
          <div style="font-size:13px;color:#92400e;line-height:1.7;">These editions and notes are archived for premium subscribers. Educational research and market analysis only — not investment advice.</div>
        </div>
        <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:#ffffff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Explore Premium →</a>
      </div>
    </div>
  </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    @media only screen and (max-width:600px){
      .outer-wrap{padding:16px 8px 32px!important;}
      .main-table{width:100%!important;}
      .hero-pad{padding:28px 20px 24px!important;}
      .snap-pad{padding:0 20px 24px!important;}
      .hero-title{font-size:20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;">
<tr><td align="center" class="outer-wrap" style="padding:28px 16px 40px;">
<table class="main-table" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- Wordmark -->
  <tr><td style="padding-bottom:14px;text-align:center;">
    <span style="font-size:8px;letter-spacing:5px;color:#94a3b8;text-transform:uppercase;font-weight:800;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">The Keystone Macro Weekly</span>
  </td></tr>

  <!-- Free badge -->
  <tr><td style="padding-bottom:16px;text-align:center;">
    <span style="display:inline-block;background:#f0fdf4;border:1px solid #86efac;color:#15803d;font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Free Weekly Digest</span>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#0f172a;border-radius:14px 14px 0 0;overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);"></div>
    <div class="hero-pad" style="padding:32px 32px 28px;">
      <div style="font-size:9px;letter-spacing:2.5px;color:#d97706;text-transform:uppercase;font-weight:700;margin-bottom:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Weekly Wrap &nbsp;·&nbsp; ${weekRange}</div>
      <div class="hero-title" style="font-size:24px;font-weight:800;color:#f8fafc;line-height:1.3;font-family:Georgia,'Times New Roman',serif;margin-bottom:18px;">${subject}</div>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:rgba(217,119,6,0.15);border:1px solid rgba(217,119,6,0.35);border-radius:5px;padding:4px 10px;">
          <span style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fcd34d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Free Edition &nbsp;·&nbsp; Weekly Recap</span>
        </td></tr>
      </table>
    </div>
  </td></tr>

  <!-- Market Snapshot -->
  <tr><td style="background:#0f172a;" class="snap-pad">
    <div style="padding:0 28px 24px;">
      <div style="font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:14px;padding-top:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">&#x25A0;&nbsp; Weekly Market Snapshot</div>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${snapshotRows}
      </table>
    </div>
  </td></tr>

  <!-- Gap -->
  <tr><td style="height:12px;background:#eef2f7;"></td></tr>

  <!-- Sections -->
  <tr><td style="background:#eef2f7;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}
      ${premiumTeaserHtml}
    </table>
  </td></tr>

  <!-- Gap -->
  <tr><td style="height:4px;"></td></tr>

  <!-- CTA -->
  <tr><td style="background:#0f172a;border-radius:12px;overflow:hidden;">
    <div style="padding:28px 36px;text-align:center;">
      <div style="font-size:10px;color:#475569;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Read online or upgrade</div>
      <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:#ffffff;font-size:13px;font-weight:700;padding:12px 30px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">View on Keystone Macro →</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:22px 32px;text-align:center;">
    <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
      <span style="font-size:10px;color:#94a3b8;line-height:2.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        The Keystone Macro Weekly &nbsp;·&nbsp; Free Edition<br/>
        <a href="https://keystonemacro.com/Newsletter#manage" style="color:#d97706;text-decoration:none;font-weight:600;">Unsubscribe</a>
      </span>
    </div>
  </td></tr>

  <tr><td style="height:20px;"></td></tr>
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

    // ── Fetch real market snapshot ───────────────────────────────────────────
    const realSnapshot = await fetchSnapshotData();
    const snapshotSummary = realSnapshot.length > 0
      ? realSnapshot.map(m => `${m.label}: ${m.value} (${m.change})`).join(' | ')
      : 'Market data temporarily unavailable — describe direction and trends only, do NOT fabricate specific prices or levels.';

    // Generate weekly content via LLM
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing the FREE weekly digest. Today is ${dateStr}. Week: ${weekRange}.

REAL MARKET DATA (just fetched — current levels):
${snapshotSummary}

Return JSON:
- subject_line: Punchy weekly subject line referencing the single biggest story of this week (max 72 chars). No emojis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            subject_line: { type: 'string' }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing the FREE weekly digest. Today is ${dateStr}. Week covered: ${weekRange}.

REAL MARKET DATA (current live levels — do NOT fabricate any price, level, or percentage):
${snapshotSummary}

Write 4 sections summarising the BIGGEST macro and market themes of THIS WEEK. Pick the 4 most important: e.g. Equities, Macro Data, Central Banks, Geopolitics, FX, Commodities. Cover only stories that genuinely happened this week — never invent events, figures, or company news.

No URLs, no emojis. Write authoritatively but accessibly — not as dense as a premium note. Each body is 3-4 sentences. Use the real data above for any specific numbers.

Return JSON:
- sections: array of 4 objects each with: label, headline (specific to this week), body (3-4 sentences, weekly recap)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            sections: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, headline: { type: 'string' }, body: { type: 'string' } } } }
          }
        }
      })
    ]);

    // Real premium content published this week — listed from actual records, never invented.
    const mondayISO = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const [editions, notes] = await Promise.all([
      base44.asServiceRole.entities.NewsletterEdition.filter({ status: 'published' }, '-publish_date', 50),
      base44.asServiceRole.entities.ResearchNote.filter({ status: 'published' }, '-publish_date', 50),
    ]);
    const weekEditions = (editions || []).filter(e => e.publish_date && e.publish_date >= mondayISO);
    const weekNotes = (notes || []).filter(n => n.is_premium && n.publish_date && n.publish_date >= mondayISO);
    const premiumItems = [
      ...weekEditions.map(e => ({
        title: e.title,
        teaser: e.market_summary ? e.market_summary.split(' · ').slice(0, 3).join(' · ') : '',
      })),
      ...weekNotes.map(n => ({ title: n.title, teaser: n.subtitle || n.executive_summary || '' })),
    ].slice(0, 3);

    const subject = metaRes.subject_line || `Keystone Macro Weekly — ${weekRange}`;
    const marketSnapshot = realSnapshot;
    const sections = sectionsRes.sections || [];

    const htmlBody = buildWeeklyEmailHtml({ subject, weekRange, marketSnapshot, sections, premiumItems });

    let sent = 0;
    const skipped = [];
    for (const recipient of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          from_name: 'Keystone Macro',
          subject: `Keystone Macro Weekly — ${subject}`,
          body: htmlBody,
        });
        sent++;
      } catch (_) {
        // Non-registered users can't receive via SendEmail — they'll read on-site
        skipped.push(recipient.email);
      }
    }

    return Response.json({ message: `Weekly newsletter sent`, sent, skipped: skipped.length, subject, weekRange, test: !!testEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});