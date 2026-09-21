import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resolvePremiumAccess } from '../../shared/newsletterAccess.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const access = await resolvePremiumAccess(base44);
    if (!access.active) {
      return Response.json({ active: false, error: 'Full edition bodies are available only after a paid subscription is verified.' }, { status: 403 });
    }

    // Single edition (full body) — used by the edition reader page.
    if (body.slug) {
      const matches = await base44.asServiceRole.entities.NewsletterEdition.filter({ slug: body.slug, status: 'published' });
      const edition = matches?.[0];
      if (!edition) return Response.json({ active: true, error: 'Edition not found.' }, { status: 404 });
      return Response.json({ active: true, edition });
    }

    // Archive listing — bodies omitted to keep the payload light.
    const editions = await base44.asServiceRole.entities.NewsletterEdition.filter({ status: 'published' }, '-publish_date', 100);
    return Response.json({
      active: true,
      editions: (editions || []).map(({ body, ...rest }) => rest),
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to load the archive.' }, { status: 500 });
  }
});