// LLM / web-search output is untrusted: a `javascript:` or `data:` URL rendered
// into an href executes in the app's origin. Every URL that comes back from an
// LLM call must pass through here before it is cached, returned, or rendered.

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function sanitizeArticles(articles: unknown): any[] {
  if (!Array.isArray(articles)) return [];
  return articles.map((a) => ({ ...a, url: safeHttpUrl(a?.url) || '' }));
}

export function sanitizeCreditSpreads(spreads: unknown): any[] {
  if (!Array.isArray(spreads)) return [];
  return spreads.map((s) => ({ ...s, source_url: safeHttpUrl(s?.source_url) || null }));
}