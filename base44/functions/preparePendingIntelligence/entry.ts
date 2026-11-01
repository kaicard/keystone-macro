import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { getCaller, signInRequired } from '../../shared/requestSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getCaller(base44);
    if (!user) return signInRequired();
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    // New-item preparation has ten minutes to finish before the recovery job picks it up.
    const query = {
      $or: [
        { full_analysis: { $exists: false } },
        { full_analysis: null },
        { is_top_story: true, 'full_analysis.photo_checked_at': { $exists: false } },
      ],
      created_date: { $lt: new Date(Date.now() - 10 * 60000).toISOString() },
      slug: { $exists: true, $ne: '' },
    };
    const { items } = await base44.entities.IntelligenceItem.filter(query, { sort: '-published_at', limit: 12 });
    let prepared = 0;
    let failed = 0;
    for (let offset = 0; offset < items.length; offset += 4) {
      const results = await Promise.allSettled(items.slice(offset, offset + 4).map(async item => {
        const response = await base44.functions.invoke('getIntelligenceAnalysis', { slug: item.slug });
        if (!response.data?.ok) throw new Error(response.data?.error || 'Analysis preparation failed.');
      }));
      results.forEach(result => {
        if (result.status === 'fulfilled') prepared++;
        else { failed++; console.error('Background analysis preparation failed:', result.reason?.message); }
      });
    }
    return Response.json({ ok: failed === 0, prepared, failed }, { status: failed ? 500 : 200 });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}