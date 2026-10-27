// Real, licensed photographs selected by the section's concrete subject, not its asset-class label.
const API = 'https://commons.wikimedia.org/w/api.php';
const HISTORY_KEY = 'newsletter-photo-history';
const HEADERS = { 'User-Agent': 'KeystoneMacro/1.0 (newsletter photography)' };

function plain(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|quot|#39);/g, ' ').replace(/\s+/g, ' ').trim();
}
function escape(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function trustedUrl(value, hosts) {
  if (!value) return null;
  const url = new URL(value);
  return url.protocol === 'https:' && hosts.includes(url.hostname) ? url.href : null;
}
function words(value) {
  return plain(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1 && !['the', 'of', 'and', 'in', 'at'].includes(w));
}

async function findPhotos(section, excluded) {
  const query = words(section.image_query).join(' ').slice(0, 120);
  const subject = words(section.image_subject);
  if (!query || !subject.length) return [];
  // Require the named subject to actually occur in this section, not just in an AI image suggestion.
  const story = words(`${section.headline || ''} ${section.body || ''}`);
  if (!subject.every(word => story.includes(word))) return [];
  const params = new URLSearchParams({ action: 'query', format: 'json', generator: 'search',
    gsrsearch: `${query} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '20',
    prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1000' });
  const response = await fetch(`${API}?${params}`, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!response.ok) return [];
  const result = await response.json();
  return Object.values(result.query?.pages || {}).sort((a, b) => a.index - b.index).flatMap(page => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    const title = plain(meta.ObjectName?.value || page.title.replace(/^File:/, ''));
    const description = plain(meta.ImageDescription?.value);
    const searchable = words(`${title} ${description}`);
    const license = plain(meta.LicenseShortName?.value);
    const author = plain(meta.Artist?.value);
    if (!info || excluded.has(page.title) || info.mime !== 'image/jpeg' || info.width < 800 || info.width / info.height < 1.15 || info.width / info.height > 2.6) return [];
    if (!/^(CC BY(?:-SA)? [1-4]\.0|CC0(?: 1\.0)?|Public domain)$/i.test(license) || !author || plain(meta.Restrictions?.value)) return [];
    if (!subject.every(word => searchable.includes(word))) return [];
    if (/\b(cartoon|diagram|illustration|rendering|rendered|model houses|logo|montage|collage|map|banknote|generated|artificial intelligence generated)\b/i.test(`${title} ${description}`)) return [];
    const url = trustedUrl(info.thumburl, ['upload.wikimedia.org', 'thumb.wikimedia.org']);
    const sourceUrl = trustedUrl(info.descriptionurl, ['commons.wikimedia.org']);
    const licenseUrl = trustedUrl(meta.LicenseUrl?.value, ['creativecommons.org']);
    if (!url || !sourceUrl) return [];
    const date = plain(meta.DateTimeOriginal?.value);
    return [{ id: page.title, url, sourceUrl, licenseUrl, title, author, license, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '' }];
  });
}

export async function selectNewsletterPhoto(base44, sections, { remember = true } = {}) {
  const records = await base44.asServiceRole.entities.MarketCache.filter({ key: HISTORY_KEY });
  const record = records[0];
  const history = record?.payload ? JSON.parse(record.payload) : [];
  const excluded = new Set(history.map(item => item.id));
  const proposals = sections.map((section, index) => ({ section, index })).filter(p => p.section.image_query && p.section.image_subject).slice(0, 2);
  // At most two subject searches per edition. A missing suitable photo never blocks the newsletter.
  const searches = await Promise.allSettled(proposals.map(p => findPhotos(p.section, excluded)));
  for (let i = 0; i < searches.length; i++) {
    if (searches[i].status !== 'fulfilled') continue;
    for (const photo of searches[i].value.slice(0, 3)) {
      const available = await fetch(photo.url, { method: 'HEAD', headers: HEADERS, signal: AbortSignal.timeout(7000) }).catch(() => null);
      if (!available?.ok || !available.headers.get('content-type')?.startsWith('image/')) continue;
      if (remember) {
        const entry = { key: HISTORY_KEY, payload: JSON.stringify([...history, { id: photo.id, used_at: new Date().toISOString() }].slice(-60)), fetched_at: new Date().toISOString() };
        if (record) await base44.asServiceRole.entities.MarketCache.update(record.id, entry);
        else await base44.asServiceRole.entities.MarketCache.create(entry);
      }
      return { ...photo, sectionIndex: proposals[i].index };
    }
  }
  return null;
}

export function newsletterPhotoHtml(photo) {
  if (!photo) return '';
  const source = `<a href="${escape(photo.sourceUrl)}" style="color:#64748b;text-decoration:underline;">Wikimedia Commons</a>`;
  const license = photo.licenseUrl ? `<a href="${escape(photo.licenseUrl)}" style="color:#64748b;text-decoration:underline;">${escape(photo.license)}</a>` : escape(photo.license);
  return `<tr><td style="padding:0 0 16px 0;"><div style="border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#ffffff;">
    <img src="${escape(photo.url)}" alt="${escape(photo.title)}" width="560" style="display:block;width:100%;max-width:100%;height:auto;border:none;" />
    <div style="background:#f8fafc;padding:12px 20px;font-size:10px;color:#64748b;line-height:1.7;">${escape(photo.title)}<br/>Illustrative archive photograph${photo.date ? `, ${escape(photo.date)}` : ''}. Photo: ${escape(photo.author)}. ${license}. ${source}.</div>
  </div></td></tr>`;
}