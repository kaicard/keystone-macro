import { findPhotos } from './newsletterPhotography.ts';

const SUBJECTS = [
  [/\b(Hormuz)\b/i, 'Strait of Hormuz', 'Strait of Hormuz'],
  [/\bOPEC\b/i, 'OPEC', 'OPEC headquarters'],
  [/\b(Bank of England|BoE)\b/i, 'Bank of England', 'Bank of England Threadneedle Street building'],
  [/\b(European Central Bank|ECB)\b/i, 'European Central Bank', 'European Central Bank Frankfurt building'],
  [/\b(Federal Reserve|FOMC|Fed)\b/i, 'Federal Reserve', 'Federal Reserve Eccles building'],
  [/\bBank of Japan\b/i, 'Bank of Japan', 'Bank of Japan Tokyo building'],
  [/\b(People.s Bank of China|PBOC)\b/i, 'People Bank China', 'People Bank China headquarters Beijing'],
  [/\b(oil refinery|crude oil|oil supply)\b/i, 'oil refinery', 'oil refinery petroleum'],
  [/\b(liquefied natural gas|LNG)\b/i, 'LNG', 'LNG terminal'],
  [/\bNvidia\b/i, 'Nvidia', 'Nvidia headquarters building'],
  [/\b(TSMC|Taiwan Semiconductor)\b/i, 'TSMC', 'TSMC factory building'],
  [/\b(Boeing)\b/i, 'Boeing', 'Boeing factory aircraft'],
  [/\b(UK budget|British budget|Rachel Reeves|HM Treasury)\b/i, 'HM Treasury', 'HM Treasury London building'],
  [/\b(French budget|French fiscal|France.*budget)\b/i, 'Palais Bourbon', 'Palais Bourbon National Assembly Paris'],
];

export async function selectIntelligencePhoto(item) {
  if (!item.is_top_story) return null;
  const text = `${item.headline || ''} ${item.impact || ''}`;
  const subject = SUBJECTS.find(([pattern]) => pattern.test(item.headline || ''))
    || SUBJECTS.find(([pattern]) => pattern.test(item.impact || ''));
  if (!subject) return null;
  const [, name, query] = subject;
  const photos = await findPhotos({ headline: `${text} ${name}`, image_subject: name, image_query: query }, new Set());
  for (const photo of photos.slice(0, 2)) {
    const available = await fetch(photo.url, { method: 'HEAD', signal: AbortSignal.timeout(7000) }).catch(() => null);
    if (available?.ok && available.headers.get('content-type')?.startsWith('image/')) return photo;
  }
  return null;
}

export async function withIntelligencePhoto(item, analysis) {
  if (!item.is_top_story || analysis.photo_checked_at) return analysis;
  const photo = await selectIntelligencePhoto(item).catch(error => {
    console.warn('Optional intelligence photograph unavailable:', error.message);
    return null;
  });
  return { ...analysis, photo, photo_checked_at: new Date().toISOString() };
}