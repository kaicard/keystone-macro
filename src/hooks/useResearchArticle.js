import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const slugFor = title => title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || '';

export default function useResearchArticle(slug) {
  const article = useQuery({
    queryKey: ['research-article', slug],
    queryFn: async () => {
      const page = await base44.entities.ResearchNote.filter({ slug }, { limit: 1 });
      if (page.items[0]) return page.items[0];
      // Preserve old title-based links for notes saved without an explicit slug.
      let cursor;
      do {
        const legacy = await base44.entities.ResearchNote.filter({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] }, { limit: 50, cursor });
        const match = legacy.items.find(note => slugFor(note.title) === slug);
        if (match) return match;
        cursor = legacy.has_more ? legacy.next_cursor : null;
      } while (cursor);
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
  const related = useQuery({
    queryKey: ['related-research', article.data?.id],
    enabled: !!article.data,
    queryFn: async () => (await base44.entities.ResearchNote.filter({ category: article.data.category, id: { $ne: article.data.id }, status: 'published' }, { sort: '-publish_date', limit: 3 })).items,
    staleTime: 5 * 60 * 1000,
  });
  return { ...article, related: related.data || [] };
}