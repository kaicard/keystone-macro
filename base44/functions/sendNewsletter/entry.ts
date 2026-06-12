import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Prettify label ────────────────────────────────────────────────────────────
function prettyLabel(raw) {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

const SECTION_ACCENTS = ['#6366f1','#d97706','#10b981','#f43f5e','#06b6d4','#8b5cf6'];

// ─── Chart builder ─────────────────────────────────────────────────────────────
function buildChartUrl({ labels, data, isUp, height = 290 }) {
  const validData = data.filter(d => d != null && !isNaN(d));
  if (validData.length < 3) return null;
  const minVal = Math.min(...validData);
  const maxVal = Math.max(...validData);
  const range = maxVal - minVal || minVal * 0.005;
  const pad = range * 0.18;
  const yMin = parseFloat((minVal - pad).toFixed(6));
  const yMax = parseFloat((maxVal + pad).toFixed(6));
  const mag = Math.abs(validData[0]);
  const dp = mag >= 10000 ? 0 : mag >= 100 ? 1 : mag >= 1 ? 2 : 4;
  const maxLabels = 12;
  const step = Math.max(1, Math.floor(labels.length / maxLabels));
  const sparseLabels = labels.map((l, i) => (i % step === 0 ? l : ''));
  const lineColor = isUp ? '#10b981' : '#ef4444';
  const fillColor = isUp ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)';
  const chartConfig = {
    type: 'line',
    data: { labels: sparseLabels, datasets: [{ data, borderColor: lineColor, backgroundColor: fillColor, fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
    options: {
      layout: { padding: { left: 8, right: 24, top: 16, bottom: 8 } },
      legend: { display: false },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { grid: { color: 'rgba(226,232,240,0.6)', lineWidth: 1 }, ticks: { font: { size: 10, family: "'Helvetica Neue',Arial,sans-serif" }, color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 8, padding: 10 }, border: { display: false } },
        y: { min: yMin, max: yMax, position: 'right', grid: { color: 'rgba(226,232,240,0.6)', lineWidth: 1 }, ticks: { font: { size: 10, family: "'Helvetica Neue',Arial,sans-serif" }, color: '#94a3b8', maxTicksLimit: 6, padding: 12, callback: `function(v){return v.toLocaleString('en-US',{minimumFractionDigits:${dp},maximumFractionDigits:${dp}});}` }, border: { display: false } }
      }
    }
  };
  return `https://quickchart.io/chart?w=560&h=${height}&bkg=%23ffffff&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

// ─── Fetch intraday data ───────────────────────────────────────────────────────
async function fetchIntradayData(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m&includePrePost=false`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const meta = result.meta || {};
  const pairs = timestamps.map((t, i) => ({ t, c: closes[i] })).filter(p => p.c != null && !isNaN(p.c));
  if (pairs.length < 3) return null;
  const step = Math.max(1, Math.floor(pairs.length / 22));
  const sampled = [];
  for (let j = 0; j < pairs.length; j += step) sampled.push(pairs[j]);
  if (sampled[sampled.length - 1] !== pairs[pairs.length - 1]) sampled.push(pairs[pairs.length - 1]);
  const labels = sampled.map(p => {
    const d = new Date(p.t * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  });
  const data = sampled.map(p => parseFloat(p.c.toFixed(6)));
  const open = data[0]; const close = data[data.length - 1];
  const high = Math.max(...data); const low = Math.min(...data);
  const changeAbs = close - open;
  const changePct = ((changeAbs / open) * 100).toFixed(2);
  const isUp = changeAbs >= 0;
  return { labels, data, open, close, high, low, changeAbs, changePct, isUp, symbol };
}

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

const IMAGE_MAP = {
  oil_refinery:     'https://images.unsplash.com/photo-1574018856533-3e5c20f8c3c4?w=700&q=90&fit=crop',
  federal_reserve:  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=700&q=90&fit=crop',
  stock_exchange:   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=90&fit=crop',
  gold_bars:        'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=700&q=90&fit=crop',
  currency_trading: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=700&q=90&fit=crop',
  world_diplomacy:  'https://images.unsplash.com/photo-1554734867-bf3c00a49371?w=700&q=90&fit=crop',
  tech_industry:    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&q=90&fit=crop',
  emerging_city:    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=90&fit=crop',
  bond_market:      'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=700&q=90&fit=crop',
  commodity_fields: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=700&q=90&fit=crop',
};

// ─── Section card HTML ─────────────────────────────────────────────────────────
function sectionCardHtml({ label, headline, body, callout, accent }) {
  const cleanBody = (body || '')
    .replace(/\s*\(https?:\/\/[^\)]+\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s*\[[^\]]*\]\s*\(https?:\/\/[^\)]+\)/g, '');
  const bodyHtml = cleanBody.replace(/\n/g, '<br/>');
  return `<tr><td style="padding:0 0 16px 0;">
    <div style="border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
      <div style="height:3px;background:${accent};"></div>
      <div style="padding:24px 28px 26px;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td style="padding-right:8px;vertical-align:middle;"><div style="width:7px;height:7px;background:${accent};border-radius:50%;"></div></td>
            <td style="vertical-align:middle;"><span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};">${label || ''}</span></td>
          </tr>
        </table>
        <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${headline}</div>
        <div style="font-size:14px;color:#475569;line-height:1.9;margin-bottom:${callout ? '18px' : '0'};">${bodyHtml}</div>
        ${callout ? `<div style="border-radius:8px;background:#f8fafc;border-left:3px solid ${accent};padding:14px 18px;"><div style="font-size:13px;color:#374151;line-height:1.7;font-style:italic;">${callout}</div></div>` : ''}
      </div>
    </div>
  </td></tr>`;
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
  return `<tr><td style="padding:0 0 16px 0;">
    <div style="border-radius:12px;border:1px solid #e2e8f0;background:#ffffff;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
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
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #eef2f7;">
        <tr>${ohlc.map(([lbl, val], idx) => `<td width="25%" style="text-align:center;padding:12px 8px;${idx < 3 ? 'border-right:1px solid #eef2f7;' : ''}"><div style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">${lbl}</div><div style="font-size:13px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums;">${fmt(val)}</div></td>`).join('')}</tr>
      </table>
      <img src="${chartUrl}" alt="${title} intraday" style="display:block;width:100%;max-width:100%;border:none;" />
      ${caption ? `<div style="padding:12px 22px 14px;border-top:1px solid #eef2f7;"><div style="font-size:11px;color:#64748b;line-height:1.65;font-style:italic;">${caption}</div></div>` : ''}
    </div>
  </td></tr>`;
}

// ─── Image block HTML ──────────────────────────────────────────────────────────
function imageBlockHtml({ imageUrl, caption }) {
  return `<tr><td style="padding:0 0 16px 0;">
    <div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
      <img src="${imageUrl}" alt="" style="display:block;width:100%;max-width:100%;height:auto;min-height:200px;object-fit:cover;border:none;" />
      ${caption ? `<div style="background:#f8fafc;padding:10px 20px;border-top:1px solid #f1f5f9;"><div style="font-size:10px;color:#94a3b8;line-height:1.5;font-style:italic;">${caption}</div></div>` : ''}
    </div>
  </td></tr>`;
}

// ─── Snapshot row HTML ─────────────────────────────────────────────────────────
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

// ─── Full email HTML ───────────────────────────────────────────────────────────
function buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sectionBlocks, footerNote, isMorning }) {
  const headerGradient = isMorning
    ? 'background:linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);'
    : 'background:linear-gradient(90deg,#3b82f6,#6366f1,#818cf8);';
  const editionColor = isMorning ? '#d97706' : '#6366f1';
  const editionBadge = isMorning ? 'Morning Brief' : 'Evening Wrap';
  const snap = (marketSnapshot || []).slice(0, 5);
  const snapshotRows = snap.map((m, i) => snapRow(m, i === snap.length - 1)).join('');

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
      .section-pad{padding:20px 18px 22px!important;}
      .cta-pad{padding:24px 20px!important;}
      .footer-pad{padding:20px 20px!important;}
      .hero-title{font-size:20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;">
<tr><td align="center" class="outer-wrap" style="padding:28px 16px 40px;">
<table class="main-table" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- Wordmark -->
  <tr><td style="padding-bottom:18px;text-align:center;">
    <span style="font-size:8px;letter-spacing:5px;color:#94a3b8;text-transform:uppercase;font-weight:800;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">The Keystone Macro Brief</span>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#0f172a;border-radius:14px 14px 0 0;overflow:hidden;">
    <div style="height:3px;${headerGradient}"></div>
    <div class="hero-pad" style="padding:32px 32px 28px;">
      <div style="font-size:9px;letter-spacing:2.5px;color:${editionColor};text-transform:uppercase;font-weight:700;margin-bottom:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${editionBadge} &nbsp;·&nbsp; ${dateStr}</div>
      <div class="hero-title" style="font-size:24px;font-weight:800;color:#f8fafc;line-height:1.3;font-family:Georgia,'Times New Roman',serif;margin-bottom:18px;">${subject}</div>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);border-radius:5px;padding:4px 10px;">
          <span style="font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Premium Edition &nbsp;·&nbsp; Charts &amp; Analysis</span>
        </td></tr>
      </table>
    </div>
  </td></tr>

  <!-- Market Snapshot -->
  <tr><td style="background:#0f172a;" class="snap-pad">
    <div style="padding:0 28px 24px;">
      <div style="font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:14px;padding-top:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">&#x25A0;&nbsp; Live Market Snapshot</div>
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
    </table>
  </td></tr>

  <!-- Gap -->
  <tr><td style="height:4px;"></td></tr>

  <!-- CTA -->
  <tr><td style="background:#0f172a;border-radius:12px;overflow:hidden;" class="cta-pad">
    <div style="padding:28px 36px;text-align:center;">
      <div style="font-size:10px;color:#475569;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Read the full edition online</div>
      <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#ffffff;font-size:13px;font-weight:700;padding:12px 30px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Open Full Edition →</a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td class="footer-pad" style="padding:22px 32px;text-align:center;">
    <div style="font-size:12px;color:#64748b;line-height:1.9;font-style:italic;margin-bottom:16px;font-family:Georgia,'Times New Roman',serif;">${footerNote}</div>
    <div style="border-top:1px solid #e2e8f0;padding-top:14px;">
      <span style="font-size:10px;color:#94a3b8;line-height:2.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        The Keystone Macro Brief &nbsp;·&nbsp; Institutional Research &amp; Market Intelligence<br/>
        <a href="https://keystonemacro.com/Newsletter#manage" style="color:${editionColor};text-decoration:none;font-weight:600;">Manage subscription</a>
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

    // ── Fetch recent editions to avoid repeating content ────────────────────
    const recentEditions = await base44.asServiceRole.entities.NewsletterEdition.list('-published_at', 5);
    const recentContext = recentEditions.length > 0
      ? `\n\nPREVIOUS EDITIONS — do NOT repeat these subjects or angles:\n${recentEditions.map(e => `- [${e.publish_date}] "${e.title}"`).join('\n')}\nTake a FRESH ANGLE even on recurring themes.`
      : '';

    // ── Fetch real market snapshot ───────────────────────────────────────────
    const realSnapshot = await fetchSnapshotData();
    const snapshotSummary = realSnapshot.length > 0
      ? realSnapshot.map(m => `${m.label}: ${m.value} (${m.change})`).join(' | ')
      : 'Market data temporarily unavailable — describe direction and trends only, do NOT fabricate specific prices or levels.';

    // ── Two parallel LLM calls ───────────────────────────────────────────────
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro. Today is ${dateStr} (${isoDate}). This is the ${editionLabel}.${recentContext}

REAL MARKET DATA (just fetched from live feeds — use as context):
${snapshotSummary}

Return JSON:
- subject_line: punchy unique subject line referencing today's real market moves (max 72 chars), no emojis
- footer_note: sharp 1-line closing observation. No emojis.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            subject_line: { type: 'string' },
            footer_note: { type: 'string' }
          }
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro writing the ${editionLabel} for ${dateStr} (${isoDate}) — a ${timeContext}.${recentContext}

REAL MARKET DATA (all prices below are from live feeds — do NOT fabricate any number):
${snapshotSummary}

STRICT RULES:
1. Every fact, figure, price, and event MUST be from TODAY (${isoDate}). Use the real data above. No fabrication of any price, level, or percentage.
2. No URLs, hyperlinks, citations. Pure prose only.
3. No emojis.
4. Write like a senior Goldman Sachs analyst — sharp, specific, authoritative.

Write EXACTLY 6 sections. For EXACTLY 2 sections (most significant price movement) provide chart_config. For EXACTLY 2 sections (narrative/context matters more) provide image_topic. The remaining 2 have neither.

Return JSON:
- sections: array of 6 objects, each with:
  - label: category (Equities / Fixed Income / FX / Commodities / Macro / Geopolitics / Central Banks / M&A / Credit / Emerging Markets)
  - headline: specific punchy headline anchored to today's real event
  - body: 4-5 dense sentences with exact tickers, levels, % moves, named people/companies
  - callout: 1 forward-looking sentence — specific upcoming catalyst
  - chart_config (ONLY for 2 sections with most price movement): { yahoo_symbol, title, caption }
  - image_topic (ONLY for 2 narrative sections): one of: "oil_refinery" | "federal_reserve" | "stock_exchange" | "gold_bars" | "currency_trading" | "world_diplomacy" | "tech_industry" | "emerging_city" | "bond_market" | "commodity_fields"`,
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
                  chart_config: { type: 'object', properties: { yahoo_symbol: { type: 'string' }, title: { type: 'string' }, caption: { type: 'string' } } },
                  image_topic: { type: 'string' }
                }
              }
            }
          }
        }
      })
    ]);

    const subject = metaRes.subject_line || `The Keystone Macro Brief — ${editionLabel} — ${dateStr}`;
    const marketSnapshot = realSnapshot;
    const sections = sectionsRes.sections || [];
    const footerNote = metaRes.footer_note || 'Markets close. The analysis never stops.';

    // ── Fetch chart data for first section with a chart_config ───────────────
    const chartSectionIdx = sections.findIndex(s => s.chart_config?.yahoo_symbol);
    const chartDataMap = {};
    if (chartSectionIdx >= 0) {
      const sym = sections[chartSectionIdx].chart_config.yahoo_symbol;
      for (const trySymbol of [sym, '^GSPC']) {
        try { const d = await fetchIntradayData(trySymbol); if (d) { chartDataMap[chartSectionIdx] = d; break; } } catch (_) {}
      }
    }
    const imageSectionIdx = sections.findIndex((s, i) => i !== chartSectionIdx && s.image_topic && IMAGE_MAP[s.image_topic]);

    // ── Build section HTML blocks ────────────────────────────────────────────
    let sectionBlocks = '';
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const accent = SECTION_ACCENTS[i % SECTION_ACCENTS.length];
      sectionBlocks += sectionCardHtml({ label: s.label, headline: s.headline, body: s.body, callout: s.callout, accent });
      if (i === chartSectionIdx && chartDataMap[i]) {
        const d = chartDataMap[i];
        const url = buildChartUrl({ labels: d.labels, data: d.data, isUp: d.isUp, height: 290 });
        if (url) sectionBlocks += chartCardHtml({ title: s.chart_config.title, symbol: s.chart_config.yahoo_symbol, chartUrl: url, caption: s.chart_config.caption, open: d.open, close: d.close, high: d.high, low: d.low, changePct: d.changePct, isUp: d.isUp });
      }
      if (i === imageSectionIdx) {
        sectionBlocks += imageBlockHtml({ imageUrl: IMAGE_MAP[s.image_topic], caption: s.label });
      }
    }

    const htmlBody = buildEmailHtml({ subject, editionLabel, dateStr, marketSnapshot, sectionBlocks, footerNote, isMorning: editionType === 'morning' });

    // ── Send to all active subscribers ──────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY');

    let sent = 0;
    const errors = [];
    for (const subscriber of subscribers) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Keystone Macro Brief <hello@keystonemacro.com>',
          to: [subscriber.email],
          subject: `The Keystone Macro Brief — ${subject}`,
          html: htmlBody,
        }),
      });
      const resBody = await res.json();
      if (!res.ok) {
        errors.push({ email: subscriber.email, status: res.status, body: resBody });
      } else {
        sent++;
      }
    }

    // ── Persist as a NewsletterEdition record (upsert) ───────────────────────
    const todaySlug = `${editionType}-${isoDate}`;
    const editionData = {
      title: subject,
      slug: todaySlug,
      edition_type: editionType,
      publish_date: isoDate,
      published_at: now.toISOString(),
      status: 'published',
      market_summary: marketSnapshot.map(m => {
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

    return Response.json({ message: `The Keystone Macro Brief — ${editionLabel} sent successfully`, sent, subject, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});