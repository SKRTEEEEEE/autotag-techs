// src/server.ts
import http from 'http';
import fs from 'fs';
import path from 'path';
import { debouncedFetch } from './handle';

const hostname = 'localhost';
const port = 4001;


const serveStaticFile = (filePath: string, res: http.ServerResponse) => {
  const ext = path.extname(filePath);
  const contentTypeMap: { [key: string]: string } = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
  };
  const contentType = contentTypeMap[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
};

const server = http.createServer((req, res) => {
  const publicPath = path.resolve(__dirname, '..', 'public');
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(publicPath, 'index.html');
    serveStaticFile(filePath, res);
  } else if (req.url?.startsWith('/public/') || req.url?.startsWith('/dist/')) {
    const filePath = path.join(__dirname, '..', req.url);
    serveStaticFile(filePath, res);
  } else if (req.url === '/pokemon' && req.method === 'GET') {
    debouncedFetch(req, res)
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
