import http from 'node:http';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** A stand-in for /usr/sbin/sendmail that records its arguments and the message, or fails like an unavailable MTA. */
export async function makeFakeSendmail({ fail = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'garden-contact-test-'));
  const path = join(dir, 'sendmail');
  const script = fail
    ? ['#!/bin/sh', 'cat > /dev/null', 'exit 75', '']
    : ['#!/bin/sh', `out="${dir}/delivery-$$"`, 'printf "%s\\n" "$@" > "$out.args"', 'cat > "$out.eml"', 'exit 0', ''];
  await writeFile(path, script.join('\n'), { mode: 0o755 });
  return {
    path,
    async deliveries() {
      const files = (await readdir(dir)).filter((file) => file.endsWith('.eml')).sort();
      return Promise.all(
        files.map(async (file) => ({
          message: await readFile(join(dir, file), 'utf8'),
          args: (await readFile(join(dir, file.replace(/\.eml$/, '.args')), 'utf8')).trim().split('\n'),
        })),
      );
    },
  };
}

/** Emulates Cloudflare siteverify: single-use tokens; prefixes select failure modes. */
export async function startMockSiteverify() {
  const used = new Set();
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      const params = new URLSearchParams(raw);
      const token = params.get('response') ?? '';
      calls.push({
        secret: params.get('secret'),
        token,
        remoteip: params.get('remoteip'),
        idempotencyKey: params.get('idempotency_key'),
      });
      if (token.startsWith('down')) {
        res.writeHead(500);
        res.end('unavailable');
        return;
      }
      let body;
      if (params.get('secret') !== 'mock-secret') body = { success: false, 'error-codes': ['invalid-input-secret'] };
      else if (used.has(token)) body = { success: false, 'error-codes': ['timeout-or-duplicate'] };
      else if (token.startsWith('fail')) body = { success: false, 'error-codes': ['invalid-input-response'] };
      else {
        body = {
          success: true,
          challenge_ts: new Date().toISOString(),
          hostname: token.startsWith('wronghost') ? 'evil.example' : 'garden-ministries.org',
          action: token.startsWith('wrongaction') ? 'login' : 'contact',
          'error-codes': [],
        };
      }
      used.add(token);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/siteverify`,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Raw HTTP request (lets tests set or omit Origin and other headers exactly). */
export function request(port, { path = '/api/contact', method = 'POST', body = '', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(body);
    const merged = {
      'Content-Type': 'application/json',
      Origin: 'https://garden-ministries.org',
      'Content-Length': String(data.length),
      ...headers,
    };
    for (const name of Object.keys(merged)) if (merged[name] === undefined) delete merged[name];
    let settled = false;
    const req = http.request({ host: '127.0.0.1', port, path, method, headers: merged }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => {
        settled = true;
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, json, text });
      });
    });
    req.on('error', (error) => {
      if (!settled) reject(error);
    });
    req.end(data);
  });
}
