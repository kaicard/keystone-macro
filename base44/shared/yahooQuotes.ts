// Yahoo retired the batch quote endpoint (v7/finance/quote): it now returns 401
// for every caller, with no crumb or cookie that fixes it. The chart endpoint
// (v8) still works, so quotes are fetched one symbol at a time through it, with
// bounded concurrency so a large symbol list stays fast.

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
};

const CONCURRENCY = 10;
const PER_SYMBOL_TIMEOUT_MS = 8000;

export interface YahooQuote {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  shortName: string | null;
}

async function fetchOne(symbol: string): Promise<YahooQuote | null> {
  // Try both hosts before giving up on a symbol.
  for (const host of ['query1', 'query2']) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PER_SYMBOL_TIMEOUT_MS);
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`;
      const res = await fetch(url, { headers: YF_HEADERS, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta) continue;
      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose;
      if (price == null || prev == null || price <= 0 || prev <= 0) continue;
      const change = price - prev;
      return {
        regularMarketPrice: price,
        regularMarketChange: change,
        regularMarketChangePercent: (change / prev) * 100,
        shortName: meta.shortName ?? meta.longName ?? null,
      };
    } catch (_) {
      // fall through to the next host
    }
  }
  return null;
}

export async function fetchYahooQuoteMap(symbols: string[]): Promise<Record<string, YahooQuote>> {
  const results: Record<string, YahooQuote> = {};
  let cursor = 0;
  const workerCount = Math.min(CONCURRENCY, symbols.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < symbols.length) {
      const symbol = symbols[cursor++];
      const quote = await fetchOne(symbol);
      if (quote) results[symbol] = quote;
    }
  });

  await Promise.all(workers);
  return results;
}