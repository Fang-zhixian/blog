import { createHmac } from 'node:crypto';
import articleSlugs from '../src/generated/metrics-article-slugs.mjs';

const validArticles = new Set(articleSlugs);
const idPattern = /^[A-Za-z0-9_-]{16,80}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// One Redis script makes session deduplication and likes atomic across Vercel instances.
const transaction = `
local rate = redis.call('INCR', KEYS[7])
if rate == 1 then redis.call('EXPIRE', KEYS[7], 60) end
if rate > 120 then return {-1} end
local action = ARGV[1]
local visitor = ARGV[2]
local hasArticle = ARGV[3] == '1'
if action == 'visit' then
  if redis.call('SET', KEYS[3], '1', 'NX', 'EX', 86400) then redis.call('INCR', KEYS[1]) end
  if hasArticle and redis.call('SET', KEYS[6], '1', 'NX', 'EX', 86400) then redis.call('INCR', KEYS[4]) end
elseif action == 'set-like' then
  local target = KEYS[2]
  if ARGV[4] == 'article' then target = KEYS[5] end
  if ARGV[5] == '1' then redis.call('SADD', target, visitor) else redis.call('SREM', target, visitor) end
end
local result = {tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('SCARD', KEYS[2]), redis.call('SISMEMBER', KEYS[2], visitor)}
if hasArticle then
  table.insert(result, tonumber(redis.call('GET', KEYS[4]) or '0'))
  table.insert(result, redis.call('SCARD', KEYS[5]))
  table.insert(result, redis.call('SISMEMBER', KEYS[5], visitor))
end
return result
`;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function handleMetrics(request, { env = process.env, fetcher = fetch } = {}) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json(415, { error: 'JSON required' });
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json(403, { error: 'Origin not allowed' });
  } catch { return json(403, { error: 'Origin not allowed' }); }
  if (Number(request.headers.get('content-length') || 0) > 2048) return json(413, { error: 'Request too large' });
  let payload;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > 2048) return json(413, { error: 'Request too large' });
    payload = JSON.parse(body);
  } catch { return json(400, { error: 'Invalid JSON' }); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json(400, { error: 'Invalid request' });
  const { action, visitorId, sessionId, slug = null, kind, liked } = payload;
  if (!['visit', 'snapshot', 'set-like'].includes(action) || typeof visitorId !== 'string' || !idPattern.test(visitorId)) return json(400, { error: 'Invalid request' });
  if (slug !== null && (typeof slug !== 'string' || !slugPattern.test(slug) || !validArticles.has(slug))) return json(400, { error: 'Unknown article' });
  if (action === 'visit' && (typeof sessionId !== 'string' || !idPattern.test(sessionId))) return json(400, { error: 'Invalid session' });
  if (action === 'set-like' && (!['site', 'article'].includes(kind) || typeof liked !== 'boolean' || (kind === 'article' && !slug))) return json(400, { error: 'Invalid like' });
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return json(503, { error: 'Statistics unavailable' });
  // Preview deployments share the database but never write production counts.
  const prefix = env.VERCEL_ENV === 'preview' ? 'blog:metrics:preview:v1:' : 'blog:metrics:v1:';
  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  // The database only receives an opaque, short-lived rate-limit key, never the IP itself.
  const rateId = createHmac('sha256', token).update(ip).digest('hex').slice(0, 32);
  const article = slug || '_none';
  const session = action === 'visit' ? sessionId : '_none';
  const keys = [
    `${prefix}site:visits`, `${prefix}site:likes`, `${prefix}site:session:${session}`,
    `${prefix}article:${article}:views`, `${prefix}article:${article}:likes`, `${prefix}article:${article}:session:${session}`,
    `${prefix}rate:${rateId}`,
  ];
  try {
    const response = await fetcher(url.replace(/\/+$/, ''), {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', transaction, keys.length, ...keys, action, visitorId, slug ? '1' : '0', kind || '', liked ? '1' : '0']),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Storage request failed');
    const data = await response.json();
    if (data?.result?.[0] === -1) return json(429, { error: 'Too many requests' });
    const values = data?.result;
    if (!Array.isArray(values) || values.length !== (slug ? 6 : 3) || values.some((value) => !Number.isSafeInteger(value) || value < 0)) throw new Error('Invalid storage response');
    return json(200, {
      site: { visits: values[0], likes: values[1], liked: values[2] === 1 },
      article: slug ? { views: values[3], likes: values[4], liked: values[5] === 1 } : null,
    });
  } catch { return json(503, { error: 'Statistics unavailable' }); }
}

export default { fetch: handleMetrics };
