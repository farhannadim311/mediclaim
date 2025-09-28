// api/src/utils/index.ts

/**
 * ZK Claim Verifier — shared utils for types, crypto adapters, encoding, and safe logging.
 *
 * NOTE:
 * - This module is intentionally isomorphic. Avoid Node-only APIs unless guarded.
 * - Poseidon hashing is pluggable via `setPoseidonHasher()`. The actual implementation
 *   will be provided by the prover layer (browser WASM or a backend lib).
 */

// ---------------------------
// Constants
// ---------------------------

export const DEFAULT_POLICY_MAX = 1000 as const;

export const POLICY_IDS = {
  BASIC_1000: "POLICY-BASIC-1000",
} as const;

export const PUBLIC_INPUT_KEYS = [
  "claimId",
  "commitmentHash",
  "timestamp",
  "policyId",
  "policyMax",
] as const;

// ---------------------------
// Types
// ---------------------------

export interface ClaimPrivate {
  patientId: string;
  providerId: string;
  serviceCodes: string[]; // e.g., ["X01","A12"]
  /**
   * Invoice amount in integer cents. (850 dollars => 85000)
   * For MVP we may pass raw dollars as number, but cents is preferred.
   */
  invoiceAmount: number;
}

export interface ClaimPublic {
  claimId: string;
  timestamp: number; // unix seconds
  policyId: string; // e.g., "POLICY-BASIC-1000"
}

export interface PublicInputs {
  claimId: string;
  commitmentHash: string; // 0x-prefixed hex string
  timestamp: number;
  policyId: string;
  policyMax: number;
}

export interface ProofPayload {
  publicInputs: PublicInputs;
  // snarkjs Groth16 proof.json shape — keep as unknown to avoid tight coupling
  proof: unknown;
}

export interface VerifyResponse {
  valid: boolean;
  txHash?: string | null;
  attestation?: { source: "api" | "midnight" | "ethereum" };
}

// ---------------------------
/* Isomorphic randomness */
// ---------------------------

/** Feature-detect WebCrypto getRandomValues (browser or Node >=19) */
const hasWebCrypto = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (globalThis as any).crypto?.getRandomValues === "function";
  } catch {
    return false;
  }
};

/**
 * Generates `length` random bytes using WebCrypto when available,
 * and Node's crypto.randomFillSync as a safe fallback (loaded dynamically to keep this ESM-safe).
 */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  if (hasWebCrypto()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto.getRandomValues(bytes);
    return bytes;
  }
  // Node fallback (avoid `require` to keep ESM-friendly)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: node:crypto available in Node environments only
  const nodeCrypto: typeof import("node:crypto") = /* @__PURE__ */ (function () {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("node:crypto");
    } catch {
      // Last resort for strict ESM bundlers; will only work in Node.
      // Use Function constructor instead of eval for better security
      const requireFn = new Function('module', 'return require(module)');
      return requireFn("node:crypto");
    }
  })();
  return nodeCrypto.randomFillSync(bytes);
};

// ---------------------------
// Encoding helpers (field adapters)
// ---------------------------

/**
 * Normalize service codes:
 * - trim
 * - uppercase
 * - remove empty entries
 */
export const normalizeServiceCodes = (codes: string[]): string[] =>
  codes
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0);

/**
 * Encode a service code (alphanumeric up to ~8 chars) to a bigint using base36 packing.
 * Deterministic and human-friendly. This is *not* a hash — it's a reversible encoding
 * that fits typical ZK field ranges (for BN254, etc.) for short strings.
 */
export const encodeServiceCode = (code: string): bigint => {
  const norm = code.trim().toUpperCase();
  // Validate allowed charset: 0-9 A-Z
  if (!/^[0-9A-Z]+$/.test(norm)) {
    throw new Error(`Invalid service code charset: ${code}`);
  }
  // Base36 pack
  let acc = 0n;
  for (const ch of norm) {
    const v = BigInt(parseInt(ch, 36));
    acc = acc * 36n + v;
  }
  return acc;
};

/**
 * Encode a list of service codes to field elements.
 */
export const encodeServiceCodes = (codes: string[]): bigint[] =>
  normalizeServiceCodes(codes).map(encodeServiceCode);

/**
 * Normalizes inputs to a field element (bigint).
 * - string (decimal) => bigint
 * - 0x-hex => bigint
 * - number => bigint (safe int only)
 * - Uint8Array => bigint (big-endian)
 */
export const toField = (input: string | number | bigint | Uint8Array): bigint => {
  if (typeof input === "bigint") return input;

  if (typeof input === "number") {
    if (!Number.isSafeInteger(input)) {
      throw new Error("Number not a safe integer for field conversion");
    }
    return BigInt(input);
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (s.startsWith("0x") || s.startsWith("0X")) {
      return hexToBigInt(s);
    }
    // decimal string
    if (!/^-?\d+$/.test(s)) throw new Error(`Invalid decimal string: ${s}`);
    return BigInt(s);
  }

  // Uint8Array
  let acc = 0n;
  for (let i = 0; i < input.length; i++) {
    acc = (acc << 8n) + BigInt(input[i]!);
  }
  return acc;
};

export const hexToBigInt = (hex: string): bigint => {
  const s = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]*$/.test(s)) throw new Error(`Invalid hex: ${hex}`);
  return BigInt("0x" + s);
};

export const bigIntToHex = (x: bigint): string => {
  const h = x.toString(16);
  return "0x" + (h.length % 2 ? "0" + h : h);
};

// ---------------------------
// Poseidon adapter (pluggable)
// ---------------------------

/**
 * Minimal interface for a Poseidon-like hasher that returns a single field element.
 */
export interface PoseidonLike {
  hash(inputs: readonly bigint[]): bigint | Promise<bigint>;
}

let poseidonImpl: PoseidonLike | null = null;

/**
 * Inject the Poseidon implementation (browser WASM or backend lib).
 * Call this during app bootstrap (frontend prover init or backend start).
 */
export const setPoseidonHasher = (impl: PoseidonLike): void => {
  poseidonImpl = impl;
};

/**
 * Compute a field commitment over private inputs:
 * Poseidon(patientId, providerId, ...serviceCodes, invoiceAmount).
 *
 * Returns a 0x-hex string. Throws if Poseidon is not set.
 */
export const computeCommitment = async (priv: ClaimPrivate): Promise<string> => {
  if (!poseidonImpl) {
    throw new Error(
      "Poseidon hasher not set. Call setPoseidonHasher(...) during bootstrap (prover init)."
    );
  }
  const inputs: bigint[] = [];
  inputs.push(toField(priv.patientId));
  inputs.push(toField(priv.providerId));
  for (const sc of encodeServiceCodes(priv.serviceCodes)) inputs.push(sc);
  inputs.push(toField(priv.invoiceAmount));

  const out = await poseidonImpl.hash(inputs);
  const outBig = typeof out === "bigint" ? out : BigInt(String(out));
  return bigIntToHex(outBig);
};

// ---------------------------
// Public inputs composition
// ---------------------------

export const publicInputsFromClaim = (
  claim: ClaimPublic,
  commitmentHash: string,
  policyMax: number
): PublicInputs => {
  if (!Number.isFinite(policyMax) || policyMax <= 0) {
    throw new Error("policyMax must be a positive number");
  }
  if (!/^0x[0-9a-fA-F]+$/.test(commitmentHash)) {
    throw new Error("commitmentHash must be 0x-hex");
  }
  if (!Number.isFinite(claim.timestamp) || claim.timestamp <= 0) {
    throw new Error("timestamp must be positive number");
  }
  return {
    claimId: claim.claimId,
    commitmentHash,
    timestamp: claim.timestamp,
    policyId: claim.policyId,
    policyMax,
  };
};

// ---------------------------
// Safe logging & PHI guards
// ---------------------------

/** Keys that are considered PHI/secret and must never leave client context. */
const PHI_KEYS = new Set(["patientId", "providerId", "serviceCodes", "invoiceAmount"]);

/**
 * Throws if any PHI-like keys are present in a payload destined for backend/contract.
 * Use this at the boundary (e.g., start of POST /verify-proof).
 */
export const assertNoPHI = (obj: unknown): void => {
  if (obj == null || typeof obj !== "object") return;

  const stack: unknown[] = [obj];
  const seen = new Set<unknown>();

  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    const obj = cur as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (PHI_KEYS.has(k)) {
        throw new Error(`PHI key detected in payload: ${k}`);
      }
      if (v && typeof v === "object" && !Array.isArray(v)) {
        stack.push(v as Record<string, unknown>);
      }
    }
  }
};

/**
 * Log only whitelisted public keys; redact everything else.
 */
export const safeLogPublic = (obj: unknown, prefix = "[public]"): void => {
  const allow = new Set(PUBLIC_INPUT_KEYS as readonly string[]);
  const out: Record<string, unknown> = {};

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const [k, v] of Object.entries(record)) {
      out[k] = allow.has(k) ? v : "[REDACTED]";
    }
  } else {
    out.message = "[non-object payload]";
  }
  // eslint-disable-next-line no-console
  console.log(prefix, out);
};

// ---------------------------
// Lightweight validators (type guards)
// ---------------------------

export const isPublicInputs = (p: unknown): p is PublicInputs => {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.claimId === "string" &&
    typeof o.commitmentHash === "string" &&
    typeof o.timestamp === "number" &&
    typeof o.policyId === "string" &&
    typeof o.policyMax === "number"
  );
};

export const validatePublicInputs = (p: unknown): asserts p is PublicInputs => {
  if (!isPublicInputs(p)) throw new Error("Invalid PublicInputs");

  const pi = p as PublicInputs;

  if (!/^0x[0-9a-fA-F]+$/.test(pi.commitmentHash)) {
    throw new Error("commitmentHash must be 0x-hex");
  }
  if (!Number.isFinite(pi.timestamp) || pi.timestamp <= 0) {
    throw new Error("timestamp must be positive number");
  }
  if (!Number.isFinite(pi.policyMax) || pi.policyMax <= 0) {
    throw new Error("policyMax must be positive number");
  }
};

export const isProofPayload = (x: unknown): x is ProofPayload => {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return isPublicInputs(o.publicInputs) && "proof" in o;
};

export const validateProofPayload = (payload: unknown): asserts payload is ProofPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be an object");
  }

  // Narrow the shape so TS knows publicInputs/proof may exist
  const o = payload as { publicInputs: unknown; proof?: unknown };

  // Validate public inputs
  if (!isPublicInputs(o.publicInputs)) {
    throw new Error("Invalid public inputs");
  }
  
  if (o.proof === undefined) {
    throw new Error("Missing proof");
  }
  // intentionally do not validate proof shape here; snarkjs will.
};

// ---------------------------
// Exports (barrel)
// ---------------------------

// PoseidonLike is already exported above, no need to re-export
