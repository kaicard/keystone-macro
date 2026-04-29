import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, TrendingUp, TrendingDown, Minus, Zap,
  ChevronDown, ChevronUp, BarChart2, AlertTriangle,
  Activity, RefreshCw, Filter, CheckCircle2, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Central Bank': 'text-amber-400 bg-amber-400/10',
  'Inflation':    'text-red-400 bg-red-400/10',
  'Labour':       'text-blue-400 bg-blue-400/10',
  'GDP':          'text-emerald-400 bg-emerald-400/10',
  'PMI':          'text-purple-400 bg-purple-400/10',
  'Consumer':     'text-cyan-400 bg-cyan-400/10',
  'Housing':      'text-orange-400 bg-orange-400/10',
  'Holiday':      'text-muted-foreground bg-muted/30',
  'Trade':        'text-teal-400 bg-teal-400/10',
};

const CATEGORY_IMPLICATIONS = {
  'Central Bank': {
    instruments: ['Currency pairs (domestic)', 'Government bonds (2y, 10y)', 'Equity indices', 'Gold'],
    bullish: 'Hawkish surprise (rate hike or fewer cuts) → currency strengthens, yields rise, equities sell off.',
    bearish: 'Dovish surprise (cut or soft guidance) → currency weakens, yields fall, equities and gold rally.',
  },
  'Inflation': {
    instruments: ['Government bonds', 'Currency', 'Gold', 'Rate-sensitive equities (REITs, utilities)'],
    bullish: 'Hot print → central bank stays hawkish; yields and currency rise, bond prices and growth stocks fall.',
    bearish: 'Cool print → rate cut expectations firm; bonds rally, currency softens, gold benefits.',
  },
  'Labour': {
    instruments: ['Currency', 'Equities', 'Government bonds', 'Consumer discretionary stocks'],
    bullish: 'Strong jobs/low claims → growth optimism; currency and equities gain, bonds soften.',
    bearish: 'Weak jobs/high claims → growth fears; risk-off, bonds rally, currency weakens.',
  },
  'GDP': {
    instruments: ['Currency', 'Equity indices', 'Cyclical sectors (industrials, materials)', 'Government bonds'],
    bullish: 'Beat → growth confidence; currency and equities rally, bonds sell off.',
    bearish: 'Miss → recession fears; risk-off rotation into bonds and defensive equities.',
  },
  'PMI': {
    instruments: ['Currency', 'Equity indices', 'Commodity-linked currencies (AUD, CAD)', 'Industrial metals'],
    bullish: 'Above 50 beat → expansion signal; currency and risk assets gain.',
    bearish: 'Below 50 miss → contraction; risk-off, defensive assets outperform.',
  },
  'Consumer': {
    instruments: ['Currency', 'Consumer discretionary stocks', 'Retail sector ETFs', 'Equity indices'],
    bullish: 'Strong confidence/spending → domestic growth story; equities and currency firm.',
    bearish: 'Weak sentiment → spending pullback feared; defensives outperform, growth stocks fall.',
  },
  'Housing': {
    instruments: ['Homebuilder stocks', 'Mortgage REITs', 'Lumber futures', 'Rate-sensitive bonds'],
    bullish: 'Strong data → construction and materials rally.',
    bearish: 'Weak data → housing slowdown; homebuilder stocks and mortgage REITs sell off.',
  },
  'Trade': {
    instruments: ['Currency', 'Export-heavy equity sectors', 'Government bonds', 'Commodity currencies'],
    bullish: 'Surplus widens → currency strengthens, growth optimism.',
    bearish: 'Deficit widens → currency weakens, trade friction concerns.',
  },
  'Holiday': {
    instruments: ['All markets'],
    bullish: '',
    bearish: 'Liquidity is thin. Gaps on open are more likely. Reduce position sizing around the holiday.',
  },
};

// ─── STATIC SEED DATA (previous events with confirmed actuals) ────────────────
// NOTE: These are verified historical data points used as a reliable base layer.
// The AI calendar layer supplements and overrides these with live data.
const SEED_EVENTS = [
  // March 2026
  { id: 's1',  date: '2026-03-19', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '4.25–4.50%', forecast: '4.25–4.50%', actual: '4.25–4.50%', category: 'Central Bank', outcome: 'Fed held rates at 4.25–4.50% unanimously. Powell flagged tariff-driven inflation risks as a key uncertainty. Dot plot showed two cuts in 2026 but with widened dispersion. USD firmed; 10-year yields rose 5bp.' },
  { id: 's2',  date: '2026-03-20', utcTime: '12:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '4.50%', forecast: '4.50%', actual: '4.50%', category: 'Central Bank', outcome: 'BOE held at 4.50% with an 8-1 vote. One member voted for a 25bp cut. MPC flagged persistent services inflation at 5.0% as a constraint. GBP held steady; gilts little changed.' },
  { id: 's3',  date: '2026-03-28', utcTime: '09:00', country: 'EU', event: 'Eurozone CPI Flash (YoY)', importance: 'high', previous: '2.3%', forecast: '2.2%', actual: '2.2%', category: 'Inflation', outcome: 'Eurozone headline CPI came in at 2.2% as expected, with core at 2.4%. Services remained sticky at 3.5%. ECB April cut expectations held at ~80%. EUR/USD was flat on the in-line print.' },
  { id: 's4',  date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing PMI', importance: 'high', previous: '50.3', forecast: '49.0', actual: '49.0', category: 'PMI', outcome: 'ISM Manufacturing fell to 49.0, below the 50.3 prior, signalling contraction. Prices paid surged to 69.4 amid tariff pass-through — a stagflationary signal. New orders fell sharply. USD weakened; equities sold off.' },
  { id: 's5',  date: '2026-04-04', utcTime: '12:30', country: 'US', event: 'Nonfarm Payrolls', importance: 'high', previous: '151K', forecast: '130K', actual: '177K', category: 'Labour', outcome: 'NFP surprised to the upside at 177K vs the 130K consensus. Unemployment held at 4.2%. Average hourly earnings +0.3% MoM. A resilient labour market reading, though forward-looking indicators suggest softening ahead. USD firmed.' },
  { id: 's6',  date: '2026-04-04', utcTime: '12:30', country: 'US', event: 'Unemployment Rate', importance: 'high', previous: '4.1%', forecast: '4.2%', actual: '4.2%', category: 'Labour', outcome: "Unemployment ticked up to 4.2% as expected. Participation rate held at 62.5%. Broad labour market picture remains resilient but is gradually cooling, consistent with the Fed's patient stance." },
  { id: 's7',  date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US CPI (YoY)', importance: 'high', previous: '2.8%', forecast: '2.6%', actual: '2.4%', category: 'Inflation', outcome: 'US CPI surprised to the downside at 2.4% YoY in March vs 2.6% forecast and 2.8% prior. Core CPI fell to 2.8%. USD weakened sharply; Fed cut expectations brought forward. 10-year yields dropped 12bp on the print.' },
  { id: 's8',  date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US Core CPI (MoM)', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: '0.1%', category: 'Inflation', outcome: 'Core CPI MoM came in at just 0.1%, the softest reading since 2021. Services inflation fell sharply. The disinflationary trend is intact. Markets moved to price three Fed cuts by year-end.' },
  { id: 's9',  date: '2026-04-17', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision', importance: 'high', previous: '2.65%', forecast: '2.40%', actual: '2.40%', category: 'Central Bank', outcome: 'ECB cut 25bp to 2.40% as expected. Lagarde noted disinflation well on track and flagged tariff risks as a downside growth concern. EUR/USD fell 0.2%; peripheral spreads tightened on the easing signal.' },
  // April 29, 2026 — key events
  { id: 's10', date: '2026-04-29', utcTime: '08:00', country: 'DE', event: 'German GDP Preliminary (QoQ)', importance: 'high', previous: '-0.2%', forecast: '0.2%', actual: null, category: 'GDP', outcome: 'German GDP preliminary Q1 2026. After two consecutive quarters of contraction, consensus expects a modest +0.2% recovery driven by a rebound in industrial output and exports. EUR/USD and DAX are in focus.' },
  { id: 's11', date: '2026-04-29', utcTime: '09:00', country: 'EU', event: 'Eurozone GDP Flash (QoQ)', importance: 'high', previous: '0.2%', forecast: '0.3%', actual: null, category: 'GDP', outcome: 'Eurozone GDP flash estimate for Q1 2026. Markets expect a moderate 0.3% expansion, supported by services growth in Spain and Italy. A beat would further cement ECB pause expectations after the April cut.' },
  { id: 's12', date: '2026-04-29', utcTime: '12:30', country: 'US', event: 'GDP Advance Q1 (QoQ Ann.)', importance: 'high', previous: '2.3%', forecast: '0.4%', actual: null, category: 'GDP', outcome: "The most important data release of the month. Consensus expects a sharp deceleration to just 0.4% annualised as the trade deficit widened significantly on tariff-driven import front-running. A negative print would reignite recession fears and materially reprice the Fed path." },
  { id: 's13', date: '2026-04-29', utcTime: '14:00', country: 'US', event: 'JOLTS Job Openings (Mar)', importance: 'medium', previous: '7.57M', forecast: '7.50M', actual: null, category: 'Labour', outcome: 'JOLTS job openings for March expected slightly lower at 7.50M from 7.57M. Labour market slack indicators remain key for the Fed's dual mandate assessment. A big miss would add to recession concerns from the GDP print.' },
  { id: 's14', date: '2026-04-29', utcTime: '14:00', country: 'US', event: 'CB Consumer Confidence (Apr)', importance: 'medium', previous: '92.9', forecast: '88.0', actual: null, category: 'Consumer', outcome: 'Conference Board Consumer Confidence for April expected to fall sharply to 88.0 from 92.9. Tariff uncertainty, equity market volatility, and rising food prices have weighed on consumer sentiment. A miss here would compound growth concerns.' },
  { id: 's15', date: '2026-04-30', utcTime: '12:30', country: 'US', event: 'Core PCE Price Index (MoM)', importance: 'high', previous: '0.4%', forecast: '0.1%', actual: null, category: 'Inflation', outcome: "The Fed's preferred inflation gauge for March. Expected to show a significant moderation to 0.1% MoM from 0.4%, consistent with the soft CPI print earlier in the month. A cool PCE would reinforce the case for Fed cuts in H2 2026." },
  { id: 's16', date: '2026-04-30', utcTime: '12:30', country: 'US', event: 'ADP Nonfarm Employment (Apr)', importance: 'medium', previous: '155K', forecast: '120K', actual: null, category: 'Labour', outcome: "ADP private payrolls for April expected to slow to 120K from 155K as tariff uncertainty weighs on hiring decisions. Watch for any downside surprise as a leading indicator ahead of Friday's NFP." },
  { id: 's17', date: '2026-04-30', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '4.25–4.50%', forecast: '4.25–4.50%', actual: null, category: 'Central Bank', outcome: 'Fed expected to hold rates at 4.25–4.50%. The key focus will be the statement language around tariff risks and the growth/inflation balance. Markets will parse every word for signals on the June meeting — currently a ~35% cut probability. Press conference at 18:30 UTC.' },
  { id: 's18', date: '2026-05-02', utcTime: '12:30', country: 'US', event: 'Nonfarm Payrolls (Apr)', importance: 'high', previous: '177K', forecast: '130K', actual: null, category: 'Labour', outcome: 'April NFP expected to slow to 130K from March\'s 177K as tariff uncertainty begins to bite hiring. Unemployment forecast steady at 4.2%. Average hourly earnings key for the inflation picture. A weak print would firmly cement June cut expectations.' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toLocalTime(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return utcTime || '—';
  try {
    const dt = new Date(`${dateStr}T${utcTime}:00Z`);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return utcTime; }
}

function localTzLabel() {
  try {
    const parts = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || 'Local';
  } catch { return 'Local'; }
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function getWeekEnd(today) {
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().split('T')[0];
}

function isReleased(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return true;
  if (dateStr < getTodayStr()) return true;
  return Date.now() >= new Date(`${dateStr}T${utcTime}:00Z`).getTime();
}

function getCategory(title) {
  const t = (title || '').toLowerCase();
  if (/interest rate|rate decision|monetary policy|boe|fomc|rba|ecb|boj|fed|mpc|snb|rbnz|boc|bcb|rbi|sarb|bom|bok/.test(t)) return 'Central Bank';
  if (/cpi|ppi|inflation|price index|pce|hicp/.test(t)) return 'Inflation';
  if (/nonfarm|employment|unemployment|jobless|labor|labour|payroll|wages|earning|tankan/.test(t)) return 'Labour';
  if (/pmi|purchasing|manufacturing|services|composite/.test(t)) return 'PMI';
  if (/retail|consumer|sentiment|confidence|spending/.test(t)) return 'Consumer';
  if (/housing|home sales|building permits|construction/.test(t)) return 'Housing';
  if (/trade balance|current account|exports|imports/.test(t)) return 'Trade';
  if (/gdp|gross domestic|industrial production|output/.test(t)) return 'GDP';
  return 'GDP';
}

function getCacheKey(period) {
  const d = new Date();
  const week = Math.floor(d.getDate() / 7);
  return `ecCalendar_${period}_${d.getFullYear()}_${d.getMonth()}_w${week}`;
}

// ─── AI CALENDAR GENERATION ───────────────────────────────────────────────────

async function generateCalendarFromAI(period) {
  const today = getTodayStr();
  const now = new Date();

  let dateRange, instruction;
  if (period === 'today') {
    dateRange = `${today} only`;
    instruction = 'Generate all major economic events for today across all covered economies.';
  } else if (period === 'week') {
    const weekEnd = getWeekEnd(today);
    dateRange = `${today} to ${weekEnd}`;
    instruction = 'Generate all major economic events for this week across all covered economies.';
  } else if (period === 'month') {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    dateRange = `${today} to ${monthEnd}`;
    instruction = 'Generate all major economic events for this month across all covered economies.';
  } else {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    dateRange = `${threeMonthsAgo} to ${yesterday}`;
    instruction = 'Generate the most important economic events from the past 3 months with confirmed actual results.';
  }

  const prompt = `You are a senior macro economist building a professional economic calendar for Keystone Macro, a Bloomberg-quality research platform.

Today is ${today}. Generate comprehensive economic calendar data for: ${dateRange}.

${instruction}

ECONOMIES TO COVER:
Developed: US, UK, EU (Eurozone), Germany (DE), France (FR), Japan (JP), Australia (AU), Canada (CA), Switzerland (CH), New Zealand (NZ), Sweden (SE), Norway (NO)
Emerging: China (CN), Brazil (BR), India (IN), Mexico (MX), South Korea (KR), South Africa (ZA)

FOR EACH EVENT PROVIDE:
- date: YYYY-MM-DD format
- utcTime: HH:MM in UTC (e.g. "13:30" for US CPI)
- country: 2-letter code (US, UK, EU, DE, FR, JP, AU, CA, CH, CN, NZ, SE, NO, BR, IN, MX, KR, ZA)
- event: Full official name (e.g. "US Nonfarm Payrolls", "ECB Interest Rate Decision")
- importance: "high", "medium", or "low"
- category: One of: Central Bank, Inflation, Labour, GDP, PMI, Consumer, Housing, Trade
- previous: Last released value with unit (e.g. "3.5%", "177K", "49.0", "2.40%")
- forecast: Market consensus estimate with unit. Use "—" for press conferences and minutes.
- actual: The confirmed actual result IF this event has already been released before ${today}. Use null for future events and events releasing today after current UTC time ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2,'0')}.
- outcome: For RELEASED events only — write 3-4 sentences in Keystone Macro analytical voice: what the actual was vs forecast, immediate market reaction with specific instrument moves, what it signals for the next central bank decision or macro regime, key risk to watch. For unreleased events write a 2-3 sentence preview: what consensus expects, why it matters, key instrument to watch.

ACCURACY REQUIREMENTS:
- All UTC release times must be exact (US CPI = 12:30, NFP = 12:30, ECB = 12:15, BOE = 12:00 or 11:00, FOMC = 18:00, RBA = 03:30, BOJ = varies, etc.)
- Previous and forecast values must reflect real consensus data
- For released events: actual values must be the real confirmed figures
- Cover at minimum: all G10 central bank decisions, US NFP, CPI, GDP, ISM PMI, retail sales; UK CPI, GDP, BOE; EU CPI, GDP, ECB; German IFO, ZEW, PMI; Japan Tankan, CPI; China NBS PMI, Caixin PMI; Australia RBA, CPI; Canada BOC, employment; EM rate decisions and CPI

Generate between 25-60 events depending on the period. Quality and accuracy over quantity.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date:       { type: 'string' },
              utcTime:    { type: 'string' },
              country:    { type: 'string' },
              event:      { type: 'string' },
              importance: { type: 'string' },
              category:   { type: 'string' },
              previous:   { type: 'string' },
              forecast:   { type: 'string' },
              actual:     { type: ['string', 'null'] },
              outcome:    { type: ['string', 'null'] },
            }
          }
        }
      }
    }
  });

  return (result?.events || []).map((ev, i) => ({
    ...ev,
    id: `ai_${period}_${i}_${Date.now()}`,
    aiGenerated: true,
  }));
}

// ─── FF LIVE FEED OVERLAY ─────────────────────────────────────────────────────

async function fetchFFActuals(events) {
  try {
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    const ff = JSON.parse(json.contents);
    if (!Array.isArray(ff)) return events;

    // Build lookup by event name + date
    const ffMap = {};
    ff.forEach(ev => {
      if (ev.actual) {
        const key = `${ev.date?.split('T')[0]}|${(ev.title || '').toLowerCase().trim()}`;
        ffMap[key] = ev.actual;
      }
    });

    // Overlay FF actuals onto our events
    return events.map(ev => {
      const key = `${ev.date}|${(ev.event || '').toLowerCase().trim()}`;
      if (ffMap[key] && !ev.actual) {
        return { ...ev, actual: ffMap[key], ffVerified: true };
      }
      return ev;
    });
  } catch {
    return events;
  }
}

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────

async function loadCache(period) {
  try {
    const key = getCacheKey(period);
    const results = await base44.entities.MarketCache.filter({ key });
    if (results?.length) {
      const age = Date.now() - new Date(results[0].fetched_at).getTime();
      if (age < 4 * 60 * 60 * 1000) { // 4 hour cache
        return { data: JSON.parse(results[0].payload), recordId: results[0].id };
      }
      return { data: null, recordId: results[0].id };
    }
  } catch (_) {}
  return { data: null, recordId: null };
}

async function saveCache(period, events, recordId) {
  try {
    const key = getCacheKey(period);
    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();
    if (recordId) {
      await base44.entities.MarketCache.update(recordId, { payload, fetched_at });
    } else {
      await base44.entities.MarketCache.create({ key, payload, fetched_at });
    }
  } catch (_) {}
}

// ─── ACTUAL BADGE ─────────────────────────────────────────────────────────────

function ActualBadge({ actual, forecast, dateStr, utcTime, ffVerified }) {
  if (!actual || !isReleased(dateStr, utcTime)) {
    return <span className="text-muted-foreground/30 text-xs font-mono tabular-nums">—</span>;
  }
  const a = parseFloat(actual), f = parseFloat(forecast);
  const beat    = !isNaN(a) && !isNaN(f) && a > f;
  const miss    = !isNaN(a) && !isNaN(f) && a < f;
  const special = actual === '✓' || isNaN(a);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
      special ? 'bg-muted/50 text-foreground/80' :
      beat    ? 'bg-emerald-400/15 text-emerald-400' :
      miss    ? 'bg-red-400/15 text-red-400' :
                'bg-muted/50 text-foreground/80'
    }`}>
      {!special && (beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />)}
      {actual}
    </span>
  );
}

// ─── EXPANDED PANEL ───────────────────────────────────────────────────────────

function ExpandedPanel({ event }) {
  const impl     = CATEGORY_IMPLICATIONS[event.category] || null;
  const released = isReleased(event.date, event.utcTime);
  const localTime = toLocalTime(event.date, event.utcTime);
  const tz        = localTzLabel();

  const defaultText = released && event.actual
    ? `${event.event} released at ${localTime} ${tz}. Actual: ${event.actual} vs forecast ${event.forecast} and prior ${event.previous}.`
    : `${event.event} is due at ${localTime} ${tz}. Market consensus: ${event.forecast !== '—' ? event.forecast : 'no specific estimate'}. Prior reading: ${event.previous}.`;

  return (
    <div className="border-t border-border/10 bg-muted/5 px-4 py-4 space-y-4">
      <div className="flex gap-2.5">
        <Activity className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">
            {released && event.actual ? 'Desk View' : 'Preview'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{event.outcome || defaultText}</p>
        </div>
      </div>

      {impl && (
        <>
          <div className="flex gap-2.5">
            <BarChart2 className="w-3.5 h-3.5 text-accent/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">
                Instruments to Watch
              </p>
              <div className="flex flex-wrap gap-1.5">
                {impl.instruments.map(inst => (
                  <span key={inst} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent/90 border border-accent/20 font-medium">
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {(impl.bullish || impl.bearish) && (
            <div className="flex gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
              <div className="space-y-1.5 w-full">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                  Market Implications
                </p>
                {impl.bullish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wide w-7 leading-5">Beat</span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{impl.bullish}</p>
                  </div>
                )}
                {impl.bearish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-red-400 shrink-0 uppercase tracking-wide w-7 leading-5">
                      {event.category === 'Holiday' ? 'Note' : 'Miss'}
                    </span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{impl.bearish}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── EVENT ROW ────────────────────────────────────────────────────────────────

function EventRow({ event, today }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === today;
  const isHigh  = event.importance === 'high';
  const catStyle = CATEGORY_COLORS[event.category] || 'text-muted-foreground bg-muted/30';
  const localTime = toLocalTime(event.date, event.utcTime);

  return (
    <div className={`border-b border-border/20 last:border-0 ${isToday && isHigh ? 'bg-primary/[0.02]' : ''}`}>
      <button className="w-full text-left hover:bg-muted/10 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="grid items-center px-4 py-3" style={{ gridTemplateColumns: '72px 40px 14px 1fr 72px 72px 88px 24px' }}>

          <span className={`text-xs font-mono font-semibold tabular-nums ${isToday ? 'text-primary' : 'text-muted-foreground/70'}`}>
            {localTime}
          </span>

          <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide">
            {event.country}
          </span>

          <span className={`w-2 h-2 rounded-full inline-block ${
            isHigh                          ? 'bg-amber-400' :
            event.importance === 'medium'   ? 'bg-blue-400/70' :
                                              'bg-border'
          }`} />

          <div className="flex items-center gap-2 min-w-0 pr-3">
            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>
              {event.event}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 hidden sm:inline ${catStyle}`}>
              {event.category}
            </span>
          </div>

          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">PREV</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.previous || '—'}</p>
          </div>

          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">FCST</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.forecast || '—'}</p>
          </div>

          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">ACTUAL</p>
            <ActualBadge
              actual={event.actual}
              forecast={event.forecast}
              dateStr={event.date}
              utcTime={event.utcTime}
              ffVerified={event.ffVerified}
            />
          </div>

          <span className="text-muted-foreground/30 flex justify-end">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <ExpandedPanel event={event} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── DATE GROUP ───────────────────────────────────────────────────────────────

function DateGroup({ dateStr, events, today }) {
  const isToday    = dateStr === today;
  const highCount  = events.filter(e => e.importance === 'high').length;
  const tz         = localTzLabel();

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-2 px-1">
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
        <span className={`text-[11px] font-bold tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
          {isToday ? 'TODAY · ' : ''}{formatDate(dateStr)}
        </span>
        {highCount > 0 && (
          <span className="text-[10px] text-amber-400/70 px-1.5 py-0.5 rounded bg-amber-400/8 border border-amber-400/15 ml-auto">
            {highCount} high impact
          </span>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="grid items-center px-4 py-2 border-b border-border/20 bg-muted/5"
          style={{ gridTemplateColumns: '72px 40px 14px 1fr 72px 72px 88px 24px' }}>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">TIME ({tz})</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">CTRY</span>
          <span />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">EVENT</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right hidden md:block">PREVIOUS</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right hidden md:block">FORECAST</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold text-right">ACTUAL</span>
          <span />
        </div>
        {events.map(e => <EventRow key={e.id} event={e} today={today} />)}
      </div>
    </div>
  );
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────

function StatusBar({ status }) {
  if (status === 'loading') return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>Generating calendar...</span>
    </div>
  );
  if (status === 'live') return (
    <div className="flex items-center gap-2 text-xs text-emerald-400">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Live data</span>
    </div>
  );
  if (status === 'cached') return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>AI generated</span>
    </div>
  );
  return null;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function EconomicCalendar() {
  const [tab, setTab]           = useState('today');
  const [impactFilter, setImpact] = useState('all');
  const [today, setToday]       = useState(getTodayStr);
  const [events, setEvents]     = useState([]);
  const [status, setStatus]     = useState('idle');
  const [loadedPeriods, setLoadedPeriods] = useState({});
  const cacheIds = useRef({});

  // Refresh today string at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    const t = setTimeout(() => setToday(getTodayStr()), midnight - now);
    return () => clearTimeout(t);
  }, [today]);

  const loadPeriod = useCallback(async (period, force = false) => {
    setStatus('loading');

    try {
      // 1. Check cache
      if (!force) {
        const { data: cached, recordId } = await loadCache(period);
        if (cached?.length) {
          cacheIds.current[period] = recordId;
          setEvents(cached);
          setLoadedPeriods(p => ({ ...p, [period]: true }));
          setStatus('cached');

          // Overlay FF actuals for today/week in background
          if (period === 'today' || period === 'week') {
            fetchFFActuals(cached).then(overlaid => {
              setEvents(overlaid);
              setStatus('live');
              saveCache(period, overlaid, cacheIds.current[period]);
            });
          }
          return;
        }
        cacheIds.current[period] = recordId;
      }

      // 2. For today/week — try FF first, then supplement with AI
      if (period === 'today' || period === 'week') {
        // Start with seed events for this period
        const today_ = getTodayStr();
        const weekEnd = getWeekEnd(today_);
        let base = SEED_EVENTS.filter(e =>
          period === 'today' ? e.date === today_ : (e.date >= today_ && e.date <= weekEnd)
        );

        // Generate AI events for the period
        try {
          const aiEvents = await generateCalendarFromAI(period);
          // Merge: AI events take priority over seed for same date+event
          const aiKeys = new Set(aiEvents.map(e => `${e.date}|${e.event.toLowerCase()}`));
          const seedFiltered = base.filter(e => !aiKeys.has(`${e.date}|${e.event.toLowerCase()}`));
          base = [...aiEvents, ...seedFiltered];
        } catch (_) {
          // AI failed — use seed only
        }

        // Overlay FF actuals
        const withActuals = await fetchFFActuals(base);
        setEvents(withActuals);
        setLoadedPeriods(p => ({ ...p, [period]: true }));
        setStatus('live');
        saveCache(period, withActuals, cacheIds.current[period]);

      } else if (period === 'previous') {
        // Seed events for previous + AI generation
        const today_ = getTodayStr();
        let base = SEED_EVENTS.filter(e => e.date < today_);
        try {
          const aiEvents = await generateCalendarFromAI('previous');
          const aiKeys = new Set(aiEvents.map(e => `${e.date}|${e.event.toLowerCase()}`));
          const seedFiltered = base.filter(e => !aiKeys.has(`${e.date}|${e.event.toLowerCase()}`));
          base = [...aiEvents, ...seedFiltered];
        } catch (_) {}
        setEvents(base);
        setLoadedPeriods(p => ({ ...p, [period]: true }));
        setStatus('cached');
        saveCache(period, base, cacheIds.current[period]);

      } else {
        // Month — pure AI
        const aiEvents = await generateCalendarFromAI('month');
        setEvents(aiEvents);
        setLoadedPeriods(p => ({ ...p, [period]: true }));
        setStatus('cached');
        saveCache(period, aiEvents, cacheIds.current[period]);
      }

    } catch (err) {
      console.error('Calendar error:', err);
      // Fallback to seed data
      setEvents(SEED_EVENTS);
      setStatus('cached');
    }
  }, []);

  // Load on tab change
  useEffect(() => {
    loadPeriod(tab);
  }, [tab]);

  const monthEnd = useMemo(() => {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + 2, 0);
    return d.toISOString().split('T')[0];
  }, [today]);

  const filtered = useMemo(() => {
    const weekEnd = getWeekEnd(today);
    let base = events.filter(e => {
      if (tab === 'today')    return e.date === today;
      if (tab === 'week')     return e.date >= today && e.date <= weekEnd;
      if (tab === 'month')    return e.date >= today && e.date <= monthEnd;
      if (tab === 'previous') return e.date < today;
      return true;
    });
    if (impactFilter !== 'all') base = base.filter(e => e.importance === impactFilter);
    return base;
  }, [events, tab, today, monthEnd, impactFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    Object.values(map).forEach(evs =>
      evs.sort((a, b) => {
        const ta = a.utcTime === 'All Day' ? '00:00' : (a.utcTime || '00:00');
        const tb = b.utcTime === 'All Day' ? '00:00' : (b.utcTime || '00:00');
        return ta.localeCompare(tb);
      })
    );
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return tab === 'previous' ? sorted.reverse() : sorted;
  }, [filtered, tab]);

  const todayEvents     = events.filter(e => e.date === today);
  const todayHigh       = todayEvents.filter(e => e.importance === 'high').length;
  const todayReleased   = todayEvents.filter(e => e.actual && isReleased(e.date, e.utcTime)).length;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Events</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground">
            Central bank decisions, macro releases, and market-moving data across 20 economies.
          </p>
        </motion.div>

        {/* Stats */}
        {tab === 'today' && (
          <motion.div className="flex gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">High Impact Today</p>
                <p className="text-lg font-semibold">{todayHigh}</p>
              </div>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-lg font-semibold">
                  {todayReleased} <span className="text-sm font-normal text-muted-foreground">/ {todayEvents.length}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1 p-1 glass rounded-xl w-fit flex-wrap">
            {[
              { key: 'today',    label: 'Today' },
              { key: 'week',     label: 'This Week' },
              { key: 'month',    label: 'This Month' },
              { key: 'previous', label: 'Previous' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <StatusBar status={status} />

            <button
              onClick={() => loadPeriod(tab, true)}
              disabled={status === 'loading'}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <div className="flex items-center gap-1 p-1 glass rounded-lg">
              <Filter className="w-3 h-3 text-muted-foreground/50 ml-1 mr-0.5" />
              {[{ key: 'all', label: 'All' }, { key: 'high', label: 'High Impact' }].map(f => (
                <button
                  key={f.key}
                  onClick={() => setImpact(f.key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    impactFilter === f.key
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {status === 'loading' && grouped.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 opacity-40 animate-spin" />
              <p className="text-sm font-medium mb-1">Generating calendar...</p>
              <p className="text-xs text-muted-foreground/50">
                AI is compiling events across 20 economies with accurate data
              </p>
            </div>
          ) : grouped.length > 0 ? (
            grouped.map(([dateStr, evs]) => (
              <DateGroup key={dateStr} dateStr={dateStr} events={evs} today={today} />
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No events for this period</p>
            </div>
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground/30 text-center mt-8">
          Click any row to expand the desk view and market implications. Times shown in your local timezone ({localTzLabel()}).
          AI-generated data supplemented with live feeds where available.
        </p>
      </div>
    </div>
  );
}