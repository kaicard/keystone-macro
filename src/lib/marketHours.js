// Market hours utility — determines open/closed status per exchange
// All times are converted to UTC for comparison

export const EXCHANGES = {
  US: {
    label: 'US',
    tz: 'America/New_York',
    open: { h: 9, m: 30 },
    close: { h: 16, m: 0 },
    // NYSE/NASDAQ holidays 2026 (US market holidays)
    holidays: [
      '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
      '2026-05-25', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
    ],
  },
  UK: {
    label: 'UK',
    tz: 'Europe/London',
    open: { h: 8, m: 0 },
    close: { h: 16, m: 30 },
    holidays: [
      '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04',
      '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28',
    ],
  },
  EU: {
    label: 'EU',
    tz: 'Europe/Berlin',
    open: { h: 9, m: 0 },
    close: { h: 17, m: 30 },
    holidays: [
      '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-01',
      '2026-12-25', '2026-12-26',
    ],
  },
  JP: {
    label: 'JP',
    tz: 'Asia/Tokyo',
    open: { h: 9, m: 0 },
    close: { h: 15, m: 30 },
    // Simplified — TSE has lunch break 11:30-12:30 but we ignore for display
    holidays: [
      '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23',
      '2026-03-20', '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05',
      '2026-07-20', '2026-09-21', '2026-11-03', '2026-11-23', '2026-12-31',
    ],
  },
  HK: {
    label: 'HK',
    tz: 'Asia/Hong_Kong',
    open: { h: 9, m: 30 },
    close: { h: 16, m: 0 },
    holidays: [
      '2026-01-01', '2026-01-26', '2026-04-03', '2026-04-06',
      '2026-04-07', '2026-05-01', '2026-06-19', '2026-07-01',
      '2026-10-01', '2026-10-02', '2026-12-25', '2026-12-26',
    ],
  },
};

// Map instruments to their primary exchange
export const INSTRUMENT_EXCHANGE = {
  'S&P 500': 'US', 'NASDAQ 100': 'US', 'Dow Jones': 'US',
  'FTSE 100': 'UK',
  'DAX': 'EU', 'CAC 40': 'EU',
  'Nikkei 225': 'JP',
  'Hang Seng': 'HK',
  // FX trades 24/5 (Mon–Fri)
  'GBP/USD': 'FX', 'EUR/USD': 'FX', 'USD/JPY': 'FX',
  'USD/CHF': 'FX', 'AUD/USD': 'FX', 'EUR/GBP': 'FX',
  // Crypto is 24/7
  'Bitcoin': 'CRYPTO', 'Ethereum': 'CRYPTO', 'Solana': 'CRYPTO',
  // Commodities trade extended hours
  'Gold': 'COMMODITY', 'Silver': 'COMMODITY', 'WTI Crude': 'COMMODITY',
  'Brent Crude': 'COMMODITY', 'Natural Gas': 'COMMODITY', 'Copper': 'COMMODITY',
  // US equities
  'Apple': 'US', 'Microsoft': 'US', 'NVIDIA': 'US', 'Amazon': 'US',
  'Alphabet': 'US', 'Tesla': 'US', 'Meta': 'US', 'JPMorgan': 'US', 'Goldman Sachs': 'US',
  'SPY': 'US', 'QQQ': 'US', 'GLD': 'US', 'TLT': 'US', 'HYG': 'US',
  'VIX': 'US', 'DXY': 'FX',
};

function getLocalTimeInZone(tz) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric', minute: 'numeric', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short',
  }).formatToParts(now);

  const get = (type) => parts.find(p => p.type === type)?.value;
  const h = parseInt(get('hour'));
  const m = parseInt(get('minute'));
  const weekday = get('weekday'); // Mon, Tue... Sun
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const dateStr = `${year}-${month}-${day}`;

  return { h, m, weekday, dateStr };
}

function isWeekend(weekday) {
  return weekday === 'Sat' || weekday === 'Sun';
}

export function getExchangeStatus(exchangeKey) {
  if (exchangeKey === 'CRYPTO') return { open: true, label: '24/7' };
  if (exchangeKey === 'FX') {
    // FX is open Mon-Fri across global sessions (roughly Sun 22:00 UTC – Fri 22:00 UTC)
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0=Sun, 6=Sat
    const utcH = now.getUTCHours();
    const utcM = now.getUTCMinutes();
    const utcMins = utcH * 60 + utcM;
    if (utcDay === 6) return { open: false, label: 'Closed' }; // Sat
    if (utcDay === 0 && utcMins < 22 * 60) return { open: false, label: 'Closed' }; // Sun before 22:00 UTC
    if (utcDay === 5 && utcMins >= 22 * 60) return { open: false, label: 'Closed' }; // Fri after 22:00 UTC
    return { open: true, label: 'Open' };
  }
  if (exchangeKey === 'COMMODITY') {
    // Commodities on CME: roughly Mon 00:00 – Fri 23:00 CT
    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcH = now.getUTCHours();
    if (utcDay === 6) return { open: false, label: 'Closed' };
    if (utcDay === 0 && utcH < 23) return { open: false, label: 'Closed' };
    return { open: true, label: 'Open' };
  }

  const exch = EXCHANGES[exchangeKey];
  if (!exch) return { open: false, label: 'Unknown' };

  const { h, m, weekday, dateStr } = getLocalTimeInZone(exch.tz);

  if (isWeekend(weekday)) return { open: false, label: 'Closed' };
  if (exch.holidays.includes(dateStr)) return { open: false, label: 'Holiday' };

  const nowMins = h * 60 + m;
  const openMins = exch.open.h * 60 + exch.open.m;
  const closeMins = exch.close.h * 60 + exch.close.m;

  if (nowMins >= openMins && nowMins < closeMins) {
    return { open: true, label: 'Open' };
  }
  // Check if market is pre/post-open (within 2 hours of opening)
  if (nowMins < openMins && nowMins >= (openMins - 120)) {
    return { open: false, label: 'Opening Soon' };
  }
  return { open: false, label: 'Closed' };
}

export function getInstrumentStatus(instrumentName) {
  const exchKey = INSTRUMENT_EXCHANGE[instrumentName];
  if (!exchKey) return { open: true, label: '' }; // unknown — don't flag
  return getExchangeStatus(exchKey);
}

// Returns a summary of all major exchanges
export function getAllExchangeStatuses() {
  return Object.entries(EXCHANGES).map(([key, exch]) => ({
    key,
    label: exch.label,
    ...getExchangeStatus(key),
  }));
}