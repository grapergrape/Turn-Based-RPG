import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 8080);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.ogg', 'audio/ogg'],
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav']
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(url.pathname);
    const safePath = normalize(requestedPath).replace(/^([/\\])+/, '');
    let filePath = resolve(join(root, safePath));

    if (!filePath.startsWith(root)) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    const fileStat = await stat(filePath).catch(() => null);

    if (!fileStat) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const type = mimeTypes.get(extname(filePath)) ?? 'application/octet-stream';
    response.writeHead(200, { 'content-type': type });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`Server error: ${error.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`Local server running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop.');
});
