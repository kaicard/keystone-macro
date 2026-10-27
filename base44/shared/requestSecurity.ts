// Authentication and durable per-account limits shared by paid or messaging endpoints.
export async function getCaller(base44) {
  return base44.auth.me().catch(error => {
    if ([401, 403].includes(error.status ?? error.response?.status)) return null;
    throw error;
  });
}

export function signInRequired() {
  return Response.json({ error: 'Please sign in to use this feature.' }, { status: 401 });
}

export async function limitRequests(base44, user, action, { minute = 6, day = 60 } = {}) {
  if (!user?.id) return signInRequired();
  if (user.role === 'admin') return null; // Trusted scheduled/admin operations keep their existing cadence.
  const key = `${user.id}:${action}`;
  const requests = base44.asServiceRole.entities.SecurityRequest;
  const now = Date.now();
  const minuteQuery = { key, created_date: { $gte: new Date(now - 60000).toISOString() } };
  const dayQuery = { key, created_date: { $gte: new Date(now - 86400000).toISOString() } };
  const counts = () => Promise.all([requests.count(minuteQuery), requests.count(dayQuery)]);
  const denied = () => Response.json({ error: 'Request limit reached. Please try again later.' }, { status: 429, headers: { 'Retry-After': '60' } });
  const [recent, daily] = await counts();
  if (recent >= minute || daily >= day) return denied();
  // Count again after reservation, so simultaneous requests cannot all pass a pre-flight count.
  await requests.create({ key });
  const [reservedRecent, reservedDaily] = await counts();
  if (reservedRecent > minute || reservedDaily > day) return denied();
  if (daily === 0) await requests.deleteMany({ key, created_date: { $lt: new Date(now - 86400000).toISOString() } });
  return null;
}