import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resolvePremiumAccess } from '../../shared/newsletterAccess.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user, ...access } = await resolvePremiumAccess(base44);
    return Response.json(access);
  } catch (error) {
    console.error('Access verification failed:', error);
    return Response.json({ error: 'Unable to verify access.' }, { status: 500 });
  }
});