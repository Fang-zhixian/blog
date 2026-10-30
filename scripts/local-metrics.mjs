import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const idPattern = /^[A-Za-z0-9_-]{16,80}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class MetricsError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/** A serialized, atomic local store. Identifiers are random browser/session tokens, never IP addresses. */
export function createMetricsStore({ dataDir, getArticleSlugs }) {
  const filename = path.join(dataDir, 'metrics.json');
  let queue = Promise.resolve();
  const emptyState = () => ({ version: 1, siteVisits: 0, articleViews: {}, sessions: {}, siteLikes: {}, articleLikes: {} });
  async function readState() {
    try {
      const parsed = JSON.parse(await fs.readFile(filename, 'utf8'));
      if (parsed?.version !== 1 || typeof parsed.siteVisits !== 'number' || !parsed.sessions || !parsed.articleViews || !parsed.siteLikes || !parsed.articleLikes) throw new Error('Invalid metrics data');
      return parsed;
    } catch (error) {
      if (error?.code === 'ENOENT') return emptyState();
      throw error;
    }
  }
  async function writeState(state) {
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
    const temporary = path.join(dataDir, `.metrics-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
      await fs.rename(temporary, filename);
    } finally {
      await fs.rm(temporary, { force: true }).catch(() => {});
    }
  }
  function snapshot(state, visitorId, slug) {
    return {
      site: { visits: state.siteVisits, likes: Object.keys(state.siteLikes).length, liked: Boolean(state.siteLikes[visitorId]) },
      article: slug ? { views: state.articleViews[slug] || 0, likes: Object.keys(state.articleLikes[slug] || {}).length, liked: Boolean(state.articleLikes[slug]?.[visitorId]) } : null,
    };
  }
  async function handle(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new MetricsError('Invalid request');
    const { action, visitorId, sessionId, slug = null, kind, liked } = payload;
    if (typeof visitorId !== 'string' || !idPattern.test(visitorId)) throw new MetricsError('Invalid visitor');
    if (slug !== null && (typeof slug !== 'string' || !slugPattern.test(slug) || !getArticleSlugs().includes(slug))) throw new MetricsError('Unknown article');
    if (!['visit', 'snapshot', 'set-like'].includes(action)) throw new MetricsError('Invalid action');
    if (action === 'visit' && (typeof sessionId !== 'string' || !idPattern.test(sessionId))) throw new MetricsError('Invalid session');
    if (action === 'set-like' && (!['site', 'article'].includes(kind) || typeof liked !== 'boolean' || (kind === 'article' && !slug))) throw new MetricsError('Invalid like');
    const state = await readState();
    let changed = false;
    if (action === 'visit') {
      if (!Object.hasOwn(state.sessions, sessionId)) { state.sessions[sessionId] = []; state.siteVisits++; changed = true; }
      if (slug && !state.sessions[sessionId].includes(slug)) { state.sessions[sessionId].push(slug); state.articleViews[slug] = (state.articleViews[slug] || 0) + 1; changed = true; }
    }
    if (action === 'set-like') {
      const target = kind === 'site' ? state.siteLikes : (state.articleLikes[slug] ??= {});
      if (liked && !target[visitorId]) { target[visitorId] = true; changed = true; }
      if (!liked && target[visitorId]) { delete target[visitorId]; changed = true; }
    }
    if (changed) await writeState(state);
    return snapshot(state, visitorId, slug);
  }
  return {
    execute(payload) {
      const result = queue.then(() => handle(payload));
      queue = result.catch(() => {});
      return result;
    },
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => { if (!tooLarge) body += chunk; if (body.length > 8192) tooLarge = true; });
    req.on('end', () => {
      if (tooLarge) return reject(new MetricsError('Request too large', 413));
      try { resolve(JSON.parse(body)); } catch { reject(new MetricsError('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

/**
 * Dev/preview middleware, intentionally limited to a loopback-only server.
 * @param {{dataDir: string, getArticleSlugs: () => string[]}} options
 * @returns {import('vite').Plugin}
 */
export function localMetricsPlugin({ dataDir, getArticleSlugs }) {
  const store = createMetricsStore({ dataDir, getArticleSlugs });
  const middleware = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const remote = req.socket.remoteAddress || '';
    const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
    let sameOrigin = true;
    let localHost = false;
    try {
      localHost = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(`http://${req.headers.host}`).hostname);
      if (req.headers.origin) sameOrigin = new URL(req.headers.origin).host === req.headers.host;
    } catch { sameOrigin = false; }
    if (!loopback || !sameOrigin || !localHost) { res.statusCode = 403; return res.end(JSON.stringify({ error: 'Local preview only' })); }
    if (req.method !== 'POST' || !String(req.headers['content-type'] || '').startsWith('application/json')) { res.statusCode = 405; return res.end(JSON.stringify({ error: 'Method not allowed' })); }
    try {
      const result = await store.execute(await readBody(req));
      res.statusCode = 200; res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = error instanceof MetricsError ? error.status : 500;
      res.end(JSON.stringify({ error: error instanceof MetricsError ? error.message : 'Unable to save local metrics' }));
    }
  };
  return {
    name: 'local-preview-metrics',
    apply: 'serve',
    configureServer(server) { server.middlewares.use('/api/preview-metrics', middleware); },
    configurePreviewServer(server) { server.middlewares.use('/api/preview-metrics', middleware); },
  };
}
