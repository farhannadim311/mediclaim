// In-memory store for ZK Claim Verifier email verification challenges
type Entry = { code: string; expiresAt: number };

const TTL_MS = Number(process.env.CHALLENGE_TTL_MS ?? 5 * 60 * 1000); // 5 min
const store = new Map<string, Entry>();

export function putChallenge(email: string, code: string) {
  const expiresAt = Date.now() + TTL_MS;
  store.set(email.toLowerCase(), { code, expiresAt });
}

export function verifyChallenge(email: string, code: string): boolean {
  const key = email.toLowerCase();
  const e = store.get(key);
  if (!e) return false;
  const ok = e.code === code && Date.now() <= e.expiresAt;
  if (ok) store.delete(key); // one-time use
  return ok;
}
