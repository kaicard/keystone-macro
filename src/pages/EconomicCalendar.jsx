import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, Zap, ChevronDown, ChevronUp, BarChart2, AlertTriangle, Activity, RefreshCw, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COUNTRY_LABELS = {
  US: 'US', UK: 'UK', EU: 'EU', JP: 'JP', CN: 'CN',
  CA: 'CA', AU: 'AU', CH: 'CH', DE: 'DE', FR: 'FR',
};

const CATEGORY_COLORS = {
  'Central Bank': 'text-amber-400 bg-amber-400/10',
  'Inflation':    'text-red-400 bg-red-400/10',
  'Labour':       'text-blue-400 bg-blue-400/10',
  'GDP':          'text-emerald-400 bg-emerald-400/10',
  'PMI':          'text-purple-400 bg-purple-400/10',
  'Consumer':     'text-cyan-400 bg-cyan-400/10',
  'Housing':      'text-orange-400 bg-orange-400/10',
  'Holiday':      'text-muted-foreground bg-muted/30',
};

const EVENTS = [
  { id: 100, date: '2026-03-17', utcTime: '09:00', country: 'EU', event: 'Eurozone ZEW Economic Sentiment', importance: 'medium', previous: '58.3', forecast: '26.5', actual: '-8.5', category: 'Consumer', outcome: 'Eurozone ZEW sentiment collapsed to -8.5, far below the 26.5 consensus and the 58.3 prior. The Middle East conflict and oil price surge erased optimism. EUR/USD fell sharply; European equities sold off.' },
  { id: 101, date: '2026-03-17', utcTime: '09:00', country: 'DE', event: 'Germany ZEW Economic Sentiment', importance: 'high', previous: '58.3', forecast: '39.0', actual: '-0.5', category: 'Consumer', outcome: 'German ZEW collapsed from 58.3 to -0.5, the lowest since April 2025 and far below the 39.0 forecast. The Iran war and oil price spike crushed investor optimism. DAX sold off sharply.' },
  { id: 102, date: '2026-03-17', utcTime: '12:30', country: 'US', event: 'US Retail Sales (MoM)', importance: 'high', previous: '-0.1%', forecast: '0.5%', actual: '-0.3%', category: 'Consumer', outcome: 'US retail sales fell 0.3% MoM in February, a significant miss versus the 0.5% consensus. January revised slightly worse to -0.1%. Broad-based weakness: clothing, electronics and restaurants all declined. Dollar weakened; recession concerns rose.' },
  { id: 103, date: '2026-03-17', utcTime: '14:00', country: 'US', event: 'Business Inventories (MoM)', importance: 'low', previous: '0.1%', forecast: '0.3%', actual: '0.3%', category: 'GDP', outcome: null },
  { id: 104, date: '2026-03-17', utcTime: '14:00', country: 'US', event: 'NAHB Housing Market Index', importance: 'medium', previous: '42', forecast: '42', actual: '39', category: 'Housing', outcome: 'NAHB Housing Market Index fell to 39, the lowest since late 2023, well below the 42 consensus. Builder sentiment hit by tariff uncertainty on lumber and materials plus slowing buyer traffic.' },
  { id: 105, date: '2026-03-18', utcTime: '12:30', country: 'US', event: 'Housing Starts', importance: 'medium', previous: '1.47M', forecast: '1.38M', actual: '1.50M', category: 'Housing', outcome: 'Housing starts surprised to the upside at 1.50M, well above the 1.38M forecast and prior month. Multi-family construction drove the beat. Building permits also firmed at 1.46M.' },
  { id: 106, date: '2026-03-18', utcTime: '13:15', country: 'US', event: 'Industrial Production (MoM)', importance: 'medium', previous: '0.5%', forecast: '0.1%', actual: '0.7%', category: 'GDP', outcome: 'Industrial production surprised to the upside at +0.7%, boosted by utilities output amid cold weather. Manufacturing sub-index +0.3%, above expectations. A positive outlier in a weak data week.' },
  { id: 107, date: '2026-03-19', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '3.50–3.75%', forecast: '3.50–3.75%', actual: '3.50–3.75%', category: 'Central Bank', outcome: 'Fed held rates at 3.50–3.75% as expected. Dot plot showed median of one cut in 2026, down from two. GDP forecasts trimmed; PCE inflation upgraded. Iran war and oil price spike flagged as upside inflation risks. Equities dipped; bond yields rose slightly.' },
  { id: 108, date: '2026-03-19', utcTime: '18:30', country: 'US', event: 'FOMC Press Conference — Powell', importance: 'high', previous: '—', forecast: '—', actual: '✓', category: 'Central Bank', outcome: 'Powell struck a cautious tone, noting the Iran war added "unusually high" uncertainty to the outlook. Emphasised "no rush" on rate cuts and that the Fed was well positioned to wait for clarity. Markets interpreted the presser as modestly hawkish.' },
  { id: 109, date: '2026-03-20', utcTime: '08:30', country: 'CH', event: 'SNB Interest Rate Decision', importance: 'high', previous: '0.00%', forecast: '0.00%', actual: '0.00%', category: 'Central Bank', outcome: 'SNB held the policy rate at 0.00% as widely expected, signalling readiness to intervene in FX markets to curb CHF strength following the Iran war safe-haven bid. Inflation forecast revised up marginally.' },
  { id: 110, date: '2026-03-20', utcTime: '12:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '3.75%', forecast: '3.75%', actual: '3.75%', category: 'Central Bank', outcome: 'BOE held at 3.75% unanimously. MPC cited Iran war energy price spike as an upside inflation risk, overriding the near-term case for a cut. MPC minutes showed two members had considered a 25bp cut but voted to hold.' },
  { id: 111, date: '2026-03-20', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '220K', forecast: '224K', actual: '223K', category: 'Labour', outcome: 'Claims rose to 223K, roughly in line with the 224K consensus. Continuing claims edged up to 1.892M. Labour market softening at the margins but no sharp deterioration signal.' },
  { id: 112, date: '2026-03-20', utcTime: '12:30', country: 'US', event: 'Current Account', importance: 'medium', previous: '-$310.9B', forecast: '-$323.0B', actual: '-$303.9B', category: 'GDP', outcome: 'Current account deficit narrowed to $303.9B in Q4, a smaller deficit than the $323.0B consensus. Services surplus widened. USD firmed briefly on the release.' },
  { id: 113, date: '2026-03-21', utcTime: '12:30', country: 'CA', event: 'Canada Retail Sales (MoM)', importance: 'medium', previous: '-0.6%', forecast: '0.4%', actual: '0.0%', category: 'Consumer', outcome: 'Canadian retail sales flat in January, missing the 0.4% forecast. Auto sales dragged lower. Core retail sales (ex-autos) rose 0.3%. CAD weakened modestly on the soft headline.' },
  { id: 114, date: '2026-03-24', utcTime: '03:15', country: 'FR', event: 'French Flash Manufacturing PMI', importance: 'medium', previous: '45.8', forecast: '46.5', actual: '48.3', category: 'PMI', outcome: 'French flash manufacturing PMI beat at 48.3, best in 10 months, up from 45.8. Still contractionary but the rate of decline slowed sharply. EUR/USD nudged higher.' },
  { id: 115, date: '2026-03-24', utcTime: '03:15', country: 'FR', event: 'French Flash Services PMI', importance: 'medium', previous: '45.3', forecast: '46.5', actual: '46.6', category: 'PMI', outcome: 'French flash services PMI came in at 46.6, just above the 46.5 consensus. Still in contraction but the pace of decline eased modestly.' },
  { id: 116, date: '2026-03-24', utcTime: '03:30', country: 'DE', event: 'German Flash Manufacturing PMI', importance: 'high', previous: '46.5', forecast: '47.5', actual: '48.3', category: 'PMI', outcome: 'German flash manufacturing PMI beat at 48.3, a nine-month high, above the 47.5 forecast. Still contracting but trajectory improving, driven by the fiscal infrastructure optimism.' },
  { id: 117, date: '2026-03-24', utcTime: '03:30', country: 'DE', event: 'German Flash Services PMI', importance: 'medium', previous: '52.8', forecast: '52.2', actual: '51.7', category: 'PMI', outcome: 'German flash services PMI fell to 51.7, below the 52.2 forecast and prior month, as war uncertainty dampened the services sector.' },
  { id: 118, date: '2026-03-24', utcTime: '09:00', country: 'EU', event: 'Eurozone Flash Manufacturing PMI', importance: 'high', previous: '47.6', forecast: '48.6', actual: '48.7', category: 'PMI', outcome: 'Eurozone flash manufacturing PMI edged up to 48.7, slightly above forecast. Still contracting but momentum improving. Germany led; France also firmed. EUR/USD stable.' },
  { id: 119, date: '2026-03-24', utcTime: '09:00', country: 'EU', event: 'Eurozone Flash Services PMI', importance: 'high', previous: '50.6', forecast: '51.0', actual: '51.0', category: 'PMI', outcome: 'Eurozone flash services PMI matched the 51.0 consensus, unchanged from prior. Composite PMI moved to 50.4 from 50.2. Marginal expansion; war uncertainty capping upside.' },
  { id: 120, date: '2026-03-24', utcTime: '09:30', country: 'UK', event: 'UK Flash Manufacturing PMI', importance: 'medium', previous: '46.9', forecast: '47.6', actual: '44.6', category: 'PMI', outcome: 'UK flash manufacturing PMI collapsed to 44.6, a 14-month low and a significant miss versus the 47.6 forecast. Output contracted sharply. Pre-budget uncertainty and war-related supply chain disruption weighed heavily. Sterling fell.' },
  { id: 121, date: '2026-03-24', utcTime: '09:30', country: 'UK', event: 'UK Flash Services PMI', importance: 'high', previous: '51.0', forecast: '51.0', actual: '53.2', category: 'PMI', outcome: 'UK flash services PMI beat strongly at 53.2 versus 51.0 forecast, a three-month high. New business and employment both rose. Composite PMI moved to 52.0, suggesting resilient domestic services offset the manufacturing drag.' },
  { id: 122, date: '2026-03-24', utcTime: '13:45', country: 'US', event: 'S&P Global US Flash Manufacturing PMI', importance: 'medium', previous: '52.7', forecast: '52.0', actual: '49.8', category: 'PMI', outcome: 'US flash manufacturing PMI fell back below 50 to 49.8, a notable miss and worst since late 2023. New export orders contracted. Tariff-related frontloading that had boosted earlier readings unwound sharply.' },
  { id: 123, date: '2026-03-24', utcTime: '13:45', country: 'US', event: 'S&P Global US Flash Services PMI', importance: 'medium', previous: '51.0', forecast: '51.2', actual: '54.3', category: 'PMI', outcome: 'US flash services PMI surged to 54.3, well above the 51.2 consensus and the prior 51.0. Strong domestic demand and employment drove the gains. Composite PMI moved to 53.5.' },
  { id: 124, date: '2026-03-24', utcTime: '14:00', country: 'US', event: 'New Home Sales', importance: 'medium', previous: '657K', forecast: '678K', actual: '676K', category: 'Housing', outcome: 'New home sales came in at 676K in February, just below the 678K forecast. Sales supported by builders offering rate buydowns. Inventory at 8.9 months supply, elevated.' },
  { id: 125, date: '2026-03-25', utcTime: '09:00', country: 'DE', event: 'Germany Ifo Business Climate', importance: 'high', previous: '85.2', forecast: '85.5', actual: '86.7', category: 'Consumer', outcome: 'Ifo business climate beat at 86.7, highest since June 2024, above the 85.5 forecast. Both current conditions and expectations improved, reflecting fiscal stimulus and infrastructure package optimism. EUR/USD firmed.' },
  { id: 126, date: '2026-03-25', utcTime: '14:00', country: 'US', event: 'CB Consumer Confidence', importance: 'high', previous: '98.3', forecast: '94.0', actual: '92.9', category: 'Consumer', outcome: "CB Consumer Confidence fell to 92.9, below both the 94.0 forecast and January's 98.3 reading. The present situation index held but expectations fell sharply to 65.2, well below the 80 recession-risk threshold. A stagflationary signal." },
  { id: 1, date: '2026-03-26', utcTime: '07:00', country: 'UK', event: 'UK CPI (YoY)', importance: 'high', previous: '3.0%', forecast: '2.9%', actual: '2.8%', category: 'Inflation', outcome: 'UK CPI eased to 2.8% YoY in February, below both the 2.9% forecast and the 3.0% prior. Core CPI fell to 3.5%. Services inflation eased to 5.0%. A welcome disinflation print; BOE cut expectations for May firmed modestly. Sterling dipped.' },
  { id: 2, date: '2026-03-26', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '223K', forecast: '225K', actual: '224K', category: 'Labour', outcome: 'Claims rose to 224K, in line with the 225K consensus. Continuing claims rose to 1.897M, the highest since late 2021. The gradual rise in continuing claims suggests laid-off workers are taking longer to find new jobs.' },
  { id: 3, date: '2026-03-26', utcTime: '12:30', country: 'US', event: 'Durable Goods Orders (MoM)', importance: 'medium', previous: '-0.8%', forecast: '0.8%', actual: '0.9%', category: 'Consumer', outcome: 'Durable goods orders beat at +0.9% MoM in February, above the 0.8% forecast. Defence orders surged +10.4%. Core capex orders (ex-defense, ex-aircraft) +0.0%, flat. Business investment remains stalled.' },
  { id: 4, date: '2026-03-26', utcTime: '14:00', country: 'US', event: 'Pending Home Sales (MoM)', importance: 'medium', previous: '-4.6%', forecast: '1.0%', actual: '-3.6%', category: 'Housing', outcome: 'Pending home sales fell 3.6% MoM in February, missing the +1.0% consensus. High mortgage rates and elevated prices continue to weigh on contract signings. A weak lead indicator for future existing home sales.' },
  { id: 5, date: '2026-03-27', utcTime: '07:00', country: 'UK', event: 'UK Retail Sales (MoM)', importance: 'high', previous: '2.0%', forecast: '-0.4%', actual: '-0.4%', category: 'Consumer', outcome: "UK retail sales fell 0.4% MoM in February, in line with the -0.4% forecast. A pullback from January's strong +2.0% driven by wet weather. Annual growth slowed to 2.2%. Core retail sales (ex-fuel) also -0.4%." },
  { id: 6, date: '2026-03-27', utcTime: '12:30', country: 'US', event: 'US GDP Q4 Final (QoQ Ann.)', importance: 'high', previous: '2.3%', forecast: '2.3%', actual: '2.4%', category: 'GDP', outcome: 'Q4 GDP revised up to 2.4% annualised, a touch above the 2.3% consensus and prior estimate. Consumer spending revised higher to 4.2%. A solid end to 2025 but Q1 2026 tracking sub-1% amid tariff uncertainty.' },
  { id: 7, date: '2026-03-27', utcTime: '12:30', country: 'US', event: 'Core PCE Price Index Q4 (QoQ Ann.)', importance: 'medium', previous: '2.5%', forecast: '2.6%', actual: '2.6%', category: 'Inflation', outcome: "Q4 core PCE revised up to 2.6% annualised, above the 2.5% prior and in line with forecast. Still above the Fed's 2% target. No surprise; markets little moved." },
  { id: 8, date: '2026-03-27', utcTime: '14:00', country: 'US', event: 'University of Michigan Sentiment (Final)', importance: 'medium', previous: '57.9', forecast: '57.9', actual: '57.0', category: 'Consumer', outcome: 'UoM final sentiment revised down to 57.0 from 57.9 preliminary, the lowest since late 2022. 1-year inflation expectations at 4.9%, revised up from 4.9%. Long-run expectations at 3.9%. Consumer mood souring on tariff and war uncertainty.' },
  { id: 10, date: '2026-03-28', utcTime: 'All Day', country: 'US', event: 'Good Friday — US & UK Markets Closed', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Holiday', outcome: null },
  { id: 39, date: '2026-03-31', utcTime: '00:30', country: 'JP', event: 'Japan Tankan Large Manufacturing Index Q1', importance: 'high', previous: '14', forecast: '13', actual: '12', category: 'PMI', outcome: 'Tankan Large Manufacturing DI fell to 12, below the 13 forecast and down from 14 in Q4 2025. Yen strength and soft export demand weighed. Non-manufacturing held firm at 35. BOJ rate hike expectations pared back marginally.' },
  { id: 40, date: '2026-03-31', utcTime: '01:30', country: 'CN', event: 'China NBS Manufacturing PMI', importance: 'high', previous: '50.2', forecast: '50.4', actual: '50.5', category: 'PMI', outcome: 'China NBS Manufacturing PMI beat at 50.5, above the 50.4 forecast and 50.2 prior. Production and new orders both expanded. A positive signal; AUD, CNH and commodity prices firmed on the release.' },
  { id: 41, date: '2026-03-31', utcTime: '01:30', country: 'CN', event: 'China NBS Non-Manufacturing PMI', importance: 'medium', previous: '50.4', forecast: '50.7', actual: '50.8', category: 'PMI', outcome: 'Non-manufacturing PMI beat at 50.8, above the 50.7 forecast. Services and construction both expanded. Composite PMI rose to 50.8.' },
  { id: 42, date: '2026-03-31', utcTime: '06:00', country: 'DE', event: 'Germany Retail Sales (MoM)', importance: 'medium', previous: '-1.1%', forecast: '0.3%', actual: '-0.6%', category: 'Consumer', outcome: 'German retail sales disappointed at -0.6% MoM, missing the +0.3% consensus. A second consecutive monthly decline, raising concerns about German consumer health. EUR slipped modestly.' },
  { id: 43, date: '2026-03-31', utcTime: '06:00', country: 'UK', event: 'UK GDP Q4 Final (QoQ)', importance: 'medium', previous: '0.1%', forecast: '0.1%', actual: '0.1%', category: 'GDP', outcome: 'UK Q4 GDP confirmed unrevised at +0.1% QoQ. Annual 2025 GDP growth 1.1%. Business investment fell sharply in Q4. Little market reaction on the confirmation.' },
  { id: 44, date: '2026-03-31', utcTime: '06:00', country: 'UK', event: 'UK Current Account (QoQ)', importance: 'medium', previous: '-£10.7B', forecast: '-£24.0B', actual: '-£18.4B', category: 'GDP', outcome: 'UK current account deficit narrowed to -£18.4B in Q4, better than the -£24.0B forecast. Trade in goods deficit narrowed slightly. Sterling firmed modestly on the beat.' },
  { id: 45, date: '2026-03-31', utcTime: '06:00', country: 'UK', event: 'Nationwide HPI (MoM)', importance: 'medium', previous: '0.4%', forecast: '0.0%', actual: '0.0%', category: 'Housing', outcome: 'Nationwide house prices were flat in March, in line with the 0.0% forecast. Annual HPI growth eased to 3.9%. War uncertainty and BOE hold dampened sentiment.' },
  { id: 46, date: '2026-03-31', utcTime: '08:55', country: 'DE', event: 'Germany Unemployment Change', importance: 'medium', previous: '1K', forecast: '2K', actual: '0K', category: 'Labour', outcome: 'German unemployment was unchanged in March, better than the 2K rise expected. Unemployment rate held at 6.2%, the lowest since 2024. A resilient German labour market signal.' },
  { id: 12, date: '2026-03-31', utcTime: '09:00', country: 'EU', event: 'Eurozone Core CPI Flash (YoY)', importance: 'high', previous: '2.6%', forecast: '2.5%', actual: '2.4%', category: 'Inflation', outcome: 'Eurozone core CPI came in at 2.4%, below both the 2.5% forecast and 2.6% prior. Services inflation fell to 3.4%. A strong disinflation signal. ECB April cut expectations firmed to ~95%. EUR/USD slipped.' },
  { id: 13, date: '2026-03-31', utcTime: '09:00', country: 'EU', event: 'Eurozone CPI Flash (YoY)', importance: 'high', previous: '2.3%', forecast: '2.3%', actual: '2.2%', category: 'Inflation', outcome: 'Eurozone headline CPI eased to 2.2%, below both the 2.3% forecast and prior. Energy prices fell for a second consecutive month. Disinflation trend intact. ECB April cut firmly priced.' },
  { id: 47, date: '2026-03-31', utcTime: '12:30', country: 'CA', event: 'Canada GDP (MoM)', importance: 'medium', previous: '0.3%', forecast: '0.3%', actual: '0.4%', category: 'GDP', outcome: 'Canada GDP grew 0.4% MoM in January, beating the 0.3% forecast. Oil & gas extraction and manufacturing both contributed. CAD firmed modestly; BOC rate cut expectations for April pared slightly.' },
  { id: 48, date: '2026-04-01', utcTime: '01:45', country: 'CN', event: 'China Caixin Manufacturing PMI', importance: 'medium', previous: '50.8', forecast: '51.1', actual: '51.2', category: 'PMI', outcome: 'Caixin Manufacturing PMI beat at 51.2 in March, above both the 51.1 forecast and 50.8 prior. New orders and output both rose. A mild positive signal for Chinese manufacturing momentum.' },
  { id: 49, date: '2026-04-01', utcTime: '08:00', country: 'EU', event: 'Eurozone Manufacturing PMI Final', importance: 'medium', previous: '47.6', forecast: '48.7', actual: '48.6', category: 'PMI', outcome: 'Eurozone final manufacturing PMI confirmed at 48.6, a touch below the 48.7 flash. Still contracting but at the slowest pace in nearly two years. Germany and Spain led the improvement.' },
  { id: 14, date: '2026-04-01', utcTime: '08:30', country: 'UK', event: 'UK Manufacturing PMI Final', importance: 'medium', previous: '46.9', forecast: '44.6', actual: '44.9', category: 'PMI', outcome: 'UK final manufacturing PMI confirmed at 44.9, a slight upward revision from the 44.6 flash but still a deep contraction. Pre-tariff disruptions and war uncertainty weighed heavily. Sterling little changed.' },
  { id: 50, date: '2026-04-01', utcTime: '11:15', country: 'US', event: 'ADP Non-Farm Employment Change', importance: 'high', previous: '66K', forecast: '41K', actual: '62K', category: 'Labour', outcome: "ADP payrolls came in at 62K in March, above the 41K forecast but below February's 66K. Small employers drove job growth. Trade and transportation continued declining. A mixed pre-NFP signal; USD dipped slightly." },
  { id: 51, date: '2026-04-01', utcTime: '12:30', country: 'US', event: 'Core Retail Sales (MoM)', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: '0.5%', category: 'Consumer', outcome: 'Core retail sales (ex-autos) beat at +0.5% MoM in March, above the 0.3% forecast. Pre-tariff front-loading drove auto and electronics purchases. USD firmed modestly.' },
  { id: 52, date: '2026-04-01', utcTime: '12:30', country: 'US', event: 'Retail Sales (MoM)', importance: 'high', previous: '-0.1%', forecast: '0.5%', actual: '0.6%', category: 'Consumer', outcome: "Headline retail sales beat at +0.6% MoM in March, bouncing back strongly from February's -0.1%. Auto and appliance sales led. A solid print likely boosted by pre-tariff front-loading." },
  { id: 53, date: '2026-04-01', utcTime: '13:45', country: 'US', event: 'S&P Global US Manufacturing PMI Final', importance: 'medium', previous: '52.7', forecast: '49.8', actual: '50.2', category: 'PMI', outcome: 'S&P Global manufacturing PMI revised up to 50.2, back into expansion territory from the 49.8 flash estimate. Output and employment improved. Dollar strengthened marginally.' },
  { id: 15, date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing PMI', importance: 'high', previous: '50.3', forecast: '49.5', actual: '49.0', category: 'PMI', outcome: 'ISM Manufacturing came in at 49.0 for March, below the 49.5 consensus and prior 50.3, falling back into contraction. Prices paid surged to 69.4 on tariff pass-through, confirming stagflationary pressures. New orders fell sharply.' },
  { id: 83, date: '2026-04-01', utcTime: '14:00', country: 'US', event: 'ISM Manufacturing Prices Paid', importance: 'medium', previous: '62.4', forecast: '69.0', actual: '69.4', category: 'PMI', outcome: "ISM Prices Paid jumped to 69.4, above the 69.0 forecast, the highest since 2022. Tariff-driven input cost inflation is accelerating. A clear stagflationary signal reinforcing the Fed's on-hold stance." },
  { id: 300, date: '2026-04-02', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '224K', forecast: '225K', actual: null, category: 'Labour', outcome: null },
  { id: 54, date: '2026-04-02', utcTime: '01:30', country: 'AU', event: 'Australia Trade Balance', importance: 'medium', previous: '5.62B', forecast: '5.50B', actual: null, category: 'GDP', outcome: null },
  { id: 55, date: '2026-04-02', utcTime: '06:30', country: 'CH', event: 'Switzerland CPI (YoY)', importance: 'high', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Inflation', outcome: null },
  { id: 16, date: '2026-04-02', utcTime: '08:00', country: 'EU', event: 'Eurozone Services PMI Final', importance: 'medium', previous: '50.6', forecast: '51.0', actual: null, category: 'PMI', outcome: null },
  { id: 56, date: '2026-04-02', utcTime: '08:30', country: 'UK', event: 'UK Services PMI Final', importance: 'medium', previous: '53.2', forecast: '53.2', actual: null, category: 'PMI', outcome: null },
  { id: 17, date: '2026-04-02', utcTime: '14:00', country: 'US', event: 'ISM Services PMI', importance: 'high', previous: '53.5', forecast: '53.0', actual: null, category: 'PMI', outcome: null },
  { id: 18, date: '2026-04-02', utcTime: '14:00', country: 'US', event: 'JOLTS Job Openings', importance: 'medium', previous: '7.74M', forecast: '7.60M', actual: null, category: 'Labour', outcome: null },
  { id: 57, date: '2026-04-03', utcTime: '01:45', country: 'CN', event: 'China Caixin Services PMI', importance: 'medium', previous: '51.4', forecast: '51.5', actual: null, category: 'PMI', outcome: null },
  { id: 19, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Non-Farm Payrolls (NFP)', importance: 'high', previous: '151K', forecast: '138K', actual: null, category: 'Labour', outcome: null },
  { id: 20, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Unemployment Rate', importance: 'high', previous: '4.1%', forecast: '4.1%', actual: null, category: 'Labour', outcome: null },
  { id: 21, date: '2026-04-03', utcTime: '12:30', country: 'US', event: 'Average Hourly Earnings (MoM)', importance: 'medium', previous: '0.3%', forecast: '0.3%', actual: null, category: 'Labour', outcome: null },
  { id: 22, date: '2026-04-03', utcTime: '12:30', country: 'CA', event: 'Canada Employment Change', importance: 'medium', previous: '1.1K', forecast: '10.0K', actual: null, category: 'Labour', outcome: null },
  { id: 23, date: '2026-04-07', utcTime: '03:30', country: 'AU', event: 'RBA Interest Rate Decision', importance: 'high', previous: '4.10%', forecast: '4.10%', actual: null, category: 'Central Bank', outcome: null },
  { id: 58, date: '2026-04-07', utcTime: '04:30', country: 'AU', event: 'RBA Press Conference', importance: 'medium', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
  { id: 59, date: '2026-04-07', utcTime: '11:15', country: 'US', event: 'ADP Non-Farm Employment Change', importance: 'high', previous: '62K', forecast: '70K', actual: null, category: 'Labour', outcome: null },
  { id: 60, date: '2026-04-07', utcTime: '12:30', country: 'US', event: 'Core Durable Goods Orders (MoM)', importance: 'medium', previous: '0.0%', forecast: '0.3%', actual: null, category: 'GDP', outcome: null },
  { id: 61, date: '2026-04-07', utcTime: '12:30', country: 'US', event: 'Durable Goods Orders (MoM)', importance: 'medium', previous: '0.9%', forecast: '0.0%', actual: null, category: 'GDP', outcome: null },
  { id: 62, date: '2026-04-08', utcTime: '01:00', country: 'DE', event: 'Germany Factory Orders (MoM)', importance: 'medium', previous: '-7.0%', forecast: '0.5%', actual: null, category: 'GDP', outcome: null },
  { id: 63, date: '2026-04-08', utcTime: '06:00', country: 'DE', event: 'Germany Industrial Production (MoM)', importance: 'medium', previous: '-1.6%', forecast: '0.8%', actual: null, category: 'GDP', outcome: null },
  { id: 64, date: '2026-04-08', utcTime: '09:00', country: 'EU', event: 'Eurozone Retail Sales (MoM)', importance: 'medium', previous: '0.3%', forecast: '0.4%', actual: null, category: 'Consumer', outcome: null },
  { id: 65, date: '2026-04-08', utcTime: '12:01', country: 'US', event: 'FOMC Meeting Minutes', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
  { id: 24, date: '2026-04-09', utcTime: '11:00', country: 'UK', event: 'BOE Interest Rate Decision', importance: 'high', previous: '3.75%', forecast: '3.50%', actual: null, category: 'Central Bank', outcome: null },
  { id: 25, date: '2026-04-09', utcTime: '11:30', country: 'UK', event: 'BOE MPC Minutes & Press Conference', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
  { id: 66, date: '2026-04-09', utcTime: '12:30', country: 'US', event: 'Initial Jobless Claims', importance: 'medium', previous: '219K', forecast: '223K', actual: null, category: 'Labour', outcome: null },
  { id: 67, date: '2026-04-10', utcTime: '06:00', country: 'UK', event: 'UK GDP (MoM) — Feb', importance: 'high', previous: '0.4%', forecast: '0.1%', actual: null, category: 'GDP', outcome: null },
  { id: 26, date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US CPI (YoY)', importance: 'high', previous: '2.8%', forecast: '2.6%', actual: null, category: 'Inflation', outcome: null },
  { id: 27, date: '2026-04-10', utcTime: '12:30', country: 'US', event: 'US Core CPI (MoM)', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: null, category: 'Inflation', outcome: null },
  { id: 68, date: '2026-04-10', utcTime: '14:00', country: 'US', event: 'Michigan Consumer Sentiment Prelim', importance: 'medium', previous: '57.0', forecast: '54.0', actual: null, category: 'Consumer', outcome: null },
  { id: 30, date: '2026-04-17', utcTime: '12:15', country: 'EU', event: 'ECB Interest Rate Decision', importance: 'high', previous: '2.65%', forecast: '2.40%', actual: null, category: 'Central Bank', outcome: null },
  { id: 31, date: '2026-04-17', utcTime: '12:45', country: 'EU', event: 'ECB Press Conference — Lagarde', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
  { id: 29, date: '2026-04-29', utcTime: '18:00', country: 'US', event: 'FOMC Interest Rate Decision', importance: 'high', previous: '3.50–3.75%', forecast: '3.50–3.75%', actual: null, category: 'Central Bank', outcome: null },
  { id: 38, date: '2026-04-29', utcTime: '18:30', country: 'US', event: 'FOMC Press Conference — Powell', importance: 'high', previous: '—', forecast: '—', actual: null, category: 'Central Bank', outcome: null },
];

const CATEGORY_IMPLICATIONS = {
  'Central Bank': { instruments: ['Currency pairs (domestic)', 'Government bonds (2y, 10y)', 'Equity indices', 'Gold'], bullish: 'Hawkish surprise (rate hike or fewer cuts) → currency strengthens, yields rise, equities sell off.', bearish: 'Dovish surprise (cut or soft guidance) → currency weakens, yields fall, equities and gold rally.' },
  'Inflation': { instruments: ['Government bonds', 'Currency', 'Gold', 'Rate-sensitive equities (REITs, utilities)'], bullish: 'Hot print → central bank stays hawkish; yields and currency rise, bond prices and growth stocks fall.', bearish: 'Cool print → rate cut expectations firm; bonds rally, currency softens, gold benefits.' },
  'Labour': { instruments: ['Currency', 'Equities', 'Government bonds', 'Consumer discretionary stocks'], bullish: 'Strong jobs/low claims → growth optimism; currency and equities gain, bonds soften.', bearish: 'Weak jobs/high claims → growth fears; risk-off, bonds rally, currency weakens.' },
  'GDP': { instruments: ['Currency', 'Equity indices', 'Cyclical sectors (industrials, materials)', 'Government bonds'], bullish: 'Beat → growth confidence; currency and equities rally, bonds sell off.', bearish: 'Miss → recession fears; risk-off rotation into bonds and defensive equities.' },
  'PMI': { instruments: ['Currency', 'Equity indices', 'Commodity-linked currencies (AUD, CAD)', 'Industrial metals'], bullish: 'Above 50 beat → expansion signal; currency and risk assets gain.', bearish: 'Below 50 miss → contraction; risk-off, defensive assets outperform.' },
  'Consumer': { instruments: ['Currency', 'Consumer discretionary stocks', 'Retail sector ETFs', 'Equity indices'], bullish: 'Strong confidence/spending → domestic growth story; equities and currency firm.', bearish: 'Weak sentiment → spending pullback feared; defensives outperform, growth stocks fall.' },
  'Housing': { instruments: ['Homebuilder stocks', 'Mortgage REITs', 'Lumber futures', 'Rate-sensitive bonds'], bullish: 'Strong starts/permits → construction and materials rally; signals domestic economic health.', bearish: 'Weak data → housing slowdown; homebuilder stocks and mortgage REITs sell off.' },
  'Holiday': { instruments: ['All markets'], bullish: '', bearish: 'Liquidity is thin. Gaps on open are more likely. Reduce position sizing around the holiday.' },
};

function mergeEvents(primary, secondary) {
  const result = [...primary];
  const primaryKeys = new Set(primary.map(e => `${e.date}|${e.event.toLowerCase().trim()}`));
  secondary.forEach(ev => {
    const key = `${ev.date}|${ev.event.toLowerCase().trim()}`;
    if (!primaryKeys.has(key)) {
      result.push({ ...ev, id: `ff_${ev.id ?? Math.random()}` });
    }
  });
  return result;
}

function toLocalTime(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return utcTime;
  const dt = new Date(`${dateStr}T${utcTime}:00Z`);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function localTzLabel() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: tz }).formatToParts(new Date());
  return parts.find(p => p.type === 'timeZoneName')?.value || 'Local';
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

function getWeekEnd(today) {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function isReleased(dateStr, utcTime) {
  if (!utcTime || utcTime === 'All Day' || utcTime === '—') return true;
  if (dateStr < getTodayStr()) return true;
  const releaseUTC = new Date(`${dateStr}T${utcTime}:00Z`);
  return Date.now() >= releaseUTC.getTime();
}

function ActualBadge({ actual, forecast, dateStr, utcTime }) {
  if (!actual || !isReleased(dateStr, utcTime)) {
    return <span className="text-muted-foreground/30 text-xs font-mono">—</span>;
  }
  const aNum = parseFloat(actual);
  const fNum = parseFloat(forecast);
  const beat = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const miss = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;
  const isSpecial = actual === '✓' || isNaN(aNum);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded ${
      isSpecial ? 'bg-muted/50 text-foreground/80' :
      beat ? 'bg-emerald-400/15 text-emerald-400' :
      miss ? 'bg-red-400/15 text-red-400' :
      'bg-muted/50 text-foreground/80'
    }`}>
      {!isSpecial && (beat ? <TrendingUp className="w-3 h-3" /> : miss ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />)}
      {actual}
    </span>
  );
}

function ExpandedPanel({ event }) {
  const implications = CATEGORY_IMPLICATIONS[event.category] || null;
  const released = isReleased(event.date, event.utcTime);
  const defaultOutcome = `${event.event} is scheduled at ${toLocalTime(event.date, event.utcTime)} local time. ${event.forecast !== '—' ? `Market consensus is ${event.forecast} versus the prior reading of ${event.previous}.` : 'No specific consensus forecast.'} ${event.category === 'Central Bank' ? 'Any forward guidance on rates or policy will be the primary market driver.' : ''}`;

  return (
    <div className="border-t border-border/10 bg-muted/5 px-4 py-4 space-y-4">
      <div className="flex gap-2.5">
        <Activity className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">{released && event.actual ? 'Desk View' : 'Preview'}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{event.outcome || defaultOutcome}</p>
        </div>
      </div>
      {implications && (
        <>
          <div className="flex gap-2.5">
            <BarChart2 className="w-3.5 h-3.5 text-accent/80 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">Instruments to Watch</p>
              <div className="flex flex-wrap gap-1.5">
                {implications.instruments.map(inst => (
                  <span key={inst} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent/90 border border-accent/20 font-medium">{inst}</span>
                ))}
              </div>
            </div>
          </div>
          {(implications.bullish || implications.bearish) && (
            <div className="flex gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
              <div className="space-y-1.5 w-full">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Market Implications</p>
                {implications.bullish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wide w-7 leading-5">Beat</span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{implications.bullish}</p>
                  </div>
                )}
                {implications.bearish && (
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-red-400 shrink-0 uppercase tracking-wide w-7 leading-5">{event.category === 'Holiday' ? 'Note' : 'Miss'}</span>
                    <p className="text-xs text-muted-foreground/80 leading-5">{implications.bearish}</p>
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

function EventRow({ event, today }) {
  const [open, setOpen] = useState(false);
  const isToday = event.date === today;
  const isHigh = event.importance === 'high';
  const catStyle = CATEGORY_COLORS[event.category] || 'text-muted-foreground bg-muted/30';
  const localTime = toLocalTime(event.date, event.utcTime);

  return (
    <div className={`border-b border-border/20 last:border-0 ${isToday && isHigh ? 'bg-primary/[0.02]' : ''}`}>
      <button className="w-full text-left hover:bg-muted/10 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="grid items-center px-4 py-3" style={{ gridTemplateColumns: '72px 36px 14px 1fr 72px 72px 88px 24px' }}>
          {/* Time */}
          <span className={`text-xs font-mono font-semibold tabular-nums ${isToday ? 'text-primary' : 'text-muted-foreground/70'}`}>
            {localTime}
          </span>
          {/* Country */}
          <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wide">{COUNTRY_LABELS[event.country] || event.country}</span>
          {/* Impact dot */}
          <span className={`w-2 h-2 rounded-full inline-block ${isHigh ? 'bg-amber-400' : event.importance === 'medium' ? 'bg-blue-400/70' : 'bg-border'}`} />
          {/* Event + category badge */}
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <span className={`text-sm font-medium truncate ${isToday ? 'text-foreground' : 'text-foreground/80'}`}>{event.event}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 hidden sm:inline ${catStyle}`}>{event.category}</span>
          </div>
          {/* Previous */}
          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">PREV</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.previous}</p>
          </div>
          {/* Forecast */}
          <div className="text-right hidden md:block">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">FCST</p>
            <p className="text-xs font-mono text-muted-foreground/70 tabular-nums">{event.forecast}</p>
          </div>
          {/* Actual */}
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wide mb-0.5">ACTUAL</p>
            <ActualBadge actual={event.actual} forecast={event.forecast} dateStr={event.date} utcTime={event.utcTime} />
          </div>
          {/* Chevron */}
          <span className="text-muted-foreground/30 flex justify-end">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <ExpandedPanel event={event} />
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
        {/* Column headers */}
        <div className="grid items-center px-4 py-2 border-b border-border/20 bg-muted/5" style={{ gridTemplateColumns: '72px 36px 14px 1fr 72px 72px 88px 24px' }}>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">TIME ({localTzLabel()})</span>
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

function FetchStatus({ loading, fetched, error }) {
  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>Fetching live data...</span>
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />
      <span>Showing static data</span>
    </div>
  );
  if (fetched) return (
    <div className="flex items-center gap-2 text-xs text-emerald-400">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Live data fetched</span>
    </div>
  );
  return null;
}

export default function EconomicCalendar() {
  const [tab, setTab] = useState('today');
  const [impactFilter, setImpactFilter] = useState('all');
  const [today, setToday] = useState(getTodayStr);
  const [liveEvents, setLiveEvents] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveFetched, setLiveFetched] = useState(false);
  const [liveError, setLiveError] = useState(null);

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

  const fetchLive = useCallback(async (rng) => {
    setLiveLoading(true);
    setLiveError(null);
    setLiveFetched(false);
    try {
      const [resMql5, resFF] = await Promise.all([
        base44.functions.invoke('calendarToday', { source: 'mql5', range: rng }),
        base44.functions.invoke('calendarToday', { source: 'forex-factory', range: rng }),
      ]);
      const mql5 = resMql5?.data?.events || [];
      const ff = resFF?.data?.events || [];
      if (mql5.length || ff.length) {
        setLiveEvents(mergeEvents(mql5, ff));
        setLiveFetched(true);
      } else {
        setLiveError('no data');
      }
    } catch {
      setLiveError('unavailable');
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'today' || tab === 'week') {
      setLiveEvents(null);
      setLiveFetched(false);
      fetchLive(tab === 'week' ? 'week' : 'today');
    }
  }, [tab]);

  const monthEnd = useMemo(() => {
    const d = new Date(today + 'T00:00:00');
    d.setMonth(d.getMonth() + 2, 0);
    return d.toISOString().split('T')[0];
  }, [today]);

  const filtered = useMemo(() => {
    const weekEnd = getWeekEnd(today);
    let base;
    if (tab === 'today' || tab === 'week') {
      base = liveEvents ?? EVENTS.filter(e => tab === 'today' ? e.date === today : (e.date >= today && e.date <= weekEnd));
    } else {
      base = EVENTS.filter(e => {
        if (tab === 'month') return e.date >= today && e.date <= monthEnd;
        if (tab === 'previous') return e.date < today;
        return true;
      });
    }
    base = Array.isArray(base) ? base : [];
    if (impactFilter !== 'all') base = base.filter(e => e.importance === impactFilter);
    return base;
  }, [tab, today, monthEnd, liveEvents, impactFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    Object.values(map).forEach(evs => {
      evs.sort((a, b) => {
        const ta = a.utcTime === 'All Day' ? '00:00' : (a.utcTime || '00:00');
        const tb = b.utcTime === 'All Day' ? '00:00' : (b.utcTime || '00:00');
        return ta.localeCompare(tb);
      });
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return tab === 'previous' ? sorted.reverse() : sorted;
  }, [filtered, tab]);

  const todaySource = liveEvents ?? EVENTS.filter(e => e.date === today);
  const todayHighCount = todaySource.filter(e => e.importance === 'high').length;
  const todayReleasedCount = todaySource.filter(e => e.actual && isReleased(e.date ?? today, e.utcTime)).length;

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 mb-4">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Macro Events</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Economic Calendar</h1>
          <p className="text-muted-foreground">Central bank decisions, macro releases, and market-moving data.</p>
        </motion.div>

        {/* Stats row */}
        {tab === 'today' && (
          <motion.div className="flex gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
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
                <p className="text-lg font-semibold">{todayReleasedCount} <span className="text-sm font-normal text-muted-foreground">/ {todaySource.length}</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1 p-1 glass rounded-xl w-fit flex-wrap">
            {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'previous', label: 'Previous' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Fetch status */}
            {(tab === 'today' || tab === 'week') && (
              <FetchStatus loading={liveLoading} fetched={liveFetched} error={liveError} />
            )}
            {/* Impact filter */}
            <div className="flex items-center gap-1 p-1 glass rounded-lg">
              <Filter className="w-3 h-3 text-muted-foreground/50 ml-1 mr-0.5" />
              {[{ key: 'all', label: 'All' }, { key: 'high', label: 'High Impact' }].map(f => (
                <button key={f.key} onClick={() => setImpactFilter(f.key)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${impactFilter === f.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {grouped.map(([dateStr, events]) => (
            <DateGroup key={dateStr} dateStr={dateStr} events={events} today={today} />
          ))}
          {grouped.length === 0 && !liveLoading && (
            <div className="text-center py-20 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No events for this period</p>
            </div>
          )}
          {liveLoading && grouped.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 opacity-40 animate-spin" />
              <p className="text-sm">Loading calendar data...</p>
            </div>
          )}
        </motion.div>

        <p className="text-xs text-muted-foreground/30 text-center mt-8">
          Click any row to expand the desk view and market implications. Times shown in your local timezone.
        </p>
      </div>
    </div>
  );
}