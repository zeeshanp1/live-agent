#!/usr/bin/env node
/**
 * Minimal zero-dependency static server for local development.
 *
 * ES modules cannot be loaded from file:// URLs, and the Web Speech, Web
 * Bluetooth and camera APIs need a secure context (https:// or localhost),
 * so the app has to be served over http://localhost.
 *
 * Only index.html, /src and /assets are exposed.
 *
 *   npm start                 # http://127.0.0.1:8080
 *   PORT=3000 npm start       # custom port
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function isPublicPath(pathname) {
  return (
    pathname === '/index.html' ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/assets/')
  );
}

function send(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(message);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    // Normalise first so "/src/../package.json" cannot pass the allow-list.
    const safePath = posix.normalize(pathname);
    const filePath = resolve(join(ROOT, safePath));

    if (!isPublicPath(safePath) || !filePath.startsWith(ROOT + sep)) {
      return send(res, 404, 'Not found');
    }

    const info = await stat(filePath);
    if (!info.isFile()) return send(res, 404, 'Not found');

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch (err) {
    const notFound = ['ENOENT', 'ENOTDIR', 'ERR_INVALID_ARG_VALUE'].includes(err?.code);
    send(res, notFound ? 404 : 500, notFound ? 'Not found' : 'Internal server error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Pendant MCP dev server running at http://${HOST}:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
