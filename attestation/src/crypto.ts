// attestation/src/crypto.ts
import * as circomlibjs from 'circomlibjs';
import crypto from 'node:crypto';

/** ---------------- small utils ---------------- */

export function toHex32(x: unknown): string {
  let bi: bigint;

  if (typeof x === 'bigint') {
    bi = x;
  } else if (typeof x === 'number') {
    bi = BigInt(x);
  } else if (typeof x === 'string') {
    bi = x.startsWith('0x') ? BigInt(x) : BigInt(x); // accept hex or decimal
  } else if (x instanceof Uint8Array || Buffer.isBuffer(x)) {
    bi = BigInt('0x' + Buffer.from(x).toString('hex'));
  } else if ((x as any)?.toBigInt) {
    bi = (x as any).toBigInt();
  } else {
    throw new Error(`toHex32: unsupported type ${typeof x}`);
  }

  return '0x' + bi.toString(16).padStart(64, '0');
}

export const hexToBigInt = (h: string): bigint =>
  BigInt(h.startsWith('0x') || h.startsWith('0X') ? h : '0x' + h);

/** Encode an ASCII/UTF-8 string into field limbs (<=31 bytes per limb) */
export function utf8ToFieldLimbs(s: string): bigint[] {
  const bytes = new TextEncoder().encode(s);
  const limbs: bigint[] = [];
  const chunk = 31;
  for (let i = 0; i < bytes.length; i += chunk) {
    const hex = Buffer.from(bytes.slice(i, i + chunk)).toString('hex') || '00';
    limbs.push(BigInt('0x' + hex));
  }
  return limbs.length ? limbs : [0n];
}

/** ---------------- circomlib singletons ---------------- */

const eddsaPromise = circomlibjs.buildEddsa();
async function eddsa() {
  return await eddsaPromise;
}

/** Poseidon-hash a UTF-8 string to a single field element (bigint). */
export async function poseidonHashString(s: string): Promise<bigint> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const out = E.poseidon(utf8ToFieldLimbs(s));
  return F.toObject(out) as bigint;
}

/** Derive a domain hash (lower-cased part after '@') for allowlists / grants. */
export async function domainHashFromEmail(email: string): Promise<bigint> {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return poseidonHashString(domain);
}

/** Load or generate a BabyJubJub keypair for the attester (NO PHI). */
export async function loadAttesterKeys(): Promise<{
  sk: Buffer;
  Ax: string;
  Ay: string;
}> {
  const E = await eddsa();
  const F = E.babyJub.F;

  const envSkHex = process.env.ATTESTER_SK_HEX?.replace(/^0x/, '');
  const sk =
    envSkHex && envSkHex.length === 64
      ? Buffer.from(envSkHex, 'hex')
      : crypto.randomBytes(32);

  const pub = E.prv2pub(sk); // [AxField, AyField]
  const Ax = F.toObject(pub[0]) as bigint;
  const Ay = F.toObject(pub[1]) as bigint;

  if (!envSkHex) {
    console.warn(
      [
        '[attester] No ATTESTER_SK_HEX provided. Generated a new keypair.',
        '>> Save these in your environment for stable identity:',
        `ATTESTER_SK_HEX=0x${sk.toString('hex')}`,
        `ATT_PUB_X=${toHex32(Ax)}`,
        `ATT_PUB_Y=${toHex32(Ay)}`,
      ].join('\n'),
    );
  }

  return { sk, Ax: toHex32(Ax), Ay: toHex32(Ay) };
}

/** ---------------- POLICY GRANT (replace boardsMask) ----------------
 * Poseidon(["attest:v1:policy-grant", domainHash, policiesMask, expiryDays])
 * - domainHash: field
 * - policiesMask: uint32 -> field
 * - expiryDays: YYYYMMDD -> field
 */

export async function buildPolicyGrantFields(params: {
  domainHash: bigint;
  policiesMask: number; // Uint32 bitmask for policy tiers
  expiryDays: number; // YYYYMMDD
}): Promise<bigint[]> {
  const tag = await poseidonHashString('attest:v1:policy-grant');
  return [tag, params.domainHash, BigInt(params.policiesMask >>> 0), BigInt(params.expiryDays)];
}

export async function buildPolicyGrantMessage(params: {
  domainHash: bigint;
  policiesMask: number;
  expiryDays: number;
}): Promise<bigint> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const fields = await buildPolicyGrantFields(params);
  const out = E.poseidon(fields);
  return F.toObject(out) as bigint;
}

export async function signPolicyGrant(
  params: { domainHash: bigint; policiesMask: number; expiryDays: number },
  sk: Buffer,
): Promise<{ R8x: string; R8y: string; S: string }> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const msg = await buildPolicyGrantMessage(params);
  const sig = E.signPoseidon(sk, msg as any);
  return {
    R8x: toHex32(F.toObject(sig.R8[0]) as bigint),
    R8y: toHex32(F.toObject(sig.R8[1]) as bigint),
    S: toHex32(sig.S as bigint),
  };
}

/** ---------------- CLAIM VERIFICATION ATTESTATION ----------------
 * Poseidon([
 *   "attest:v1:claim-verify",
 *   poseidon(utf8 limbs of claimId),
 *   commitmentHash,
 *   poseidon(utf8 limbs of policyId),
 *   timestamp,
 *   isValid (0|1)
 * ])
 * All values are public; NEVER include PHI here.
 */

export async function buildClaimVerifyFields(params: {
  claimId: string;
  commitmentHash: string; // 0x-hex
  policyId: string;
  timestamp: number; // unix seconds
  isValid: boolean;
}): Promise<bigint[]> {
  const tag = await poseidonHashString('attest:v1:claim-verify');
  const claimIdH = await poseidonHashString(params.claimId);
  const policyIdH = await poseidonHashString(params.policyId);
  const commit = hexToBigInt(params.commitmentHash);
  const ts = BigInt(params.timestamp);
  const ok = params.isValid ? 1n : 0n;
  return [tag, claimIdH, commit, policyIdH, ts, ok];
}

export async function buildClaimVerifyMessage(params: {
  claimId: string;
  commitmentHash: string;
  policyId: string;
  timestamp: number;
  isValid: boolean;
}): Promise<bigint> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const fields = await buildClaimVerifyFields(params);
  const out = E.poseidon(fields);
  return F.toObject(out) as bigint;
}

export async function signClaimVerification(
  params: {
    domainHash: bigint;
    policyMask: number;
    expiryDays: number;
  },
  sk: Buffer,
): Promise<{ R8x: string; R8y: string; S: string }> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const msg = await buildPolicyGrantMessage({
    domainHash: params.domainHash,
    policiesMask: params.policyMask,
    expiryDays: params.expiryDays
  });
  const sig = E.signPoseidon(sk, msg as any);
  return {
    R8x: toHex32(F.toObject(sig.R8[0]) as bigint),
    R8y: toHex32(F.toObject(sig.R8[1]) as bigint),
    S: toHex32(sig.S as bigint),
  };
}

export async function signClaimVerifyAttestation(
  params: {
    claimId: string;
    commitmentHash: string; // 0x-hex
    policyId: string;
    timestamp: number; // unix seconds
    isValid: boolean;
  },
  sk: Buffer,
): Promise<{ R8x: string; R8y: string; S: string }> {
  const E = await eddsa();
  const F = E.babyJub.F;
  const msg = await buildClaimVerifyMessage(params);
  const sig = E.signPoseidon(sk, msg as any);
  return {
    R8x: toHex32(F.toObject(sig.R8[0]) as bigint),
    R8y: toHex32(F.toObject(sig.R8[1]) as bigint),
    S: toHex32(sig.S as bigint),
  };
}
