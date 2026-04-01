import React, { useState, useMemo, useEffect } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const COUNTRY_LABELS = {
  US: 'US', UK: 'UK', EU: 'EU', JP: 'JP', CN: 'CN',
  CA: 'CA', AU: 'AU', CH: 'CH', DE: 'DE', FR: 'FR',
};

const CATEGORY_COLORS = {
  'Central Bank': 'text-amber-400',
  'Inflation':    'text-red-400',
  'Labour':       'text-blue-400',
  'GDP':          'text-emerald-400',
  'PMI':          'text-purple-400',
  'Consumer':     'text-cyan-400',
  'Housing':      'text-orange-400',
  'Holiday':      'text-muted-foreground',
};

// All times stored as UTC (HH:MM). "All Day" passed through as-is.
const EVENTS = [
  // ── March 17 ──────────────────────────────────────────────────────────────
  { id: 100, date: '2026-03-17', utcTime: '17:30', country: 'US', event: 'US Retail Sales (MoM) — Feb', importance: 'high', previous: '-0.9%', forecast: '0.6%', actual: '0.2%', category: 'Consumer',
    outcome: 'Retail sales recovered but underwhelmed at +0.2% MoM vs +0.6% expected. Control group flat. Consumer spending losing momentum, reinforcing Q1 GDP concerns. Dollar weakened modestly; rates rallied.' },
  { id: 101, date: '2026-03-17', utcTime: '18:15', country: 'US', event: 'Industrial Production (MoM)', importance: 'medium', previous: '0.5%', forecast: '0.2%', actual: '0.7%', category: 'GDP',
    outcome: 'Surprised to the upside at +0.7%, boosted by utilities output during cold weather. Manufacturing sub-index +0.1%, broadly in line.' },

  // ── March 18 ──────────────────────────────────────────────────────────────
  { id: 102, date: '2026-03-18', utcTime: '08:00', country: 'DE', event: 'Germany ZEW Economic Sentiment', importance: 'high', previous: '26.0', forecast: '48.0', actual: '51.6', category: 'Consumer',
    outcome: 'ZEW surged to 51.6, smashing expectations. Reflects optimism around the new German fiscal package. DAX hit fresh highs; EUR/USD nudged higher.' },
  { id: 103, date: '2026-03-18', utcTime: '08:00', country: 'EU', event: 'Eurozone ZEW Economic Sentiment', importance: 'medium', previous: '24.2', forecast: '35.0', actual: '39.8', category: 'Consumer',
    outcome: 'Eurozone ZEW followed the German lead, jumping to 39.8. Fiscal stimulus expectations lifting animal spirits.' },

  // ── March 19 — FOMC ───────────────────────────────────────────────────────
  { id: 104, date: '2026-03-19', utcTime: '23:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '4.25–4.50%', forecast: '4.25–4.50%', actual: '4.25–4.50%', category: 'Central Bank',
    outcome: 'Fed held rates as expected. Dot plot still shows two cuts for 2026. Growth forecasts trimmed to 1.7%. Tariff uncertainty flagged repeatedly. Equities rallied on unchanged median dots.' },
  { id: 105, date: '2026-03-19', utcTime: '23:30', country: 'US', event: 'FOMC Press Conference — Powell', importance: 'high', previous: '—', forecast: '—', actual: '✓', category: 'Central Bank',
    outcome: 'Powell struck a cautious tone, emphasising "no rush" on rates. Tariff impacts called "unusually uncertain". Markets took the presser as dovish.' },

  // ── March 20 ──────────────────────────────────────────────────────────────
  { id: 106, date: '2026-03-20', utcTime: '06:45', country: 'CH', event: 'SNB Interest Rate Decision', importance: 'high', previous: '0.50%', forecast: '0.25%', actual: '0.25%', category: 'Central Bank',
    outcome: 'SNB cut by 25bps to 0.25% as expected, citing benign inflation. Zero lower bound back in discussion.' },
  { id: 107, date: '2026-03-20', utcTime: '12:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '4.50%', forecast: '4.50%', actual: '4.50%', category: 'Central Bank',
    outcome: 'BOE held at 4.50% in an 8-1 vote. Market pricing for May cut rose to ~55%.' },

  // ── March 24 ──────────────────────────────────────────────────────────────
  { id: 108, date: '2026-03-24', utcTime: '08:30', country: 'UK', event: 'UK Flash Composite PMI', importance: 'medium', previous: '50.5', forecast: '50.3', actual: '50.0', category: 'PMI',
    outcome: 'UK PMI dipped to 50.0. Manufacturing slipped further to 44.6. Sterling fell ~20 pips.' },
  { id: 109, date: '2026-03-24', utcTime: '08:00', country: 'EU', event: 'Eurozone Flash Composite PMI', importance: 'high', previous: '50.2', forecast: '50.6', actual: '50.4', category: 'PMI',
    outcome: 'Eurozone composite edged up to 50.4, below consensus but still in expansion.' },
  { id: 110, date: '2026-03-24', utcTime: '18:45', country: 'US', event: 'S&P Global US Flash Composite PMI', importance: 'medium', previous: '51.6', forecast: '51.5', actual: '53.5', category: 'PMI',
    outcome: 'US PMI surprised higher at 53.5, services at 54.3. Underlying momentum better than feared.' },

  // ── March 25 ──────────────────────────────────────────────────────────────
  { id: 112, date: '2026-03-25', utcTime: '08:00', country: 'DE', event: 'Germany Ifo Expectations', importance: 'medium', previous: '85.4', forecast: '86.0', actual: '87.7', category: 'PMI',
    outcome: 'Ifo expectations surged to 87.7, highest in nearly two years. Infrastructure spending optimism.' },
  { id: 111, date: '2026-03-25', utcTime: '19:00', country: 'US', event: 'CB Consumer Confidence', importance: 'high', previous: '98.3', forecast: '94.0', actual: '92.9', category: 'Consumer',
    outcome: 'Confidence fell to 92.9, lowest since Feb 2021. Expectations component dropped to 65.2, below the 80 recession-risk threshold.' },

  // ── March 26 ──────────────────────────────────────────────────────────────
  { id: 1, date: '2026-03-26', utcTime: '07:00', country: 'UK', event: 'UK CPI (YoY)', importance: 'high', previous: '3.0%', forecast: '2.9%', actual: '2.8%', category: 'Inflation',
    outcome: 'Inflation fell to 2.8%, lowest since mid-2021. Services CPI softened to 4.7%. Market pricing for May BOE cut rose sharply.' },
  { id: 2, date: '2026-03-26', utcTime: '08:00', country: 'EU', event: 'ECB President Lagarde Speech', importance: 'high', previous: '—', forecast: '—', actual: '✓', category: 'Central Bank',
    outcome: 'Lagarde reiterated data-dependency, declined to commit to a June cut. EUR/USD edged lower.' },
  { id: 3, date: '2026-03-26', utcTime: '17:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '223K', forecast: '225K', actual: '224K', category: 'Labour',
    outcome: 'Claims in-line at 224K. Continuing claims ticked up slightly to 1.87M. Stable, if softening, labour market.' },
  { id: 4, date: '2026-03-26', utcTime: '17:30', country: 'US', event: 'Durable Goods Orders (MoM)', importance: 'high', previous: '3.2%', forecast: '-1.0%', actual: '0.9%', category: 'Consumer',
    outcome: 'Durable goods surprised strongly at +0.9% vs -1.0% forecast. Core capex orders +0.7%, positive for business investment.' },

  // ── March 27 ──────────────────────────────────────────────────────────────
  { id: 5, date: '2026-03-27', utcTime: '06:00', country: 'DE', event: 'Germany Ifo Business Climate', importance: 'high', previous: '85.2', forecast: '85.8', actual: '86.7', category: 'PMI',
    outcome: 'Ifo beat at 86.7, highest since June 2024. Both current conditions and expectations improved.' },
  { id: 6, date: '2026-03-27', utcTime: '07:00', country: 'UK', event: 'UK Retail Sales (MoM)', importance: 'high', previous: '-0.6%', forecast: '0.4%', actual: '1.0%', category: 'Consumer',
    outcome: 'UK Retail Sales strongly beat at +1.0% MoM. Food and clothing drove the gain.' },
  { id: 7, date: '2026-03-27', utcTime: '17:30', country: 'US', event: 'US GDP Q4 Final (QoQ Ann.)', importance: 'high', previous: '2.3%', forecast: '2.3%', actual: '2.4%', category: 'GDP',
    outcome: 'GDP revised marginally higher to 2.4%. Consumer spending revised up to 4.2%.' },
  { id: 8, date: '2026-03-27', utcTime: '17:30', country: 'US', event: 'Core PCE Price Index (QoQ)', importance: 'high', previous: '2.5%', forecast: '2.5%', actual: '2.6%', category: 'Inflation',
    outcome: 'Core PCE for Q4 revised slightly higher to 2.6%. Modest hawkish surprise.' },
  { id: 9, date: '2026-03-27', utcTime: '20:00', country: 'US', event: 'University of Michigan Sentiment (Final)', importance: 'medium', previous: '57.9', forecast: '57.9', actual: '57.0', category: 'Consumer',
    outcome: 'UoM sentiment confirmed at 57.0, slightly below the preliminary 57.9. 1-year inflation expectations held at 4.9%, highest since 1981. Long-run inflation expectations at 3.9%. Stagflationary undertones; rates edged lower on the weak confidence print.' },

  // ── March 28 — Good Friday ────────────────────────────────────────────────
  { id: 10, date: '2026-03-28', utcTime: 'All Day', country: 'US', event: 'Good Friday — US & UK Markets Closed', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Holiday', outcome: null },
  { id: 11, date: '2026-03-28', utcTime: '17:30', country: 'US', event: 'Core PCE Price Index (MoM) — Feb', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: '0.4%', category: 'Inflation',
    outcome: 'Core PCE came in hotter than expected at +0.4% MoM (YoY 2.8%). Released on Good Friday with markets closed; the hawkish surprise was absorbed on Monday open with USD firming and rates rising. Further complicates the Fed\'s easing path.' },

  // ── March 30 ──────────────────────────────────────────────────────────────
  { id: 39, date: '2026-03-30', utcTime: '11:00', country: 'DE', event: 'Germany CPI Preliminary (YoY)', importance: 'high', previous: '1.9%', forecast: '2.7%', actual: '2.7%', category: 'Inflation',
    outcome: 'German CPI jumped to 2.7% YoY in March, meeting the elevated consensus and up sharply from 1.9% in February. Energy prices drove the surge (+7.2% YoY). EUR/USD firmed modestly; adds a hawkish dimension to the ECB outlook but April cut still broadly expected.' },
  { id: 40, date: '2026-03-30', utcTime: '16:25', country: 'US', event: 'Fed Chair Powell Speech', importance: 'high', previous: '—', forecast: '—', actual: '✓', category: 'Central Bank',
    outcome: 'Powell acknowledged that tariff impacts are larger than expected and present a potential stagflationary challenge — higher inflation alongside slower growth. He reiterated the Fed is in no rush and will wait for more clarity before adjusting rates. Equities sold off modestly on the stagflation commentary.' },
  { id: 41, date: '2026-03-30', utcTime: '23:30', country: 'JP', event: 'Tokyo CPI (YoY)', importance: 'medium', previous: '1.5%', forecast: '1.5%', actual: '1.4%', category: 'Inflation',
    outcome: 'Tokyo CPI eased marginally to 1.4% YoY, slightly below the 1.5% forecast and prior reading. Core CPI (ex-fresh food) came in at 1.7%, below BOJ\'s 2% target. A dovish signal; near-term BOJ rate hike bets pared back. JPY weakened modestly.' },

  // ── March 31 ──────────────────────────────────────────────────────────────
  { id: 42, date: '2026-03-31', utcTime: '01:00', country: 'JP', event: 'Japan Tankan Large Mfg Index Q1', importance: 'high', previous: '14', forecast: '12', actual: '12', category: 'PMI',
    outcome: 'Tankan Large Manufacturing DI held at 12 as expected, down from 14 in Q4 2025. Yen strength and soft export demand weighed on sentiment. Outlook also 12. Non-manufacturing held firm at 35. Little market reaction; BOJ rate hike expectations unchanged.' },
  { id: 43, date: '2026-03-31', utcTime: '01:30', country: 'CN', event: 'China NBS Manufacturing PMI', importance: 'high', previous: '49.0', forecast: '50.1', actual: '50.4', category: 'PMI',
    outcome: 'China NBS Manufacturing PMI beat expectations at 50.4, returning to expansion from 49.0 in February — the largest monthly jump in over a year. Production and new orders both expanded. Risk-on sentiment boosted; AUD, CNH and commodity prices all firmed.' },
  { id: 44, date: '2026-03-31', utcTime: '01:30', country: 'CN', event: 'China NBS Non-Manufacturing PMI', importance: 'medium', previous: '49.5', forecast: '49.9', actual: '50.1', category: 'PMI',
    outcome: 'Non-manufacturing PMI also beat at 50.1, back above the 50 threshold from 49.5. Services activity recovered as domestic consumption improved. Composite PMI rose to 50.5.' },
  { id: 45, date: '2026-03-31', utcTime: '06:00', country: 'DE', event: 'Germany Retail Sales (MoM)', importance: 'medium', previous: '-0.9%', forecast: '0.3%', actual: '-0.6%', category: 'Consumer',
    outcome: 'German retail sales disappointed at -0.6% MoM, missing the +0.3% consensus. A second consecutive monthly decline, raising concerns about German consumer health. EUR slipped modestly on the release.' },
  { id: 46, date: '2026-03-31', utcTime: '06:00', country: 'UK', event: 'UK GDP Q4 Final (QoQ)', importance: 'medium', previous: '0.1%', forecast: '0.1%', actual: '0.1%', category: 'GDP',
    outcome: 'UK Q4 GDP confirmed unrevised at +0.1% QoQ, in line with estimates. Annual GDP growth 1.3% for 2025. Business investment fell sharply in Q4. Little market reaction on the confirmation.' },
  { id: 12, date: '2026-03-31', utcTime: '09:00', country: 'EU', event: 'Eurozone CPI Flash (YoY)', importance: 'high', previous: '1.9%', forecast: '2.6%', actual: '2.5%', category: 'Inflation',
    outcome: 'Eurozone flash CPI rose to 2.5% YoY in March, up sharply from 1.9% in February, a touch below the 2.6% consensus. Energy prices reversed course and rose. EUR/USD was steady; ECB April cut still expected but the March spike adds a hawkish nuance.' },
  { id: 13, date: '2026-03-31', utcTime: '09:00', country: 'EU', event: 'Eurozone Core CPI Flash (YoY)', importance: 'high', previous: '2.4%', forecast: '2.5%', actual: '2.3%', category: 'Inflation',
    outcome: 'Core CPI beat to the downside at 2.3%, below the 2.5% forecast and the prior 2.4%. Services inflation eased. Meaningful progress toward target. EUR dipped; ECB cut expectations for April firmed to ~90%.' },

  // ── April 1 ───────────────────────────────────────────────────────────────
  { id: 47, date: '2026-04-01', utcTime: '01:45', country: 'CN', event: 'China Caixin Manufacturing PMI', importance: 'medium', previous: '52.1', forecast: '51.6', actual: '50.8', category: 'PMI',
    outcome: 'Caixin Manufacturing PMI eased to 50.8 in March, below the 51.6 consensus and down from 52.1. Still in expansion but momentum slowed. New export orders contracted amid trade uncertainty. CNH dipped modestly on the miss.' },
  { id: 48, date: '2026-04-01', utcTime: '07:00', country: 'EU', event: 'Eurozone Manufacturing PMI Final', importance: 'medium', previous: '50.8', forecast: '51.4', actual: '51.4', category: 'PMI',
    outcome: 'Eurozone manufacturing PMI confirmed at 51.4 in the final reading, matching the flash estimate and up from 50.8. Strongest reading in nearly four years. Germany and Italy led. EUR/USD largely unmoved on the confirmation.' },
  { id: 14, date: '2026-04-01', utcTime: '08:30', country: 'UK', event: 'UK Manufacturing PMI Final', importance: 'medium', previous: '51.7', forecast: '51.4', actual: '51.4', category: 'PMI',
    outcome: 'UK Manufacturing PMI confirmed at 51.4 in the final reading, matching the flash estimate and slightly below February\'s 51.7. Still in expansion territory for a fourth straight month. Output and new orders both rose modestly. Sterling little changed on the confirmation.' },
  { id: 49, date: '2026-04-01', utcTime: '12:15', country: 'US', event: 'ADP Non-Farm Employment Change', importance: 'high', previous: '63K', forecast: '41K', actual: '155K', category: 'Labour',
    outcome: 'ADP payrolls surged to 155K in March, far above the 41K consensus and a major turnaround from February\'s 63K. Leisure, hospitality and trade drove the gains. A strong pre-NFP signal. USD firmed on the print; Treasury yields rose modestly.' },
  { id: 15, date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing PMI', importance: 'high', previous: '52.4', forecast: '49.5', actual: '49.0', category: 'PMI',
    outcome: 'ISM Manufacturing fell back into contraction at 49.0 in March, down 3.4pts from February\'s 52.4 expansion reading. New orders and production both slipped below 50 as front-loading demand faded and tariff uncertainty weighed. Prices paid surged to 69.4. A stagflationary signal — soft activity but sticky input cost inflation. Equities sold off; dollar weakened.' },

  // ── April 2 ───────────────────────────────────────────────────────────────
  { id: 51, date: '2026-04-02', utcTime: '01:30', country: 'AU', event: 'Australia Trade Balance', importance: 'medium', previous: '5.62B', forecast: '5.50B', actual: null, category: 'GDP', outcome: null },
  { id: 52, date: '2026-04-02', utcTime: '06:30', country: 'CH', event: 'Switzerland CPI (YoY)', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Inflation', outcome: null },
  { id: 16, date: '2026-04-02', utcTime: '08:00', country: 'EU', event: 'Eurozone Services PMI Final', importance: 'medium', previous: '50.6', forecast: '50.6', actual: null, category: 'PMI', outcome: null },
  { id: 53, date: '2026-04-02', utcTime: '08:30', country: 'UK', event: 'UK Services PMI Final', importance: 'medium', previous: '51.0', forecast: '51.2', actual: null, category: 'PMI', outcome: null },
  { id: 17, date: '2026-04-02', utcTime: '14:00', country: 'US', event: 'ISM Services PMI', importance: 'high', previous: '53.5', forecast: '53.0', actual: null, category: 'PMI', outcome: null },
  { id: 18, date: '2026-04-02', utcTime: '14:00', country: 'US', event: 'JOLTS Job Openings', importance: 'medium', previous: '7.74M', forecast: '7.60M', actual: null, category: 'Labour', outcome: null },

  // ── April 3 — NFP Friday ──────────────────────────────────────────────────
  { id: 54, date: '2026-04-03', utcTime: '01:45', country: 'CN', event: 'China Caixin Services PMI', importance: 'medium', previous: '51.4', forecast: '51.2', actual: null, category: 'PMI', outcome: null },
  { id: 19, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Non-Farm Payrolls (NFP)', importance: 'high', previous: '151K', forecast: '140K', actual: null, category: 'Labour', outcome: null },
  { id: 20, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Unemployment Rate', importance: 'high', previous: '4.1%', forecast: '4.1%', actual: null, category: 'Labour', outcome: null },
  { id: 21, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Average Hourly Earnings (MoM)', importance: 'medium', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Labour', outcome: null },
  { id: 22, date: '2026-04-03', utcTime: '12:30', country: 'CA', event: 'Canada Employment Change', importance: 'medium', previous: '1.1K', forecast: '10.0K', actual: null, category: 'Labour', outcome: null },

  // ── April 7 ───────────────────────────────────────────────────────────────
  { id: 23, date: '2026-04-07', utcTime: '03:30', country: 'AU', event: 'RBA Interest Rate Decision', importance: 'high', previous: '4.10%', forecast: '4.10%', actual: null, category: 'Central Bank', outcome: null },
  { id: 55, date: '2026-04-07', utcTime: '04:30', country: 'AU', event: 'RBA Press Conference', importance: 'medium', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },

  // ── April 8 ───────────────────────────────────────────────────────────────
  { id: 56, date: '2026-04-08', utcTime: '06:00', country: 'DE', event: 'Germany Industrial Production (MoM)', importance: 'medium', previous: '-1.6%', forecast: '0.8%', actual: null, category: 'GDP', outcome: null },
  { id: 57, date: '2026-04-08', utcTime: '09:00', country: 'EU', event: 'Eurozone Retail Sales (MoM)', importance: 'medium', previous: '0.3%', forecast: '0.4%', actual: null, category: 'Consumer', outcome: null },
  { id: 58, date: '2026-04-08', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '224K', forecast: '226K', actual: null, category: 'Labour', outcome: null },

  // ── April 9 ───────────────────────────────────────────────────────────────
  { id: 24, date: '2026-04-09', utcTime: '11:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '4.50%', forecast: '4.25%', actual: null, category: 'Central Bank', outcome: null },
  { id: 25, date: '2026-04-09', utcTime: '11:30', country: 'UK', event: 'BOE MPC Minutes & Press Conference', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },

  // ── April 10 ──────────────────────────────────────────────────────────────
  { id: 59, date: '2026-04-10', utcTime: '06:00', country: 'UK', event: 'UK GDP (MoM) — Feb', importance: 'high', previous: '0.4%', forecast: '0.1%', actual: null, category: 'GDP', outcome: null },
  { id: 26, date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US CPI (YoY)', importance: 'high', previous: '2.8%', forecast: '2.6%', actual: null, category: 'Inflation', outcome: null },
  { id: 27, date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US Core CPI (MoM)', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: null, category: 'Inflation', outcome: null },
  { id: 60, date: '2026-04-10', utcTime: '14:00', country: 'US', event: 'Michigan Consumer Sentiment Prelim', importance: 'medium', previous: '57.0', forecast: '55.0', actual: null, category: 'Consumer', outcome: null },

  // ── April 11 ──────────────────────────────────────────────────────────────
  { id: 61, date: '2026-04-11', utcTime: '12:30', country: 'US', event: 'US PPI (MoM)', importance: 'medium', previous: '0.0%', forecast: '0.2%', actual: null, category: 'Inflation', outcome: null },

  // ── April 14 ──────────────────────────────────────────────────────────────
  { id: 28, date: '2026-04-14', utcTime: '12:30', country: 'US', event: 'US Retail Sales (MoM)', importance: 'high', previous: '0.2%', forecast: '0.5%', actual: null, category: 'Consumer', outcome: null },
  { id: 62, date: '2026-04-14', utcTime: '12:30', country: 'US', event: 'Empire State Manufacturing Index', importance: 'medium', previous: '-20.0', forecast: '-14.0', actual: null, category: 'PMI', outcome: null },

  // ── April 15 ──────────────────────────────────────────────────────────────
  { id: 63, date: '2026-04-15', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '226K', forecast: '225K', actual: null, category: 'Labour', outcome: null },
  { id: 64, date: '2026-04-15', utcTime: '12:30', country: 'US', event: 'Philadelphia Fed Manufacturing Index', importance: 'medium', previous: '-26.4', forecast: '-15.0', actual: null, category: 'PMI', outcome: null },

  // ── April 16 ──────────────────────────────────────────────────────────────
  { id: 29, date: '2026-04-16', utcTime: '12:30', country: 'US', event: 'US Housing Starts', importance: 'medium', previous: '1.37M', forecast: '1.39M', actual: null, category: 'Housing', outcome: null },
  { id: 65, date: '2026-04-16', utcTime: '12:30', country: 'US', event: 'Building Permits', importance: 'medium', previous: '1.46M', forecast: '1.44M', actual: null, category: 'Housing', outcome: null },
  { id: 66, date: '2026-04-16', utcTime: '13:15', country: 'US', event: 'Industrial Production (MoM)', importance: 'medium', previous: '0.7%', forecast: '0.3%', actual: null, category: 'GDP', outcome: null },

  // ── April 17 ──────────────────────────────────────────────────────────────
  { id: 30, date: '2026-04-17', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision', importance: 'high', previous: '2.65%', forecast: '2.40%', actual: null, category: 'Central Bank', outcome: null },
  { id: 31, date: '2026-04-17', utcTime: '12:45', country: 'EU', event: 'ECB Press Conference — Lagarde', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
  { id: 67, date: '2026-04-17', utcTime: '14:00', country: 'US', event: 'Michigan Consumer Sentiment Final', importance: 'medium', previous: '57.0', forecast: '55.0', actual: null, category: 'Consumer', outcome: null },

  // ── April 22 ──────────────────────────────────────────────────────────────
  { id: 68, date: '2026-04-22', utcTime: '06:00', country: 'UK', event: 'UK CPI (YoY)', importance: 'high', previous: '2.8%', forecast: '2.6%', actual: null, category: 'Inflation', outcome: null },
  { id: 69, date: '2026-04-22', utcTime: '06:00', country: 'UK', event: 'UK Core CPI (YoY)', importance: 'high', previous: '3.5%', forecast: '3.3%', actual: null, category: 'Inflation', outcome: null },

  // ── April 23 ──────────────────────────────────────────────────────────────
  { id: 32, date: '2026-04-23', utcTime: '07:30', country: 'UK', event: 'UK PMI Composite Flash', importance: 'medium', previous: '50.5', forecast: '50.3', actual: null, category: 'PMI', outcome: null },
  { id: 33, date: '2026-04-23', utcTime: '08:00', country: 'EU', event: 'Eurozone PMI Composite Flash', importance: 'high', previous: '50.2', forecast: '50.5', actual: null, category: 'PMI', outcome: null },
  { id: 70, date: '2026-04-23', utcTime: '12:30', country: 'CA', event: 'Canada CPI (YoY)', importance: 'high', previous: '2.6%', forecast: '2.4%', actual: null, category: 'Inflation', outcome: null },
  { id: 34, date: '2026-04-23', utcTime: '13:45', country: 'US', event: 'S&P Global US PMI Composite Flash', importance: 'medium', previous: '53.5', forecast: '52.8', actual: null, category: 'PMI', outcome: null },
  { id: 71, date: '2026-04-23', utcTime: '14:00', country: 'US', event: 'New Home Sales', importance: 'medium', previous: '676K', forecast: '660K', actual: null, category: 'Housing', outcome: null },

  // ── April 24 ──────────────────────────────────────────────────────────────
  { id: 72, date: '2026-04-24', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '225K', forecast: '224K', actual: null, category: 'Labour', outcome: null },
  { id: 73, date: '2026-04-24', utcTime: '14:00', country: 'US', event: 'Existing Home Sales', importance: 'medium', previous: '4.26M', forecast: '4.15M', actual: null, category: 'Housing', outcome: null },

  // ── April 25 ──────────────────────────────────────────────────────────────
  { id: 35, date: '2026-04-25', utcTime: '12:30', country: 'US', event: 'US GDP Q1 Advance (QoQ Ann.)', importance: 'high', previous: '2.4%', forecast: '1.5%', actual: null, category: 'GDP', outcome: null },
  { id: 36, date: '2026-04-25', utcTime: '12:30', country: 'US', event: 'Core PCE Price Index (MoM) — Mar', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: null, category: 'Inflation', outcome: null },
  { id: 74, date: '2026-04-25', utcTime: '12:30', country: 'US', event: 'Employment Cost Index Q1', importance: 'medium', previous: '0.9%', forecast: '0.9%', actual: null, category: 'Labour', outcome: null },

  // ── April 28 ──────────────────────────────────────────────────────────────
  { id: 75, date: '2026-04-28', utcTime: '06:00', country: 'DE', event: 'Germany GDP Preliminary Q1 (QoQ)', importance: 'high', previous: '0.2%', forecast: '0.3%', actual: null, category: 'GDP', outcome: null },
  { id: 76, date: '2026-04-28', utcTime: '09:00', country: 'EU', event: 'Eurozone GDP Flash Q1 (QoQ)', importance: 'high', previous: '0.2%', forecast: '0.3%', actual: null, category: 'GDP', outcome: null },

  // ── April 29 ──────────────────────────────────────────────────────────────
  { id: 37, date: '2026-04-29', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '4.25–4.50%', forecast: '4.25–4.50%', actual: null, category: 'Central Bank', outcome: null },

  // ── April 30 ──────────────────────────────────────────────────────────────
  { id: 78, date: '2026-04-30', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '224K', forecast: '223K', actual: null, category: 'Labour', outcome: null },
  { id: 79, date: '2026-04-30', utcTime: '14:00', country: 'US', event: 'CB Consumer Confidence — Apr', importance: 'high', previous: '92.9', forecast: '90.0', actual: null, category: 'Consumer', outcome: null },
  { id: 38, date: '2026-04-30', utcTime: '18:30', country: 'US', event: 'FOMC Press Conference — Powell', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
];

function toLocalTime(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return utcTime;
  const dt = new Date(`${dateStr}T${utcTime}:00Z`);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function localTzLabel() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Get abbreviated offset label (e.g. BST, EST, CET)
  const parts = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: tz }).formatToParts(new Date());
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value || tz.split('/').pop().replace(/_/g, ' ');
  return tzName;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getWeekEnd(today) {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function ActualBadge({ actual, forecast }) {
  if (!actual) return <span className="text-muted-foreground/30 text-xs font-mono tabular-nums">—</span>;
  const aNum = parseFloat(actual);
  const fNum = parseFloat(forecast);
  const beat = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const miss = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
      beat ? 'bg-emerald-400/15 text-emerald-400' :
      miss ? 'bg-red-400/15 text-red-400' :
      'bg-muted/50 text-foreground/80'
    }`}>
      {beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {actual}
    </span>
  );
}

function EventRow({ event, today }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === today;
  const isHigh = event.importance === 'high';
  const catColor = CATEGORY_COLORS[event.category] || 'text-muted-foreground';
  const hasPending = event.forecast !== '—' && !event.actual;

  return (
    <div className={`border-b border-border/20 last:border-0 ${isToday && isHigh ? 'bg-primary/3' : ''}`}>
      <button
        className="w-full text-left px-5 py-3.5 hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-mono w-14 shrink-0 ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground/60'}`}>
            {toLocalTime(event.date, event.utcTime)}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 w-6 shrink-0 tracking-wide">{COUNTRY_LABELS[event.country] || event.country}</span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isHigh ? 'bg-amber-400' : event.importance === 'medium' ? 'bg-blue-400/70' : 'bg-border'
          }`} />
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>
              {event.event}
            </span>
            <span className={`text-xs shrink-0 hidden sm:inline ${catColor}`}>{event.category}</span>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="hidden md:flex flex-col items-end w-16">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Prev</span>
              <span className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.previous}</span>
            </div>
            <div className="hidden md:flex flex-col items-end w-16">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Fcst</span>
              <span className={`text-xs font-mono tabular-nums ${hasPending ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                {event.forecast}
              </span>
            </div>
            <div className="flex flex-col items-end w-20">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Actual</span>
              <ActualBadge actual={event.actual} forecast={event.forecast} />
            </div>
            <span className="text-muted-foreground/30 w-4">
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>
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
            <div className="px-5 pb-4 pl-[4.5rem] border-t border-border/15">
              <p className="text-xs text-muted-foreground leading-relaxed pt-3">
                {event.outcome || `${event.event} is scheduled at ${toLocalTime(event.date, event.utcTime)} (local). ${event.forecast !== '—' ? `Market consensus is ${event.forecast} versus the prior reading of ${event.previous}.` : 'No specific consensus forecast.'} ${event.category === 'Central Bank' ? 'Any forward guidance on rates or policy will be the primary market driver.' : ''}`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DateGroup({ dateStr, events, today }) {
  const isToday = dateStr === today;
  const highCount = events.filter(e => e.importance === 'high').length;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2 px-1">
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
        <span className={`text-xs font-semibold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
          {isToday ? 'Today · ' : ''}{formatDate(dateStr)}
        </span>
        {highCount > 0 && (
          <span className="text-[10px] text-amber-400/70 px-1.5 py-0.5 rounded bg-amber-400/8 border border-amber-400/15 ml-auto">
            {highCount} high impact
          </span>
        )}
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-2 border-b border-border/30 bg-muted/5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-14">Time ({localTzLabel()})</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-6 shrink-0">Ctry</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-3 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 flex-1">Event</span>
          <div className="flex items-center gap-5 shrink-0">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-16 text-right hidden md:block">Previous</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-16 text-right hidden md:block">Forecast</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/40 w-20 text-right">Actual</span>
            <span className="w-4" />
          </div>
        </div>
        {events.map(e => <EventRow key={e.id} event={e} today={today} />)}
      </div>
    </div>
  );
}

export default function EconomicCalendar() {
  const [tab, setTab] = useState('today');
  const [today, setToday] = useState(getTodayStr);

  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight - now;
    };
    const timer = setTimeout(() => setToday(getTodayStr()), msUntilMidnight());
    return () => clearTimeout(timer);
  }, [today]);

  const monthEnd = useMemo(() => {
    const d = new Date(today + 'T00:00:00');
    d.setMonth(d.getMonth() + 2, 0);
    return d.toISOString().split('T')[0];
  }, [today]);

  const filtered = useMemo(() => {
    const weekEnd = getWeekEnd(today);
    return EVENTS.filter(e => {
      if (tab === 'today')    return e.date === today;
      if (tab === 'week')     return e.date >= today && e.date <= weekEnd;
      if (tab === 'month')    return e.date >= today && e.date <= monthEnd;
      if (tab === 'previous') return e.date < today;
      return true;
    });
  }, [tab, today, monthEnd]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return tab === 'previous' ? sorted.reverse() : sorted;
  }, [filtered, tab]);

  const todayHighCount = EVENTS.filter(e => e.date === today && e.importance === 'high').length;
  const todayReleasedCount = EVENTS.filter(e => e.date === today && e.actual).length;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Events</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground">Central bank decisions, macro releases, and market-moving data.</p>
        </motion.div>

        {tab === 'today' && (
          <motion.div className="flex gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">High Impact Today</p>
                <p className="text-lg font-semibold">{todayHighCount}</p>
              </div>
            </div>
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-lg font-semibold">{todayReleasedCount} <span className="text-sm font-normal text-muted-foreground">/ {EVENTS.filter(e => e.date === today).length}</span></p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit flex-wrap">
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
                tab === t.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {grouped.map(([dateStr, events]) => (
            <DateGroup key={dateStr} dateStr={dateStr} events={events} today={today} />
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No events for this period</p>
            </div>
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground/30 text-center mt-8">
          Click any row to expand the outcome summary. Times are shown in your local timezone.
        </p>
      </div>
    </div>
  );
}