// In-memory limits for a single service instance. Counters reset on restart, which is acceptable for a contact form.

export class SlidingWindow {
  #hits = new Map();

  constructor(limit, windowMs, maxKeys = 5_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  allowed(key, now) {
    return this.#fresh(key, now).length < this.limit;
  }

  record(key, now) {
    const hits = this.#fresh(key, now);
    hits.push(now);
    this.#hits.set(key, hits);
    this.#bound(now);
  }

  #fresh(key, now) {
    const hits = (this.#hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    if (hits.length) this.#hits.set(key, hits);
    else this.#hits.delete(key);
    return hits;
  }

  #bound(now) {
    if (this.#hits.size <= this.maxKeys) return;
    for (const [key, hits] of this.#hits) {
      if (hits.every((time) => now - time >= this.windowMs)) this.#hits.delete(key);
    }
    for (const key of this.#hits.keys()) {
      if (this.#hits.size <= this.maxKeys) break;
      this.#hits.delete(key); // oldest insertion first
    }
  }
}

export class ExpiringSet {
  #entries = new Map();

  constructor(ttlMs, maxKeys = 10_000) {
    this.ttlMs = ttlMs;
    this.maxKeys = maxKeys;
  }

  has(key, now) {
    const added = this.#entries.get(key);
    if (added === undefined) return false;
    if (now - added >= this.ttlMs) {
      this.#entries.delete(key);
      return false;
    }
    return true;
  }

  add(key, now) {
    this.#entries.delete(key);
    this.#entries.set(key, now);
    for (const [entry, added] of this.#entries) {
      if (this.#entries.size <= this.maxKeys && now - added < this.ttlMs) break;
      this.#entries.delete(entry);
    }
  }
}

function expandIpv6(address) {
  const withoutZone = address.split('%')[0].toLowerCase();
  const halves = withoutZone.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  return [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail];
}

/** Rate-limit key: IPv4 as is, IPv4-mapped IPv6 as IPv4, IPv6 grouped by /64 (one subscriber). */
export function clientKey(ip) {
  if (!ip) return 'unknown';
  if (ip.startsWith('::ffff:') && ip.includes('.')) return ip.slice(7);
  if (!ip.includes(':')) return ip;
  const groups = expandIpv6(ip);
  return groups ? `${groups.slice(0, 4).map((group) => group.padStart(4, '0')).join(':')}::/64` : ip;
}
