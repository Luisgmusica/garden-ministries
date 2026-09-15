import { spawn } from 'node:child_process';
import { ENVELOPE_SENDER, MAIL_TO } from './message.js';

/**
 * Hands one message to the local Postfix `sendmail` (no network, no credentials). The recipient is passed as an
 * argument after `--` and `-t` is never used, so no header can add recipients. Resolves once Postfix accepted it.
 */
export function deliver(raw, { sendmailPath, timeoutMs = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(sendmailPath, ['-i', '-f', ENVELOPE_SENDER, '--', MAIL_TO], {
      stdio: ['pipe', 'ignore', 'pipe'],
      env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin' },
    });

    let settled = false;
    let stderr = '';
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const failure = (code) => Object.assign(new Error('sendmail failed'), { code });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(failure('timeout'));
    }, timeoutMs);

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 500) stderr += chunk;
    });
    child.on('error', (error) => finish(failure(error.code ?? 'spawn_error')));
    child.on('close', (code, signal) => (code === 0 ? finish() : finish(failure(`exit_${code ?? signal}`))));
    child.stdin.on('error', () => {}); // a crashed child is reported by 'close'
    child.stdin.end(raw);
  });
}
