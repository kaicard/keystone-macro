import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
const BASE_URL = 'https://www.alphavantage.co/query';

// Key instruments: stocks, commodities, forex
const INSTRUMENTS = {
  'SPX': { symbol: 'SPX', name: 'S&P 500', type: 'index', exchange: 'US' },
  'NDX': { symbol: 'NDX', name: 'NASDAQ 100', type: 'index', exchange: 'US' },
  'XAUUSD': { symbol: 'XAUUSD', name: 'Gold', type: 'commodity', exchange: 'COMEX' },
  'XBTUSD': { symbol: 'XBTUSD', name: 'Bitcoin', type: 'crypto', exchange: '24/5' },
  'EURUSD': { symbol: 'EURUSD', name: 'EUR/USD', type: 'forex', exchange: '24/5' },
  'GBPUSD': { symbol: 'GBPUSD', name: 'GBP/USD', type: 'forex', exchange: '24/5' },
  'DXY': { symbol: 'DXY', name: 'US Dollar Index', type: 'index', exchange: 'US' },
};

// Alpha Vantage ticker mapping
const TICKER_MAP = {
  'SPX': 'GSPC', // Maps to ^GSPC but we'll use standard API
  'NDX': 'NDX',
  'XAUUSD': 'XAUUSD',
  'XBTUSD': 'XBTUSD',
  'EURUSD': 'EURUSD',
  'GBPUSD': 'GBPUSD',
  'DXY': 'DXY',
};

async function fetchPrice(ticker) {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.append('function', 'GLOBAL_QUOTE');
    url.searchParams.append('symbol', ticker);
    url.searchParams.append('apikey', ALPHA_VANTAGE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

function isMarketOpen(exchangeType) {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  
  // Check if weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return exchangeType === '24/5' || exchangeType === 'crypto';
  }

  // US Markets: 14:30 - 21:00 UTC (9:30 - 16:00 EST)
  if (exchangeType === 'US') {
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const currentTime = hours * 60 + minutes;
    return currentTime >= 14 * 60 + 30 && currentTime < 21 * 60;
  }

  // Forex/24h markets always open
  return exchangeType === '24/5' || exchangeType === 'forex' || exchangeType === 'crypto';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache
    const cacheKey = 'av_market_cache';
    let cache = await base44.asServiceRole.entities.MarketCache.filter({ key: cacheKey });

    const now = Date.now();
    let marketData = {};
    let fromCache = false;

    if (cache.length > 0 && cache[0].fetched_at) {
      const fetchedTime = new Date(cache[0].fetched_at).getTime();
      if (now - fetchedTime < 60 * 1000) { // 60 second cache
        marketData = JSON.parse(cache[0].payload);
        fromCache = true;
      }
    }

    if (!fromCache) {
      // Fetch all instruments
      for (const [key, instrument] of Object.entries(INSTRUMENTS)) {
        const ticker = TICKER_MAP[key];
        const priceData = await fetchPrice(ticker);

        if (priceData) {
          marketData[key] = {
            ...instrument,
            price: priceData.price,
            change: priceData.change,
            changePercent: priceData.changePercent,
            status: isMarketOpen(instrument.exchange) ? 'OPEN' : 'CLOSED',
            lastUpdate: new Date().toISOString(),
          };
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Update cache
      if (cache.length > 0) {
        await base44.asServiceRole.entities.MarketCache.update(cache[0].id, {
          payload: JSON.stringify(marketData),
          fetched_at: new Date().toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.MarketCache.create({
          key: cacheKey,
          payload: JSON.stringify(marketData),
          fetched_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ marketData, fromCache });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});