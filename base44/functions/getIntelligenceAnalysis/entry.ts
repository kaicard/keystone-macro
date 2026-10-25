import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { HOUSE_STYLE } from '../../shared/writingStyle.ts';

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    executive_summary: { type: 'string' },
    what_happened: { type: 'string' },
    why_it_matters: { type: 'string' },
    market_implications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          asset_class: { type: 'string' },
          read: { type: 'string' },
        },
      },
    },
    scenarios: {
      type: 'object',
      properties: {
        base_case: { type: 'string' },
        upside: { type: 'string' },
        downside: { type: 'string' },
      },
    },
    what_to_watch: { type: 'array', items: { type: 'string' } },
    risks_to_view: { type: 'string' },
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
    if (!slug) {
      return Response.json({ ok: false, error: 'slug is required' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.IntelligenceItem.filter({ slug });
    const item = Array.isArray(matches) ? matches[0] : matches?.items?.[0];
    if (!item) {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    if (item.full_analysis) {
      return Response.json({ ok: true, cached: true, analysis: item.full_analysis });
    }

    const publishedAt = item.source_published_at || item.published_at;
    const publishedLabel = publishedAt
      ? new Date(publishedAt).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short' })
      : item.published_date || 'recent';
    const todayLabel = new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full' });

    const prompt = `You are the chief cross-asset strategist at Keystone Macro, an institutional macro research desk. Write a full research briefing on the development below, in the style of a sell-side cross-asset note read by portfolio managers.

THE DEVELOPMENT
Headline: ${item.headline}
Coverage area: ${item.category}
Desk sentiment: ${item.sentiment || 'neutral'}
First reported: ${publishedLabel}
Primary source: ${item.source_name || 'not recorded'}${item.source_url ? ` (${item.source_url})` : ''}
Quick desk read already published: ${item.impact || 'none'} ${item.desk_view || ''}
Instruments already flagged: ${item.what_to_watch || 'none'}

Today is ${todayLabel}.

Ground the briefing in the confirmed facts of this development and its cited source. You may use web search to confirm context and to check how markets have actually reacted, but NEVER invent figures, quotes, price levels or dates. If a detail cannot be confirmed, say so plainly rather than guessing. If the quick desk read above is thin, expand on it rather than contradicting it.

Return exactly these fields:
- executive_summary: 3 to 4 sentences. What happened, why it matters, and the cross-asset read. This is the opening paragraph a portfolio manager reads first.
- what_happened: 2 to 3 paragraphs of confirmed facts. What was announced or released, the numbers that matter, how they compared with expectations, and the immediate market reaction. Attribute claims to the named source.
- why_it_matters: 2 to 3 paragraphs on structural significance. Place it in the context of the prevailing macro regime, the policy path and market positioning, and explain the transmission mechanism into asset prices.
- market_implications: 3 to 5 entries. Each is one asset class (for example Rates, FX, Equities, Credit, Commodities) with a 1 to 2 sentence read on the implication for that market.
- scenarios: three fields, base_case, upside and downside. Each 2 to 3 sentences describing how the situation could plausibly develop over the next one to three months and what it would mean for markets.
- what_to_watch: 4 to 6 specific instruments, data releases or events to monitor next.
- risks_to_view: 1 paragraph on what would invalidate this read.

EDITORIAL RULES
- British English. Sharp, analytical, no filler, no marketing language.
${HOUSE_STYLE}
- No price targets, no buy or sell recommendations, no position sizing, no personalised advice. Describe implications and scenarios, never instruct the reader.
- Do not address the reader directly as an investor and never imply the reader should act.
- Do not fabricate data, quotes or sources.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: ANALYSIS_SCHEMA,
    });

    await base44.asServiceRole.entities.IntelligenceItem.update(item.id, {
      full_analysis: analysis,
      full_analysis_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, cached: false, analysis });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}