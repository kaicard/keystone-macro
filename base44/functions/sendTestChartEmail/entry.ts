import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Chart builder — high quality, clean, properly spaced ──────────────────────
function buildChartUrl({ labels, data, isUp, height = 260 }) {
  const validData = data.filter(d => d != null && !isNaN(d));
  if (validData.length < 3) return null;

  // Tight Y-axis for visible movement
  const minVal = Math.min(...validData);
  const maxVal = Math.max(...validData);
  const range = maxVal - minVal || minVal * 0.005;
  const pad = range * 0.18;
  const yMin = parseFloat((minVal - pad).toFixed(6));
  const yMax = parseFloat((maxVal + pad).toFixed(6));

  // Smart decimal places
  const mag = Math.abs(validData[0]);
  const dp = mag >= 10000 ? 0 : mag >= 100 ? 1 : mag >= 1 ? 2 : 4;

  // Reduce to max 12 labels on x-axis, evenly spread
  const maxLabels = 12;
  const step = Math.max(1, Math.floor(labels.length / maxLabels));
  const sparseLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

  const lineColor = isUp ? '#10b981' : '#ef4444';
  const fillColor = isUp ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)';

  const chartConfig = {
    type: 'line',
    data: {
      labels: sparseLabels,
      datasets: [{
        data,
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2.5,
      }]
    },
    options: {
      layout: { padding: { left: 4, right: 20, top: 8, bottom: 4 } },
      legend: { display: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.1)' },
          ticks: {
            font: { size: 11, family: 'Arial,sans-serif' },
            color: '#94a3b8',
            maxRotation: 0,
            autoSkip: false,
            padding: 8,
          }
        },
        y: {
          min: yMin,
          max: yMax,
          position: 'right',
          grid: { color: 'rgba(148,163,184,0.1)' },
          ticks: {
            font: { size: 11, family: 'Arial,sans-serif' },
            color: '#64748b',
            maxTicksLimit: 6,
            padding: 10,
            callback: `function(v){return v.toFixed(${dp});}`
          }
        }
      }
    }
  };

  const encoded = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?w=560&h=${height}&bkg=%23ffffff&c=${encoded}`;
}

// ─── Fetch live intraday data from Yahoo Finance ───────────────────────────────
async function fetchIntradayData(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m&includePrePost=false`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const meta = result.meta || {};

  // Filter out null closes and sample to ~22 points
  const pairs = timestamps
    .map((t, i) => ({ t, c: closes[i] }))
    .filter(p => p.c != null && !isNaN(p.c));

  if (pairs.length < 3) return null;

  const step = Math.max(1, Math.floor(pairs.length / 22));
  const sampled = [];
  for (let j = 0; j < pairs.length; j += step) sampled.push(pairs[j]);
  // Always include last point
  if (sampled[sampled.length - 1] !== pairs[pairs.length - 1]) {
    sampled.push(pairs[pairs.length - 1]);
  }

  const labels = sampled.map(p => {
    const d = new Date(p.t * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  });
  const data = sampled.map(p => parseFloat(p.c.toFixed(6)));

  const open = data[0];
  const close = data[data.length - 1];
  const high = Math.max(...data);
  const low = Math.min(...data);
  const changeAbs = close - open;
  const changePct = ((changeAbs / open) * 100).toFixed(2);
  const isUp = changeAbs >= 0;

  return { labels, data, open, close, high, low, changeAbs, changePct, isUp, currency: meta.currency || '', symbol };
}

// ─── Unsplash free image — contextual, clean, no copyright issues ──────────────
// Using Unsplash Source API (free, no API key needed, returns actual images)
// We pick specific photo IDs that are highly relevant to finance topics
const UNSPLASH_TOPICS = {
  equities:     'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',   // stock market screens
  stocks:       'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
  nasdaq:       'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=600&q=80',   // NYSE trading floor
  sp500:        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80',   // financial charts
  bonds:        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80',       // financial documents
  'fixed income': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80',
  rates:        'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80',       // Federal Reserve
  'central banks': 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80',
  fed:          'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80',
  oil:          'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&q=80',   // oil refinery
  commodities:  'https://images.unsplash.com/photo-1590650046871-92c887180603?w=600&q=80',   // commodities/gold
  gold:         'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=600&q=80',   // gold bars
  fx:           'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&q=80',   // currency/forex
  currency:     'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&q=80',
  geopolitics:  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',   // world map / diplomacy
  macro:        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',       // data/analytics
  'macro data': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  credit:       'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80',   // credit cards/finance
  tech:         'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',   // technology
  technology:   'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  'emerging markets': 'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=600&q=80', // emerging market city
};

function getContextualImage(label, headline) {
  const combined = (label + ' ' + headline).toLowerCase();
  for (const [keyword, url] of Object.entries(UNSPLASH_TOPICS)) {
    if (combined.includes(keyword)) return url;
  }
  return null;
}

// ─── Wrap a visual block (chart or image) in the same outer <tr><td> as section cards ──
function visualRowHtml(innerHtml) {
  return `<tr><td style="padding:0 0 16px 0;">${innerHtml}</td></tr>`;
}

// ─── Chart card HTML ───────────────────────────────────────────────────────────
function chartCardHtml({ title, symbol, chartUrl, caption, open, close, high, low, changePct, isUp }) {
  const changeColor = isUp ? '#10b981' : '#ef4444';
  const arrow = isUp ? '▲' : '▼';
  const sign = parseFloat(changePct) >= 0 ? '+' : '';

  function fmt(val) {
    if (typeof val !== 'number') return '–';
    const abs = Math.abs(val);
    const dp = abs >= 10000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : 4;
    return val.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  const ohlc = [['Open', open], ['High', high], ['Low', low], ['Close', close]];

  return `
  <div style="border-radius:12px;border:1px solid #e2e8f0;background:#ffffff;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:#f8fafc;padding:18px 22px 16px;border-bottom:1px solid #eef2f7;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:8px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Intraday · Today's Session</div>
            <div style="font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">${title}</div>
            <div style="font-size:10px;color:#94a3b8;font-weight:600;margin-top:3px;letter-spacing:0.5px;">${symbol}</div>
          </td>
          <td style="vertical-align:top;text-align:right;padding-left:12px;">
            <div style="font-size:24px;font-weight:800;color:#0f172a;font-variant-numeric:tabular-nums;letter-spacing:-0.5px;">${fmt(close)}</div>
            <div style="font-size:13px;font-weight:700;color:${changeColor};margin-top:3px;">${arrow}&nbsp;${sign}${changePct}% today</div>
          </td>
        </tr>
      </table>
    </div>
    <!-- OHLC strip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #eef2f7;">
      <tr>
        ${ohlc.map(([lbl, val], idx) => `
        <td width="25%" style="text-align:center;padding:12px 8px;${idx < 3 ? 'border-right:1px solid #eef2f7;' : ''}">
          <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">${lbl}</div>
          <div style="font-size:13px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">${fmt(val)}</div>
        </td>`).join('')}
      </tr>
    </table>
    <!-- Chart — full bleed -->
    <img src="${chartUrl}" alt="${title} intraday" style="display:block;width:100%;max-width:100%;border:none;" />
    <!-- Caption -->
    ${caption ? `<div style="padding:12px 22px 14px;border-top:1px solid #eef2f7;">
      <div style="font-size:11px;color:#64748b;line-height:1.65;font-style:italic;">${caption}</div>
    </div>` : ''}
  </div>`;
}

// ─── Image block HTML ──────────────────────────────────────────────────────────
function imageBlockHtml({ imageUrl, caption }) {
  return `
  <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
    <img src="${imageUrl}" alt="" style="display:block;width:100%;max-width:100%;height:auto;min-height:200px;object-fit:cover;border:none;" />
    ${caption ? `<div style="background:#f8fafc;padding:10px 20px;border-top:1px solid #f1f5f9;">
      <div style="font-size:10px;color:#94a3b8;line-height:1.5;font-style:italic;">${caption}</div>
    </div>` : ''}
  </div>`;
}

// ─── Section card HTML ─────────────────────────────────────────────────────────
function sectionCardHtml({ label, headline, body, callout, accent }) {
  const cleanBody = (body || '')
    .replace(/\s*\(https?:\/\/[^\)]+\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s*\[[^\]]*\]\s*\(https?:\/\/[^\)]+\)/g, '');
  const bodyHtml = cleanBody.replace(/\n/g, '<br/>');

  return `
  <tr><td style="padding:0 0 16px 0;">
    <div style="border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
      <div style="height:3px;background:${accent};"></div>
      <div style="padding:24px 28px 26px;">
        <!-- Label -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td style="padding-right:8px;vertical-align:middle;">
              <div style="width:7px;height:7px;background:${accent};border-radius:50%;"></div>
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};">${label || ''}</span>
            </td>
          </tr>
        </table>
        <!-- Headline -->
        <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${headline}</div>
        <!-- Body -->
        <div style="font-size:14px;color:#475569;line-height:1.9;margin-bottom:${callout ? '18px' : '0'};">${bodyHtml}</div>
        <!-- Callout -->
        ${callout ? `<div style="border-radius:8px;background:#f8fafc;border-left:3px solid ${accent};padding:14px 18px;">
          <div style="font-size:13px;color:#374151;line-height:1.7;font-style:italic;">${callout}</div>
        </div>` : ''}
      </div>
    </div>
  </td></tr>`;
}

// ─── Full email HTML ───────────────────────────────────────────────────────────
function buildEmailHtml({ subject, dateStr, marketSnapshot, sectionBlocks, footerNote }) {
  const headerGradient = 'background:linear-gradient(90deg,#3b82f6,#6366f1,#818cf8);';
  const editionColor = '#6366f1';

  function snapCard(m) {
    const raw = String(m.change || '');
    const isPos = raw.startsWith('+');
    const isNeg = raw.startsWith('-');
    const changeColor = isPos ? '#10b981' : isNeg ? '#ef4444' : '#9ca3af';
    const arrow = isPos ? '▲' : isNeg ? '▼' : '–';
    return `
    <td style="padding:0 6px 0 0;vertical-align:top;">
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 12px;min-width:88px;">
        <div style="font-size:7px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#64748b;margin-bottom:7px;white-space:nowrap;">${m.label}</div>
        <div style="font-size:14px;font-weight:800;color:#f1f5f9;margin-bottom:5px;font-variant-numeric:tabular-nums;white-space:nowrap;">${m.value}</div>
        <div style="font-size:10px;font-weight:700;color:${changeColor};white-space:nowrap;">${arrow} ${m.change}</div>
      </div>
    </td>`;
  }

  const snap = (marketSnapshot || []).slice(0, 5);
  const snapshotRow = snap.map(m => snapCard(m)).join('') + '<td></td>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 12px 40px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- Wordmark -->
  <tr><td style="padding-bottom:20px;text-align:center;">
    <span style="font-size:9px;letter-spacing:5px;color:#94a3b8;text-transform:uppercase;font-weight:800;">The Keystone Macro Brief</span>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;overflow:hidden;">
    <div style="height:4px;${headerGradient}"></div>
    <div style="padding:36px 36px 32px;">
      <div style="font-size:9px;letter-spacing:3px;color:${editionColor};text-transform:uppercase;font-weight:800;margin-bottom:10px;">Evening Wrap &nbsp;·&nbsp; ${dateStr}</div>
      <div style="font-size:26px;font-weight:800;color:#f8fafc;line-height:1.25;font-family:Georgia,'Times New Roman',serif;margin-bottom:16px;">${subject}</div>
      <div style="display:inline-block;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);border-radius:6px;padding:4px 10px;">
        <span style="font-size:8px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#a5b4fc;">Premium Edition &nbsp;·&nbsp; Charts &amp; Analysis</span>
      </div>
    </div>
  </td></tr>

  <!-- Market Snapshot -->
  <tr><td style="background:#0f172a;border-bottom:1px solid #1e293b;padding:0 36px 28px;">
    <div style="font-size:8px;letter-spacing:2.5px;color:#475569;text-transform:uppercase;font-weight:800;margin-bottom:14px;">Live Market Snapshot</div>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>${snapshotRow}</tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="height:10px;background:#f1f5f9;"></td></tr>

  <!-- Sections -->
  <tr><td style="background:#f1f5f9;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#0f172a;border-radius:12px;padding:28px 36px;text-align:center;margin-top:4px;">
    <div style="font-size:11px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:16px;">Continue reading online</div>
    <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#ffffff;font-size:13px;font-weight:700;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Open Full Edition →</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:24px 36px;text-align:center;">
    <div style="font-size:12px;color:#64748b;line-height:1.8;font-style:italic;margin-bottom:14px;">${footerNote}</div>
    <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
      <span style="font-size:10px;color:#94a3b8;line-height:2.2;">
        The Keystone Macro Brief &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence<br/>
        Charts sourced from live market data and are for illustrative purposes only.<br/>
        <a href="https://keystonemacro.com/Newsletter#manage" style="color:${editionColor};text-decoration:none;font-weight:600;">Manage subscription</a>
      </span>
    </div>
  </td></tr>

  <tr><td style="height:24px;"></td></tr>
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const isoDate = now.toISOString().split('T')[0];

    const ACCENTS = ['#6366f1', '#d97706', '#10b981', '#f43f5e', '#06b6d4', '#8b5cf6'];

    // ── Two parallel LLM calls ────────────────────────────────────────────────
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead macro analyst at Keystone Macro. Today is ${dateStr} (${isoDate}).
Return JSON with today's REAL, VERIFIED closing/current data:
- subject_line: the single most important market story today in one punchy line (max 70 chars, no emojis, no clickbait)
- market_snapshot: exactly 5 objects with label/value/change for: S&P 500 (^GSPC), 10Y UST Yield (^TNX), DXY (DX-Y.NYB), Gold (GC=F), Brent Crude (BZ=F). Values must be today's real numbers.
- footer_note: one sharp closing insight about today's session. No emojis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            subject_line: { type: 'string' },
            market_snapshot: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, change: { type: 'string' } } } },
            footer_note: { type: 'string' }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead macro analyst at Keystone Macro writing the Evening Wrap for ${dateStr} (${isoDate}).

STRICT RULES:
1. Every figure, price, % move, name, and event MUST be real and verified from today (${isoDate}). No fabrication.
2. No URLs, hyperlinks, source citations, footnotes. Pure prose.
3. No emojis.
4. Write like a senior sell-side analyst — sharp, specific, authoritative.

Write EXACTLY 4 sections. Choose the 4 most important market-moving themes from today.

For EXACTLY 2 sections — the ones with the most significant, chart-worthy intraday price movement today — provide a chart_config.
For EXACTLY 2 sections — where context, geopolitics, or macro narrative matters more than price action — provide an image_topic instead.

Do NOT provide both chart_config and image_topic for the same section.

Return JSON:
- sections: array of 4 objects, each with:
  - label: category tag (Equities / Fixed Income / FX / Commodities / Macro / Geopolitics / Central Banks / M&A / Credit / Emerging Markets)
  - headline: specific punchy headline anchored to today's real event
  - body: 4 dense sentences with exact tickers, levels, % moves, named people/companies
  - callout: 1 forward-looking sentence — a specific upcoming catalyst
  - chart_config (ONLY for 2 sections with most price movement): {
      yahoo_symbol: exact Yahoo Finance ticker (e.g. "^GSPC" for S&P, "GC=F" for Gold, "^TNX" for 10Y yield, "CL=F" for WTI, "EURUSD=X" for EUR/USD, "^NDX" for Nasdaq 100),
      title: instrument display name (e.g. "S&P 500", "Gold Spot", "EUR/USD"),
      caption: one sentence explaining what the intraday chart reveals about today's session
    }
  - image_topic (ONLY for 2 sections where narrative > price action): one of these exact strings based on what fits best:
      "oil_refinery" | "federal_reserve" | "stock_exchange" | "gold_bars" | "currency_trading" | "world_diplomacy" | "tech_industry" | "emerging_city" | "bond_market" | "commodity_fields"`,
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
                  callout: { type: 'string' },
                  chart_config: {
                    type: 'object',
                    properties: {
                      yahoo_symbol: { type: 'string' },
                      title: { type: 'string' },
                      caption: { type: 'string' }
                    }
                  },
                  image_topic: { type: 'string' }
                }
              }
            }
          }
        }
      })
    ]);

    const subject = metaRes.subject_line || `Evening Wrap — ${dateStr}`;
    const marketSnapshot = metaRes.market_snapshot || [];
    const sections = sectionsRes.sections || [];
    const footerNote = metaRes.footer_note || 'Markets close. The analysis never stops.';

    // ── Image topic → Unsplash URL map (high quality, tightly correlated) ─────
    const IMAGE_MAP = {
      oil_refinery:     'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=700&q=90&fit=crop',  // oil refinery at dusk
      federal_reserve:  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=700&q=90&fit=crop',  // Federal Reserve building
      stock_exchange:   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=90&fit=crop',  // trader at screens
      gold_bars:        'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=700&q=90&fit=crop',  // gold bullion bars
      currency_trading: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=700&q=90&fit=crop',  // currency/FX desk
      world_diplomacy:  'https://images.unsplash.com/photo-1554734867-bf3c00a49371?w=700&q=90&fit=crop',     // UN / diplomacy hall
      tech_industry:    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&q=90&fit=crop',  // circuit board / tech
      emerging_city:    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=90&fit=crop',  // emerging market skyline
      bond_market:      'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=700&q=90&fit=crop',     // treasury / bond paperwork desk
      commodity_fields: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&q=90&fit=crop',  // wheat fields / commodities
    };

    // ── Fetch chart data only for the SINGLE best chart section ──────────────
    // Find first section with a chart_config
    const chartSectionIdx = sections.findIndex(s => s.chart_config?.yahoo_symbol);
    const chartDataMap = {};
    if (chartSectionIdx >= 0) {
      const sym = sections[chartSectionIdx].chart_config.yahoo_symbol;
      // Try primary symbol, fall back to ^GSPC if fetch fails
      let d = null;
      for (const trySymbol of [sym, '^GSPC']) {
        try {
          d = await fetchIntradayData(trySymbol);
          if (d) break;
        } catch (_) { /* try next */ }
      }
      if (d) chartDataMap[chartSectionIdx] = d;
    }

    // ── Find the SINGLE best image section (first with image_topic, not the chart section) ──
    const imageSectionIdx = sections.findIndex((s, i) => i !== chartSectionIdx && s.image_topic && IMAGE_MAP[s.image_topic]);

    // ── Build section HTML blocks ─────────────────────────────────────────────
    let sectionBlocks = '';
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const accent = ACCENTS[i % ACCENTS.length];

      // Chart — only for the one chosen section
      let chartHtml = '';
      if (i === chartSectionIdx && chartDataMap[i]) {
        const d = chartDataMap[i];
        const url = buildChartUrl({ labels: d.labels, data: d.data, isUp: d.isUp, height: 290 });
        if (url) {
          chartHtml = chartCardHtml({
            title: s.chart_config.title,
            symbol: s.chart_config.yahoo_symbol,
            chartUrl: url,
            caption: s.chart_config.caption,
            open: d.open,
            close: d.close,
            high: d.high,
            low: d.low,
            changePct: d.changePct,
            isUp: d.isUp,
          });
        }
      }

      // Image — only for the one chosen section
      let imageHtml = '';
      if (i === imageSectionIdx) {
        imageHtml = imageBlockHtml({
          imageUrl: IMAGE_MAP[s.image_topic],
          caption: s.label,
        });
      }

      sectionBlocks += sectionCardHtml({
        label: s.label,
        headline: s.headline,
        body: s.body,
        callout: s.callout,
        accent,
      });
      if (chartHtml) sectionBlocks += visualRowHtml(chartHtml);
      if (imageHtml) sectionBlocks += visualRowHtml(imageHtml);
    }

    const htmlBody = buildEmailHtml({ subject, dateStr, marketSnapshot, sectionBlocks, footerNote });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'kaicard05@gmail.com',
      subject: `[TEST] The Keystone Macro Brief — Evening Wrap — ${dateStr}`,
      body: htmlBody,
      from_name: 'The Keystone Macro Brief',
    });

    return Response.json({
      message: 'Test edition sent to kaicard05@gmail.com',
      subject,
      chart_section: chartSectionIdx >= 0 ? sections[chartSectionIdx]?.label : 'none',
      image_section: imageSectionIdx >= 0 ? sections[imageSectionIdx]?.label : 'none',
      sections: sections.map((s, i) => ({
        label: s.label,
        headline: s.headline,
        has_chart: i === chartSectionIdx && !!chartDataMap[i],
        has_image: i === imageSectionIdx,
      }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});