import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureOutput, listSessions, sendInput, startSession, stopSession } from './lib.mjs';

const host = process.env.ORCHESTRATOR_HOST || '127.0.0.1';
const port = Number(process.env.ORCHESTRATOR_PORT || 3000);
const token = process.env.ORCHESTRATOR_TOKEN || '';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (token.length < 24) {
  console.error('ORCHESTRATOR_TOKEN precisa ter pelo menos 24 caracteres.');
  process.exit(1);
}

const assets = new Map([
  ['/', ['static/index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['static/app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['static/styles.css', 'text/css; charset=utf-8']]
]);

function json(response, status, body) {
  const data = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(data);
}

function authenticated(request) {
  const authorization = request.headers.authorization || '';
  return authorization === `Bearer ${token}` || request.headers['x-orchestrator-token'] === token;
}

async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('corpo da requisição excede 1 MB');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json(response, 200, { ok: true, service: 'dsh-orchestrator' });
    }

    if (url.pathname.startsWith('/api/') && !authenticated(request)) {
      return json(response, 401, { error: 'token inválido ou ausente' });
    }

    if (request.method === 'GET' && url.pathname === '/api/sessions') {
      return json(response, 200, { sessions: listSessions() });
    }
    if (request.method === 'POST' && url.pathname === '/api/sessions') {
      return json(response, 201, { session: startSession(await body(request)) });
    }

    const match = url.pathname.match(/^\/api\/sessions\/([a-z0-9._-]+)\/(input|output|stop)$/);
    if (match) {
      const [, id, action] = match;
      if (request.method === 'POST' && action === 'input') {
        const data = await body(request);
        sendInput(id, data.input, data.enter !== false);
        return json(response, 200, { ok: true });
      }
      if (request.method === 'GET' && action === 'output') {
        return json(response, 200, { output: captureOutput(id, url.searchParams.get('lines')) });
      }
      if (request.method === 'POST' && action === 'stop') {
        return json(response, 200, { stopped: stopSession(id) });
      }
    }

    if (request.method === 'GET' && assets.has(url.pathname)) {
      const [relative, contentType] = assets.get(url.pathname);
      const data = readFileSync(path.join(root, relative));
      response.writeHead(200, {
        'content-type': contentType,
        'content-length': data.length,
        'cache-control': url.pathname === '/' ? 'no-cache' : 'public, max-age=3600',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
      });
      return response.end(data);
    }

    json(response, 404, { error: 'rota não encontrada' });
  } catch (error) {
    json(response, error instanceof SyntaxError ? 400 : 422, { error: error.message });
  }
});

server.listen(port, host, () => console.log(`Orchestrator em http://${host}:${port}`));
