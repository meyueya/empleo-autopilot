import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';

const source = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
function harness(token = 'test-only-token-012345678901234567890123') {
  const routes = new Map(), middleware = [];
  let binding;
  const db = { jobs: [], profile: {}, settings: { geminiApiKey: 'fake-private-key', smtpPass: 'fake-password', smtpHost: 'localhost', smtpPort: 587 } };
  const app = {
    disable() {},
    use(...args) { if (args[0] === '/api') middleware.push(args[1]); },
    listen(port, host) { binding = { port, host }; }
  };
  for (const method of ['get', 'post', 'put', 'delete']) {
    app[method] = (route, fn) => routes.set(method + ' ' + route, fn);
  }
  const express = () => app;
  express.json = () => () => {};
  const context = {
    express, cors: () => () => {}, dotenv: { config() {} }, path,
    fs: { existsSync: () => false }, fileURLToPath: () => '/test/server/index.js',
    process: { env: { AUTOPILOT_API_TOKEN: token } }, Buffer, timingSafeEqual,
    setInterval: () => ({ unref() {} }), console: { log() {}, error() {} },
    readDb: () => db, writeDb: () => true
  };
  vm.runInNewContext(source.replace(/^import .*;\s*$/gm, '').replaceAll('import.meta.url', "'file:///test/server/index.js'"), context);
  return { routes, middleware, db, binding };
}
function response() {
  return { statusCode: 200, headers: {}, payload: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.payload = data; return this; },
    setHeader(k, v) { this.headers[k] = v; }
  };
}
function request(headers = {}, body = {}) {
  return { body, socket: { remoteAddress: '127.0.0.1' }, get: name => headers[name] };
}
test('refuses startup without a strong token', () => {
  assert.throws(() => harness(''), /AUTOPILOT_API_TOKEN/);
  assert.throws(() => harness('short'), /AUTOPILOT_API_TOKEN/);
});
test('binds exclusively to loopback', () => assert.equal(harness().binding.host, '127.0.0.1'));
test('rejects unauthenticated requests', () => {
  const h = harness(), res = response();
  h.middleware[0](request(), res, () => assert.fail('must not authenticate'));
  assert.equal(res.statusCode, 401);
});
test('rejects incorrect token of equal length', () => {
  const h = harness(), res = response();
  h.middleware[0](request({ authorization: 'Bearer ' + 'x'.repeat(39) }), res, () => assert.fail());
  assert.equal(res.statusCode, 401);
});
test('accepts valid bearer token and disables response caching', () => {
  const h = harness(), res = response(); let passed = false;
  h.middleware[0](request({ authorization: 'Bearer test-only-token-012345678901234567890123' }), res, () => { passed = true; });
  assert.equal(passed, true); assert.equal(res.headers['Cache-Control'], 'no-store');
});
test('rejects foreign browser origins even with a valid token', () => {
  const h = harness(), res = response();
  h.middleware[0](request({ origin: 'https://untrusted.example', authorization: 'Bearer test-only-token-012345678901234567890123' }), res, () => assert.fail());
  assert.equal(res.statusCode, 403);
});
test('rate limiter rejects request 121', () => {
  const h = harness(); let final;
  for (let i = 0; i < 121; i++) { final = response(); h.middleware[1](request(), final, () => {}); }
  assert.equal(final.statusCode, 429);
});
test('settings responses never disclose configured secrets', () => {
  const h = harness(), res = response();
  h.routes.get('get /api/settings')(request(), res);
  assert.equal(res.payload.geminiApiKey, ''); assert.equal(res.payload.smtpPass, '');
  assert.equal(h.db.settings.geminiApiKey, 'fake-private-key');
});
test('blank form fields preserve existing secrets', () => {
  const h = harness(), res = response();
  h.routes.get('post /api/settings')(request({}, { geminiApiKey: '', smtpPass: '' }), res);
  assert.equal(h.db.settings.geminiApiKey, 'fake-private-key');
  assert.equal(res.payload.smtpPass, '');
});
test('rejects multiline dotenv injection without modifying settings', () => {
  const h = harness(), res = response();
  h.routes.get('post /api/settings')(request({}, { smtpHost: 'mail.example\nAUTOPILOT_API_TOKEN=attacker' }), res);
  assert.equal(res.statusCode, 400); assert.equal(h.db.settings.smtpHost, 'localhost');
});
test('rejects non-object settings', () => {
  const h = harness(), res = response();
  h.routes.get('post /api/settings')(request({}, []), res);
  assert.equal(res.statusCode, 400);
});
test('ignores settings keys outside the allowlist', () => {
  const h = harness(), res = response();
  h.routes.get('post /api/settings')(request({}, { unrecognized: 'value' }), res);
  assert.equal(Object.hasOwn(h.db.settings, 'unrecognized'), false);
});
