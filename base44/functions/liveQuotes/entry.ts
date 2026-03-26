import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const QUOTE_SCHEMA = {
  type: "object",
  properties: {
    quotes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ticker: { type: "string" },
          price: { type: "number" },
          change_pct: { type: "number" },
          direction: { type: "string" }
        }
      }
    }
  }
};

const GROUPS = [
  {
    label: 'Indices, Crypto & VIX',
    tickers: [
      { sym: '^GSPC', name: 'S&P 500' }, { sym: '^NDX', name: 'NASDAQ 100' },
      { sym: '^DJI', name: 'Dow Jones' }, { sym: '^FTSE', name: 'FTSE 100' },
      { sym: '^GDAXI', name: 'DAX' }, { sym: '^FCHI', name: 'CAC 40' },
      { sym: '^N225', name: 'Nikkei 225' }, { sym: '^HSI', name: 'Hang Seng' },
      { sym: 'BTC-USD', name: 'Bitcoin' }, { sym: 'ETH-USD', name: 'Ethereum' },
      { sym: 'SOL-USD', name: 'Solana' }, { sym: '^VIX', name: 'VIX' },
      { sym: 'DX-Y.NYB', name: 'DXY' },
    ]
  },
  {
    label: 'Equities & ETFs',
    tickers: [
      { sym: 'AAPL', name: 'Apple' }, { sym: 'MSFT', name: 'Microsoft' },
      { sym: 'NVDA', name: 'NVIDIA' }, { sym: 'AMZN', name: 'Amazon' },
      { sym: 'GOOGL', name: 'Alphabet' }, { sym: 'TSLA', name: 'Tesla' },
      { sym: 'META', name: 'Meta' }, { sym: 'JPM', name: 'JPMorgan' },
      { sym: 'GS', name: 'Goldman Sachs' },
      { sym: 'SPY', name: 'SPY' }, { sym: 'QQQ', name: 'QQQ' },
      { sym: 'GLD', name: 'GLD' }, { sym: 'TLT', name: 'TLT' },
      { sym: 'HYG', name: 'HYG' },
    ]
  },
  {
    label: 'FX & Commodities',
    tickers: [
      { sym: 'GBPUSD=X', name: 'GBP/USD' }, { sym: 'EURUSD=X', name: 'EUR/USD' },
      { sym: 'USDJPY=X', name: 'USD/JPY' }, { sym: 'USDCHF=X', name: 'USD/CHF' },
      { sym: 'AUDUSD=X', name: 'AUD/USD' }, { sym: 'EURGBP=X', name: 'EUR/GBP' },
      { sym: 'GC=F', name: 'Gold' }, { sym: 'SI=F', name: 'Silver' },
      { sym: 'CL=F', name: 'WTI Crude' }, { sym: 'BZ=F', name: 'Brent Crude' },
      { sym: 'NG=F', name: 'Natural Gas' }, { sym: 'HG=F', name: 'Copper' },
    ]
  }
];

const CATEGORY_MAP = {
  '^GSPC': 'indices', '^NDX': 'indices', '^DJI': 'indices', '^FTSE': 'indices',
  '^GDAXI': 'indices', '^FCHI': 'indices', '^N225': 'indices', '^HSI': 'indices',
  'BTC-USD': 'crypto', 'ETH-USD': 'crypto', 'SOL-USD': 'crypto',
  'GC=F': 'commodities', 'SI=F': 'commodities', 'CL=F': 'commodities', 'BZ=F': 'commodities',
  'NG=F': 'commodities', 'HG=F': 'commodities',
  'GBPUSD=X': 'fx', 'EURUSD=X': 'fx', 'USDJPY=X': 'fx', 'USDCHF=X': 'fx',
  'AUDUSD=X': 'fx', 'EURGBP=X': 'fx', 'USDCNH=X': 'fx', 'USDCAD=X': 'fx',
  'AAPL': 'equities', 'MSFT': 'equities', 'NVDA': 'equities', 'AMZN': 'equities',
  'GOOGL': 'equities', 'TSLA': 'equities', 'META': 'equities', 'JPM': 'equities', 'GS': 'equities',
  'SPY': 'etfs', 'QQQ': 'etfs', 'VOO': 'etfs', 'GLD': 'etfs', 'TLT': 'etfs',
  'HYG': 'etfs', 'LQD': 'etfs', 'EEM': 'etfs', 'VNQ': 'etfs',
  '^VIX': 'vix', 'DX-Y.NYB': 'dxy',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

    // Fetch all 3 groups in parallel
    const results = await Promise.all(GROUPS.map(group => {
      const tickerList = group.tickers.map(t => `${t.sym} = ${t.name}`).join(', ');
      const prompt = `Today is ${today}, New York time is ${time}. Using live web data from Yahoo Finance or Google Finance, fetch REAL current prices for these financial instruments: ${tickerList}. For each return: ticker (the symbol exactly as given), price (current price as number), change_pct (today's % change as number, e.g. 1.23), direction ("up"/"down"/"flat"). Return all ${group.tickers.length} instruments with real values.`;
      return base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: QUOTE_SCHEMA,
      });
    }));

    const allQuotes = {};
    for (const res of results) {
      for (const q of (res?.quotes || [])) {
        if (q.ticker && q.price) {
          allQuotes[q.ticker] = q;
        }
      }
    }

    // Organize by category
    const organized = {
      indices: [], equities: [], etfs: [], fx: [], commodities: [], crypto: [],
      vix: null, dxy: null, all: allQuotes,
    };

    for (const [sym, q] of Object.entries(allQuotes)) {
      const cat = CATEGORY_MAP[sym] || 'other';
      const enriched = { ...q, name: GROUPS.flatMap(g => g.tickers).find(t => t.sym === sym)?.name || sym, category: cat };
      organized.all[sym] = enriched;
      if (cat === 'vix') organized.vix = enriched;
      else if (cat === 'dxy') organized.dxy = enriched;
      else if (organized[cat]) organized[cat].push(enriched);
    }

    return Response.json({ ok: true, data: organized, ts: Date.now() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});