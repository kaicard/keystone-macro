export function cleanMarketCopy(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\[[^\]]+\]\((?:https?:\/\/)?[^)]+\)/gi, '')
    .replace(/\((?:https?:\/\/)[^)]+\)/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function truncateWords(value, limit) {
  const words = cleanMarketCopy(value).split(/\s+/).filter(Boolean);
  if (words.length <= limit) return words.join(' ');
  return `${words.slice(0, limit).join(' ')}…`;
}

export function compactSignal(value) {
  const clean = cleanMarketCopy(value);
  const firstClause = clean.split(/[,;]|\s—\s/)[0]?.trim() || clean;
  return truncateWords(firstClause, 6) || 'Not available';
}

export function getSummaryParts(summary) {
  if (summary && typeof summary === 'object') {
    const headline = truncateWords(summary.headline || summary.title || '', 18);
    const bullets = (summary.bullets || [summary.detail])
      .filter(Boolean)
      .map(item => truncateWords(item, 22))
      .filter(Boolean)
      .slice(0, 3);
    return { headline, bullets };
  }

  const clean = cleanMarketCopy(summary);
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) || [];
  return {
    headline: truncateWords(sentences[0] || clean, 18),
    bullets: sentences.slice(1, 4).map(item => truncateWords(item, 22)),
  };
}
