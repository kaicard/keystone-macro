import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CACHE_KEY = 'forexCalendar';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

function parseXMLResponse(xmlString) {
  const events = [];
  const eventRegex = /<event>([\s\S]*?)<\/event>/g;
  const titleRegex = /<title>([\s\S]*?)<\/title>/;
  const dateRegex = /<date>([\s\S]*?)<\/date>/;
  const timeRegex = /<time>([\s\S]*?)<\/time>/;
  const countryRegex = /<country>([\s\S]*?)<\/country>/;
  const impactRegex = /<impact>([\s\S]*?)<\/impact>/;
  const forecastRegex = /<forecast>([\s\S]*?)<\/forecast>/;
  const previousRegex = /<previous>([\s\S]*?)<\/previous>/;
  const actualRegex = /<actual>([\s\S]*?)<\/actual>/;

  let match;
  let id = 1;
  while ((match = eventRegex.exec(xmlString)) !== null) {
    const eventXml = match[1];

    const titleMatch = titleRegex.exec(eventXml);
    const dateMatch = dateRegex.exec(eventXml);
    const timeMatch = timeRegex.exec(eventXml);
    const countryMatch = countryRegex.exec(eventXml);
    const impactMatch = impactRegex.exec(eventXml);
    const forecastMatch = forecastRegex.exec(eventXml);
    const previousMatch = previousRegex.exec(eventXml);
    const actualMatch = actualRegex.exec(eventXml);

    if (!titleMatch || !dateMatch) continue;

    const title = titleMatch[1].trim();
    const dateStr = dateMatch[1].trim(); // e.g., "Apr 01"
    const timeStr = timeMatch ? timeMatch[1].trim() : '';
    const country = countryMatch ? countryMatch[1].trim() : '';
    const impact = impactMatch ? impactMatch[1].trim() : 'Low';
    const forecast = forecastMatch ? forecastMatch[1].trim() : '—';
    const previous = previousMatch ? previousMatch[1].trim() : '';
    const actual = actualMatch ? actualMatch[1].trim() : null;

    // Parse date: "Apr 01" → "2026-04-01" (assume current year)
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.split(' ');
    const monthIdx = months.indexOf(parts[0]);
    const day = parseInt(parts[1], 10);
    let year = today.getFullYear();
    const month = monthIdx + 1;

    // If parsed month is before current month, assume next year
    if (month < today.getMonth() + 1) {
      year += 1;
    }

    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Parse time: "14:30" or empty; assume UTC
    const utcTime = timeStr || 'All Day';

    // Map importance: "High", "Medium", "Low" → "high", "medium", "low"
    const importance = impact.toLowerCase();

    // Guess category from title
    let category = 'Other';
    if (title.includes('CPI') || title.includes('PPI') || title.includes('PCE') || title.includes('Inflation')) {
      category = 'Inflation';
    } else if (title.includes('PMI') || title.includes('Manufacturing') || title.includes('Services')) {
      category = 'PMI';
    } else if (title.includes('Jobs') || title.includes('Employment') || title.includes('Unemployment') || title.includes('Payroll') || title.includes('Claims')) {
      category = 'Labour';
    } else if (title.includes('GDP') || title.includes('Growth')) {
      category = 'GDP';
    } else if (title.includes('Retail Sales') || title.includes('Consumer Confidence') || title.includes('Sentiment')) {
      category = 'Consumer';
    } else if (title.includes('Homes') || title.includes('Housing') || title.includes('Permits') || title.includes('Starts')) {
      category = 'Housing';
    } else if (title.includes('Rate') || title.includes('FOMC') || title.includes('BOE') || title.includes('ECB') || title.includes('BOJ') || title.includes('RBA') || title.includes('SNB') || title.includes('Bank')) {
      category = 'Central Bank';
    } else if (title.includes('Holiday') || title.includes('Closed')) {
      category = 'Holiday';
    }

    events.push({
      id: String(id++),
      date,
      utcTime,
      country,
      event: title,
      importance,
      previous,
      forecast,
      actual: actual || null,
      category,
      outcome: null,
    });
  }

  return events;
}

async function fetchCalendarFromForexFactory() {
  const today = new Date();

  // Get this week and next week
  const thisWeekStart = getWeekStart(today);
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const nextWeekStartStr = getWeekStart(nextWeekStart);

  const weeks = [thisWeekStart, nextWeekStartStr];
  const allEvents = [];

  for (const week of weeks) {
    const url = `https://www.forexfactory.com/calendar.php?week=${week}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const xml = await res.text();
      const events = parseXMLResponse(xml);
      allEvents.push(...events);
    } catch (e) {
      // Skip this week if fetch fails
    }
  }

  // Deduplicate and sort by date/time
  const seen = new Set();
  const unique = allEvents.filter(e => {
    const key = `${e.date}-${e.utcTime}-${e.event}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.utcTime || '').localeCompare(b.utcTime || '');
  });

  return unique;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check cache
    const cached = await base44.asServiceRole.entities.MarketCache.filter({ key: CACHE_KEY });
    if (cached?.length > 0) {
      const entry = cached[0];
      const age = Date.now() - new Date(entry.fetched_at).getTime();
      if (entry.payload && age < CACHE_TTL_MS) {
        const events = JSON.parse(entry.payload);
        return Response.json({ ok: true, events, cached: true, fetched_at: entry.fetched_at });
      }
    }

    // Fetch fresh from ForexFactory XML
    const events = await fetchCalendarFromForexFactory();

    const payload = JSON.stringify(events);
    const fetched_at = new Date().toISOString();

    if (cached?.length > 0) {
      await base44.asServiceRole.entities.MarketCache.update(cached[0].id, { payload, fetched_at });
    } else {
      await base44.asServiceRole.entities.MarketCache.create({ key: CACHE_KEY, payload, fetched_at });
    }

    return Response.json({ ok: true, events, cached: false, fetched_at });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, events: [] }, { status: 200 });
  }
});