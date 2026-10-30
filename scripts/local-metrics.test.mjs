// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createMetricsStore, localMetricsPlugin } from './local-metrics.mjs';

const dirs = [];
const visitorA = 'visitor_aaaaaaaaaaaaaaaa';
const visitorB = 'visitor_bbbbbbbbbbbbbbbb';
const sessionA = 'session_aaaaaaaaaaaaaaaa';
const sessionB = 'session_bbbbbbbbbbbbbbbb';
async function createStore() {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'rumo-metrics-test-'));
  dirs.push(dataDir);
  return { dataDir, store: createMetricsStore({ dataDir, getArticleSlugs: () => ['first-post', 'second-post'] }) };
}
afterEach(async () => { await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe('local metrics', () => {
  it('counts each session once per site and once per article, including after restart', async () => {
    const { dataDir, store } = await createStore();
    const visit = { action: 'visit', visitorId: visitorA, sessionId: sessionA, slug: 'first-post' };
    await Promise.all([store.execute(visit), store.execute(visit), store.execute(visit)]);
    await store.execute({ ...visit, slug: 'second-post' });
    await store.execute({ ...visit, visitorId: visitorB, sessionId: sessionB });
    const restarted = createMetricsStore({ dataDir, getArticleSlugs: () => ['first-post', 'second-post'] });
    const result = await restarted.execute({ action: 'snapshot', visitorId: visitorA, slug: 'first-post' });
    expect(result.site.visits).toBe(2);
    expect(result.article.views).toBe(2);
    const other = await restarted.execute({ action: 'snapshot', visitorId: visitorA, slug: 'second-post' });
    expect(other.article.views).toBe(1);
    expect(JSON.parse(await readFile(path.join(dataDir, 'metrics.json'), 'utf8')).siteVisits).toBe(2);
  });
  it('shares counts across visitors and keeps site and article likes independent', async () => {
    const { store } = await createStore();
    const like = { action: 'set-like', visitorId: visitorA, slug: 'first-post', kind: 'site', liked: true };
    await Promise.all([store.execute(like), store.execute(like)]);
    await store.execute({ ...like, visitorId: visitorB });
    await store.execute({ ...like, kind: 'article' });
    let result = await store.execute({ action: 'snapshot', visitorId: visitorA, slug: 'first-post' });
    expect(result.site).toMatchObject({ likes: 2, liked: true });
    expect(result.article).toMatchObject({ likes: 1, liked: true });
    await store.execute({ ...like, liked: false });
    result = await store.execute({ action: 'snapshot', visitorId: visitorA, slug: 'first-post' });
    expect(result.site).toMatchObject({ likes: 1, liked: false });
    expect(result.article).toMatchObject({ likes: 1, liked: true });
  });
  it('rejects unknown articles and invalid identities without creating fake counts', async () => {
    const { store } = await createStore();
    await expect(store.execute({ action: 'visit', visitorId: visitorA, sessionId: sessionA, slug: '../secret' })).rejects.toThrow('Unknown article');
    await expect(store.execute({ action: 'visit', visitorId: 'bad', sessionId: sessionA })).rejects.toThrow('Invalid visitor');
    const result = await store.execute({ action: 'snapshot', visitorId: visitorA });
    expect(result.site.visits).toBe(0);
  });
  it('accepts loopback same-origin requests and rejects cross-origin requests', async () => {
    const { dataDir } = await createStore();
    const plugin = localMetricsPlugin({ dataDir, getArticleSlugs: () => ['first-post'] });
    let handler;
    plugin.configureServer({ middlewares: { use(route, callback) { expect(route).toBe('/api/preview-metrics'); handler = callback; } } });
    const send = async (origin) => {
      const req = Readable.from([JSON.stringify({ action: 'visit', visitorId: visitorA, sessionId: sessionA, slug: 'first-post' })]);
      req.method = 'POST'; req.headers = { host: '127.0.0.1:4329', origin, 'content-type': 'application/json' }; req.socket = { remoteAddress: '127.0.0.1' };
      const res = { statusCode: 0, body: '', setHeader() {}, end(value) { this.body = value; } };
      await handler(req, res);
      return res;
    };
    const allowed = await send('http://127.0.0.1:4329');
    expect(allowed.statusCode).toBe(200);
    expect(JSON.parse(allowed.body).site.visits).toBe(1);
    expect((await send('https://unrelated.example')).statusCode).toBe(403);
  });
});
