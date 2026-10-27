import { secrets } from 'base44:runtime';

const pending = new Map();
const SOURCES = new Set(['mql5', 'forex-factory', 'fxstreet']);
const FIELDS = ['EventID', 'eventID', 'Date', 'date', 'Currency', 'currency', 'Name', 'name', 'Impact', 'impact', 'Category', 'category', 'Actual', 'actual', 'Previous', 'previous', 'Forecast', 'forecast', 'Outcome', 'outcome', 'Quality'];

export async function getJBlankedCalendar(base44, source, { allowRefresh = true } = {}) {
  if (!SOURCES.has(source)) throw new Error('Unsupported calendar source');
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  const key = `jb:week:${source}:${monday.toISOString().slice(0, 10)}`;
  // Anonymous readers can only access an existing public snapshot, never initiate provider usage.
  if (!allowRefresh) return loadCalendar(base44, source, key, now, false);
  if (pending.has(key)) return pending.get(key);
  const work = loadCalendar(base44, source, key, now, true);
  pending.set(key, work);
  try { return await work; } finally { pending.delete(key); }
}

async function loadCalendar(base44, source, key, now, allowRefresh) {
  const cache = base44.asServiceRole.entities.MarketCache;
  const { items } = await cache.filter({ key }, { sort: '-updated_date', limit: 1 });
  const entry = items[0];
  const stored = entry ? JSON.parse(entry.payload) : null;
  const ttl = [0, 6].includes(now.getUTCDay()) ? 60 * 60 * 1000 : 30 * 60 * 1000;
  const fresh = entry && now.getTime() - new Date(entry.fetched_at).getTime() < ttl;
  const coolingDown = stored?.retry_after > now.getTime();
  const readStored = async () => {
    if (!stored?.chunk_ids?.length) throw new Error(stored?.error || 'Calendar temporarily unavailable');
    const page = await cache.filter({ id: { $in: stored.chunk_ids } }, { limit: 200 });
    const byId = new Map(page.items.map(row => [row.id, row.payload]));
    if (stored.chunk_ids.some(id => !byId.has(id))) throw new Error('Calendar cache incomplete');
    return JSON.parse(stored.chunk_ids.map(id => byId.get(id)).join(''));
  };
  if (!allowRefresh && !stored?.chunk_ids?.length) return { events: [], cached: true, stale: true, fetchedAt: entry?.fetched_at || null };
  if (!allowRefresh || fresh || coolingDown) return { events: await readStored(), cached: true, stale: !fresh, fetchedAt: entry.fetched_at };

  let events;
  try {
    const response = await fetch(`https://www.jblanked.com/news/api/${source}/calendar/week/`, {
      headers: { Authorization: `Api-Key ${secrets.get('JBLANKED_API_KEY')}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Calendar provider returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected calendar response');
    events = data.map(item => Object.fromEntries(FIELDS.filter(field => item[field] !== undefined).map(field => [field, item[field]])));
  } catch (error) {
    const payload = JSON.stringify({ ...stored, retry_after: now.getTime() + 15 * 60 * 1000, error: error.message });
    if (entry) await cache.update(entry.id, { payload });
    else await cache.create({ key, payload, fetched_at: '1970-01-01T00:00:00.000Z' });
    if (!stored?.chunk_ids?.length) throw error;
    return { events: await readStored(), cached: true, stale: true, fetchedAt: entry.fetched_at };
  }

  // Small plain-text chunks avoid the field-size limit that disabled the old cache.
  const text = JSON.stringify(events);
  const fetched_at = new Date().toISOString();
  const chunks = [];
  for (let offset = 0; offset < text.length; offset += 12000) chunks.push({ key: `${key}:chunk`, payload: text.slice(offset, offset + 12000), fetched_at });
  const rows = await cache.bulkCreate(chunks);
  const payload = JSON.stringify({ chunk_ids: rows.map(row => row.id) });
  if (entry) await cache.update(entry.id, { payload, fetched_at });
  else await cache.create({ key, payload, fetched_at });
  // Retain old chunks briefly so readers of the previous snapshot can finish.
  await cache.deleteMany({ key: { $regex: '^jb:week:' }, created_date: { $lt: new Date(now.getTime() - 14 * 86400000).toISOString() } });
  return { events, cached: false, stale: false, fetchedAt: fetched_at };
}