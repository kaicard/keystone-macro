import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Scheduled function that pre-warms all market caches so users get instant loads
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Invalidate liveQuotes cache to force refresh on next user visit
    // (or call the functions directly to warm them)
    const [quotesRes, contextRes, newsRes] = await Promise.all([
      base44.asServiceRole.functions.invoke('liveQuotes', {}),
      base44.asServiceRole.functions.invoke('liveMarketContext', {}),
      base44.asServiceRole.functions.invoke('liveNews', {}),
    ]);

    return Response.json({
      ok: true,
      quotes: quotesRes?.ok,
      context: contextRes?.ok,
      news: newsRes?.ok,
      ts: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});