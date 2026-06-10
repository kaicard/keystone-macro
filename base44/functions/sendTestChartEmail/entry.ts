import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Yahoo Finance chart image endpoint — returns a clean PNG, no branding visible
// Range: 1d, 5d, 1mo, 3mo, 6mo, 1y | Interval: 1m, 5m, 15m, 1h, 1d
function yahooChartUrl(symbol, range = '1d', interval = '5m', width = 520, height = 200) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplit`;
}

// We'll use a sparkline-style chart via quickchart.io which gives clean, unbranded charts
function sparklineChartUrl({ labels, data, label, color = '#d97706', width = 520, height = 160 }) {
  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color + '18',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2.5,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          grid: { color: '#e2e8f0', borderColor: '#e2e8f0' },
          ticks: {
            font: { size: 9, family: 'sans-serif' },
            color: '#94a3b8',
            maxRotation: 0,
            maxTicksLimit: 6,
          }
        },
        y: {
          grid: { color: '#e2e8f0', borderColor: '#e2e8f0' },
          ticks: {
            font: { size: 9, family: 'sans-serif' },
            color: '#94a3b8',
            maxTicksLimit: 5,
          }
        }
      }
    }
  };

  return `https://quickchart.io/chart?w=${width}&h=${height}&bkg=white&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

// Build inline chart block for email HTML
function chartBlock({ title, chartUrl, caption, color = '#d97706' }) {
  return `
  <tr><td style="padding-bottom:16px;">
    <div style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;">
      <div style="height:3px;background:${color};"></div>
      <div style="padding:20px 28px 22px;">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:14px;">${title}</div>
        <img src="${chartUrl}" width="520" alt="${title}" style="display:block;width:100%;max-width:520px;border-radius:6px;border:1px solid #f1f5f9;" />
        ${caption ? `<div style="font-size:11px;color:#94a3b8;margin-top:10px;font-style:italic;line-height:1.6;">${caption}</div>` : ''}
      </div>
    </div>
  </td></tr>`;
}

function buildTestEmailHtml({ subject, dateStr, marketSnapshot, sections, charts, footerNote }) {

  const headerAccent = 'background:linear-gradient(90deg,#3b82f6,#6366f1,#60a5fa);';
  const editionColor = '#3b82f6';

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

  const ACCENTS = ['#d97706','#3b82f6','#8b5cf6','#10b981','#f43f5e','#06b6d4'];

  const sectionBlocks = sections.map((s, i) => {
    const accent = ACCENTS[i % ACCENTS.length];
    const cleanBody = (s.body || '')
      .replace(/\s*\(https?:\/\/[^\)]+\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s*\[[^\]]*\]\s*\(https?:\/\/[^\)]+\)/g, '');
    const bodyHtml = cleanBody.replace(/\n/g, '<br/>');

    // Inject chart after a specific section if one is mapped
    const sectionChart = charts.find(c => c.afterSection === i);
    const chartHtml = sectionChart ? chartBlock({
      title: sectionChart.title,
      chartUrl: sectionChart.url,
      caption: sectionChart.caption,
      color: accent,
    }) : '';

    return `
    <tr><td style="padding-bottom:16px;">
      <div style="border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;background:#ffffff;">
        <div style="height:3px;${headerAccent}opacity:0.6;"></div>
        <div style="padding:24px 28px 28px;">
          ${s.label ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border-collapse:collapse;">
            <tr>
              <td width="8" height="9" style="padding:0 8px 0 0;vertical-align:middle;line-height:9px;">
                <table cellpadding="0" cellspacing="0" border="0" width="8" height="8" style="border-radius:50%;overflow:hidden;">
                  <tr><td width="8" height="8" bgcolor="${accent}" style="width:8px;height:8px;min-width:8px;min-height:8px;border-radius:50%;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>
                </table>
              </td>
              <td style="vertical-align:middle;line-height:9px;">
                <span style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${accent};line-height:9px;display:inline-block;">${s.label}</span>
              </td>
            </tr>
          </table>` : ''}
          <div style="font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;margin-bottom:14px;font-family:Georgia,'Times New Roman',serif;">${s.headline}</div>
          <div style="font-size:14px;color:#475569;line-height:1.85;margin-bottom:${s.callout ? '18px' : '0'};">${bodyHtml}</div>
          ${s.callout ? `<div style="border-radius:8px;background:#f8fafc;border-left:3px solid ${accent};padding:14px 18px;">
            <div style="font-size:13px;color:#374151;line-height:1.7;font-style:italic;">${s.callout}</div>
          </div>` : ''}
        </div>
      </div>
    </td></tr>
    ${chartHtml ? `<tr><td>${chartHtml.replace(/^<tr><td[^>]*>|<\/td><\/tr>$/g,'')}</td></tr>` : ''}`;
  }).join('');

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

  <tr><td style="padding-bottom:18px;text-align:center;">
    <span style="font-size:10px;letter-spacing:4px;color:#94a3b8;text-transform:uppercase;font-weight:700;">The Keystone Macro Brief</span>
  </td></tr>

  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;overflow:hidden;">
    <div style="height:4px;${headerAccent}"></div>
    <div style="padding:36px 40px 32px;">
      <div style="font-size:10px;letter-spacing:2.5px;color:${editionColor};text-transform:uppercase;font-weight:800;margin-bottom:12px;">Evening Wrap &nbsp;·&nbsp; ${dateStr}</div>
      <div style="font-size:28px;font-weight:800;color:#f8fafc;line-height:1.25;font-family:Georgia,'Times New Roman',serif;">${subject}</div>
      <div style="margin-top:10px;display:inline-block;background:#1e3a5f;border:1px solid #3b82f6;border-radius:6px;padding:4px 10px;">
        <span style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#60a5fa;">Premium Edition — Charts Included</span>
      </div>
    </div>
  </td></tr>

  <tr><td style="background:#1e293b;padding:0 40px 28px;">
    <div style="font-size:9px;letter-spacing:2px;color:#64748b;text-transform:uppercase;font-weight:700;padding-top:4px;margin-bottom:12px;">Market Snapshot</div>
    ${snapshotHtml}
  </td></tr>

  <tr><td style="height:8px;background:#f1f5f9;"></td></tr>

  <tr><td style="background:#f1f5f9;padding:0 0 4px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionBlocks}
    </table>
  </td></tr>

  <tr><td style="background:#ffffff;border:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
    <a href="https://keystonemacro.com/Newsletter" style="display:inline-block;background:#0f172a;color:#f8fafc;font-size:12px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">Read Full Edition Online</a>
  </td></tr>

  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
    <div style="font-size:12px;color:#64748b;line-height:1.8;margin-bottom:12px;font-style:italic;">${footerNote}</div>
    <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px;">
      <span style="font-size:11px;color:#94a3b8;line-height:2;">
        The Keystone Macro Brief &nbsp;·&nbsp; Charts are for illustrative purposes only.<br/>
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const isoDate = now.toISOString().split('T')[0];

    // Generate content with LLM — ask it to flag which 2-3 sections have the most chart-worthy price action
    const [metaRes, sectionsRes] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the lead analyst at Keystone Macro. Today is ${dateStr} (${isoDate}). This is a hypothetical Evening Wrap test edition.
Return JSON with:
- subject_line: punchy specific subject line (max 72 chars), no emojis
- market_snapshot: array of 5 objects {label, value, change} — S&P 500, 10Y UST, DXY, Gold, Brent — with today's real levels
- footer_note: sharp 1-line closing observation about today's markets, no emojis`,
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
        prompt: `You are the lead analyst at Keystone Macro writing a hypothetical Evening Wrap test edition for ${dateStr} (${isoDate}).

RULES: No URLs, no source citations, no emojis. Today's real data only.

Write 4 analytical sections. For exactly 2 of those sections (the ones with the most interesting intraday price action today), also return a chart_config object so we can visualise the movement.

Return JSON:
- sections: array of 4 objects each with:
  - label: category (e.g. Equities, Fixed Income, FX, Commodities)
  - headline: punchy specific headline
  - body: 4 dense sentences with exact levels/tickers/percentages
  - callout: 1 forward-looking sentence
  - chart_config: (only for the 2 most chart-worthy sections) object with:
    - yahoo_symbol: the main ticker symbol relevant to this section (e.g. "^GSPC", "GC=F", "DX-Y.NYB", "^TNX", "CL=F", "EURUSD=X")
    - title: short chart title (e.g. "S&P 500 — Intraday")
    - caption: 1 sentence describing what the chart shows and why it matters today
    - color: hex color (#d97706 for equities, #3b82f6 for rates/bonds, #8b5cf6 for FX, #10b981 for commodities)`,
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
                      caption: { type: 'string' },
                      color: { type: 'string' }
                    }
                  }
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

    // Build chart configs — fetch intraday data from Yahoo Finance for each chart_config section
    const charts = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s.chart_config?.yahoo_symbol) continue;

      const { yahoo_symbol, title, caption, color } = s.chart_config;

      // Fetch intraday data from Yahoo Finance
      let chartUrl = null;
      try {
        const yfUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo_symbol)}?range=1d&interval=5m&includePrePost=false`;
        const yfRes = await fetch(yfUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const yfData = await yfRes.json();
        const result = yfData?.chart?.result?.[0];
        const timestamps = result?.timestamp || [];
        const closes = result?.indicators?.quote?.[0]?.close || [];

        if (timestamps.length > 0 && closes.length > 0) {
          // Sample down to ~20 points max for readability
          const step = Math.max(1, Math.floor(closes.length / 20));
          const sampledLabels = [];
          const sampledData = [];
          for (let j = 0; j < closes.length; j += step) {
            if (closes[j] == null) continue;
            const t = new Date(timestamps[j] * 1000);
            sampledLabels.push(t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }));
            sampledData.push(parseFloat(closes[j].toFixed(4)));
          }

          const isUp = sampledData[sampledData.length - 1] >= sampledData[0];
          const finalColor = color || (isUp ? '#10b981' : '#ef4444');

          chartUrl = sparklineChartUrl({
            labels: sampledLabels,
            data: sampledData,
            label: title,
            color: finalColor,
          });
        }
      } catch (_) {
        // If Yahoo fetch fails, skip chart for this section
      }

      if (chartUrl) {
        charts.push({ afterSection: i, title, url: chartUrl, caption, color: color || '#d97706' });
      }
    }

    const htmlBody = buildTestEmailHtml({ subject, dateStr, marketSnapshot, sections, charts, footerNote });

    // Send ONLY to test address
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'kaicard05@gmail.com',
      subject: `[TEST] The Keystone Macro Brief — Evening Wrap — ${dateStr}`,
      body: htmlBody,
      from_name: 'The Keystone Macro Brief',
    });

    return Response.json({
      message: 'Test edition with charts sent to kaicard05@gmail.com',
      subject,
      charts_generated: charts.length,
      sections: sections.map(s => ({ label: s.label, headline: s.headline, has_chart: !!s.chart_config }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});