import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
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
          return { name: inst.name, sym: inst.sym, price, prev, host };
        } catch (_) {}
      }
      return null;
    }));
    
    const detail = results.map((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const v = r.value;
        const changePct = ((v.price - v.prev) / v.prev) * 100;
        return { name: v.name, sym: v.sym, price: v.price, prevClose: v.prev, changePct: changePct.toFixed(2) + '%', host: v.host };
      }
      return { name: instruments[i].name, sym: instruments[i].sym, error: 'failed' };
    });
    
    return Response.json({ detail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});