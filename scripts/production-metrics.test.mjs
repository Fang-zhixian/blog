// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { handleMetrics } from '../api/preview-metrics.js';

const env = { UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'secret-test-token' };
const visitorId = 'visitor_1234567890123456';
const sessionId = 'session_1234567890123456';
const slug = 'live-capture';
const makeRequest = (payload, headers = {}) => new Request('https://www.greedywolf.tech/api/preview-metrics', {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://www.greedywolf.tech', 'x-vercel-forwarded-for': '192.0.2.1', ...headers }, body: JSON.stringify(payload),
});
const storeResponse = (result) => new Response(JSON.stringify({ result }), { status: 200 });

describe('shared statistics endpoint', () => {
  it('records an article visit atomically and returns the shared snapshot', async () => {
    const fetcher = vi.fn().mockResolvedValue(storeResponse([4, 2, 1, 3, 1, 0]));
    const response = await handleMetrics(makeRequest({ action: 'visit', visitorId, sessionId, slug }), { env, fetcher });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ site: { visits: 4, likes: 2, liked: true }, article: { views: 3, likes: 1, liked: false } });
    const [target, options] = fetcher.mock.calls[0];
    expect(target).toBe('https://redis.example');
    const command = JSON.parse(options.body);
    expect(command[0]).toBe('EVAL');
    expect(command[1]).toContain("'NX', 'EX', 86400");
    expect(command[1]).toContain("redis.call('SADD', target, visitor)");
    expect(command[2]).toBe(7);
    expect(command.slice(3, 10).join(' ')).not.toContain('192.0.2.1');
    expect(command.slice(-5)).toEqual(['visit', visitorId, '1', '', '0']);
  });
  it('only accepts known published articles and rejects cross-origin writes', async () => {
    const fetcher = vi.fn();
    expect((await handleMetrics(makeRequest({ action: 'visit', visitorId, sessionId, slug: 'astro-performance' }), { env, fetcher })).status).toBe(400);
    expect((await handleMetrics(makeRequest({ action: 'set-like', visitorId, kind: 'article', liked: true }), { env, fetcher })).status).toBe(400);
    expect((await handleMetrics(makeRequest({ action: 'visit', visitorId, sessionId, slug }, { origin: 'https://other.example' }), { env, fetcher })).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('handles site likes, rate limits and missing or failed storage without exposing secrets', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(storeResponse([5, 1, 1])).mockResolvedValueOnce(storeResponse([-1])).mockRejectedValueOnce(new Error('secret-test-token'));
    const request = () => makeRequest({ action: 'set-like', visitorId, kind: 'site', liked: true });
    expect(await (await handleMetrics(request(), { env, fetcher })).json()).toEqual({ site: { visits: 5, likes: 1, liked: true }, article: null });
    expect((await handleMetrics(request(), { env, fetcher })).status).toBe(429);
    const failed = await handleMetrics(request(), { env, fetcher });
    expect(failed.status).toBe(503);
    expect(await failed.text()).not.toContain('secret-test-token');
    expect((await handleMetrics(request(), { env: {}, fetcher })).status).toBe(503);
  });
  it('rejects oversized and malformed input', async () => {
    const fetcher = vi.fn();
    expect((await handleMetrics(makeRequest({ action: 'visit', visitorId, sessionId, extra: 'x'.repeat(2048) }), { env, fetcher })).status).toBe(413);
    expect((await handleMetrics(makeRequest({ action: 'visit', visitorId: 'bad', sessionId }), { env, fetcher })).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
