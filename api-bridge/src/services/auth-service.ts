import { randomBytes } from 'node:crypto';
import type { Logger } from 'pino';
import nacl from 'tweetnacl';

interface ChallengeRecord {
  nonce: string;
  createdAt: number;
}

interface SessionRecord {
  address: string;
  createdAt: number;
}

const challengeStore = new Map<string, ChallengeRecord>();
const sessionStore = new Map<string, SessionRecord>();

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const toHex = (buffer: Uint8Array): string => Buffer.from(buffer).toString('hex');
const fromHex = (hex: string): Uint8Array => new Uint8Array(Buffer.from(hex, 'hex'));

export interface ChallengeResponse {
  nonce: string;
  expiresAt: number;
}

export interface Session {
  token: string;
  expiresAt: number;
  address: string;
}

export class AuthService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ service: 'AuthService' });
  }

  private cleanupExpiredChallenges(): void {
    const threshold = Date.now() - CHALLENGE_TTL_MS;
    for (const [address, record] of challengeStore.entries()) {
      if (record.createdAt < threshold) {
        challengeStore.delete(address);
      }
    }
  }

  private cleanupExpiredSessions(): void {
    const threshold = Date.now() - SESSION_TTL_MS;
    for (const [token, record] of sessionStore.entries()) {
      if (record.createdAt < threshold) {
        sessionStore.delete(token);
      }
    }
  }

  createChallenge(address: string): ChallengeResponse {
    this.cleanupExpiredChallenges();

    const cleanAddress = address.trim();
    if (!cleanAddress) {
      throw new Error('Wallet address is required');
    }

    const nonce = toHex(randomBytes(32));
    challengeStore.set(cleanAddress, { nonce, createdAt: Date.now() });

    this.logger.info({ address: cleanAddress }, 'Challenge created');
    return { nonce, expiresAt: Date.now() + CHALLENGE_TTL_MS };
  }

  verifyChallenge(address: string, signatureHex?: string | null): boolean {
    const cleanAddress = address.trim();
    const challenge = challengeStore.get(cleanAddress);

    if (!challenge) {
      this.logger.warn({ address: cleanAddress }, 'No challenge found for address');
      return false;
    }

    const { nonce, createdAt } = challenge;

    if (Date.now() - createdAt > CHALLENGE_TTL_MS) {
      this.logger.warn({ address: cleanAddress }, 'Challenge expired');
      challengeStore.delete(cleanAddress);
      return false;
    }

    if (!signatureHex) {
      this.logger.warn({ address: cleanAddress }, 'No signature provided, accepting challenge with warning');
      challengeStore.delete(cleanAddress);
      return true;
    }

    try {
      const publicKey = fromHex(cleanAddress.replace(/^0x/, ''));
      const signature = fromHex(signatureHex.replace(/^0x/, ''));
      const message = fromHex(nonce);

      const isValid = nacl.sign.detached.verify(message, signature, publicKey);
      if (isValid) {
        this.logger.info({ address: cleanAddress }, 'Challenge verified successfully');
        challengeStore.delete(cleanAddress);
        return true;
      }

      this.logger.warn({ address: cleanAddress }, 'Invalid signature for challenge');
      return false;
    } catch (error) {
      this.logger.error({ address: cleanAddress, error }, 'Failed to verify challenge');
      return false;
    }
  }

  createSession(address: string): Session {
    this.cleanupExpiredSessions();

    const token = toHex(randomBytes(32));
    const cleanAddress = address.trim();
    sessionStore.set(token, { address: cleanAddress, createdAt: Date.now() });

    this.logger.info({ address: cleanAddress, token }, 'Session created');
    return { token, expiresAt: Date.now() + SESSION_TTL_MS, address: cleanAddress };
  }

  getSession(token: string): SessionRecord | undefined {
    this.cleanupExpiredSessions();
    return sessionStore.get(token);
  }

  revokeSession(token: string): void {
    if (sessionStore.delete(token)) {
      this.logger.info({ token }, 'Session revoked');
    }
  }
}

let authServiceInstance: AuthService | null = null;

export const getAuthService = (logger: Logger): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(logger);
  }
  return authServiceInstance;
};
