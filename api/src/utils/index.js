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
export const DEFAULT_POLICY_MAX = 1000;
export const POLICY_IDS = {
    BASIC_1000: "POLICY-BASIC-1000",
};
export const PUBLIC_INPUT_KEYS = [
    "claimId",
    "commitmentHash",
    "timestamp",
    "policyId",
    "policyMax",
];
// ---------------------------
/* Isomorphic randomness */
// ---------------------------
/** Feature-detect WebCrypto getRandomValues (browser or Node >=19) */
const hasWebCrypto = () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeof globalThis.crypto?.getRandomValues === "function";
    }
    catch {
        return false;
    }
};
/**
 * Generates `length` random bytes using WebCrypto when available,
 * and Node's crypto.randomFillSync as a safe fallback (loaded dynamically to keep this ESM-safe).
 */
export const randomBytes = (length) => {
    const bytes = new Uint8Array(length);
    if (hasWebCrypto()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        globalThis.crypto.getRandomValues(bytes);
        return bytes;
    }
    // Node fallback (avoid `require` to keep ESM-friendly)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: node:crypto available in Node environments only
    const nodeCrypto = /* @__PURE__ */ (function () {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require("node:crypto");
        }
        catch {
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
export const normalizeServiceCodes = (codes) => codes
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0);
/**
 * Encode a service code (alphanumeric up to ~8 chars) to a bigint using base36 packing.
 * Deterministic and human-friendly. This is *not* a hash — it's a reversible encoding
 * that fits typical ZK field ranges (for BN254, etc.) for short strings.
 */
export const encodeServiceCode = (code) => {
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
export const encodeServiceCodes = (codes) => normalizeServiceCodes(codes).map(encodeServiceCode);
/**
 * Normalizes inputs to a field element (bigint).
 * - string (decimal) => bigint
 * - 0x-hex => bigint
 * - number => bigint (safe int only)
 * - Uint8Array => bigint (big-endian)
 */
export const toField = (input) => {
    if (typeof input === "bigint")
        return input;
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
        if (!/^-?\d+$/.test(s))
            throw new Error(`Invalid decimal string: ${s}`);
        return BigInt(s);
    }
    // Uint8Array
    let acc = 0n;
    for (let i = 0; i < input.length; i++) {
        acc = (acc << 8n) + BigInt(input[i]);
    }
    return acc;
};
export const hexToBigInt = (hex) => {
    const s = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
    if (!/^[0-9a-fA-F]*$/.test(s))
        throw new Error(`Invalid hex: ${hex}`);
    return BigInt("0x" + s);
};
export const bigIntToHex = (x) => {
    const h = x.toString(16);
    return "0x" + (h.length % 2 ? "0" + h : h);
};
let poseidonImpl = null;
/**
 * Inject the Poseidon implementation (browser WASM or backend lib).
 * Call this during app bootstrap (frontend prover init or backend start).
 */
export const setPoseidonHasher = (impl) => {
    poseidonImpl = impl;
};
/**
 * Compute a field commitment over private inputs:
 * Poseidon(patientId, providerId, ...serviceCodes, invoiceAmount).
 *
 * Returns a 0x-hex string. Throws if Poseidon is not set.
 */
export const computeCommitment = async (priv) => {
    if (!poseidonImpl) {
        throw new Error("Poseidon hasher not set. Call setPoseidonHasher(...) during bootstrap (prover init).");
    }
    const inputs = [];
    inputs.push(toField(priv.patientId));
    inputs.push(toField(priv.providerId));
    for (const sc of encodeServiceCodes(priv.serviceCodes))
        inputs.push(sc);
    inputs.push(toField(priv.invoiceAmount));
    const out = await poseidonImpl.hash(inputs);
    const outBig = typeof out === "bigint" ? out : BigInt(String(out));
    return bigIntToHex(outBig);
};
// ---------------------------
// Public inputs composition
// ---------------------------
export const publicInputsFromClaim = (claim, commitmentHash, policyMax) => {
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
export const assertNoPHI = (obj) => {
    if (obj == null || typeof obj !== "object")
        return;
    const stack = [obj];
    const seen = new Set();
    while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== "object" || Array.isArray(cur))
            continue;
        if (seen.has(cur))
            continue;
        seen.add(cur);
        const obj = cur;
        for (const [k, v] of Object.entries(obj)) {
            if (PHI_KEYS.has(k)) {
                throw new Error(`PHI key detected in payload: ${k}`);
            }
            if (v && typeof v === "object" && !Array.isArray(v)) {
                stack.push(v);
            }
        }
    }
};
/**
 * Log only whitelisted public keys; redact everything else.
 */
export const safeLogPublic = (obj, prefix = "[public]") => {
    const allow = new Set(PUBLIC_INPUT_KEYS);
    const out = {};
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const record = obj;
        for (const [k, v] of Object.entries(record)) {
            out[k] = allow.has(k) ? v : "[REDACTED]";
        }
    }
    else {
        out.message = "[non-object payload]";
    }
    // eslint-disable-next-line no-console
    console.log(prefix, out);
};
// ---------------------------
// Lightweight validators (type guards)
// ---------------------------
export const isPublicInputs = (p) => {
    if (!p || typeof p !== "object")
        return false;
    const o = p;
    return (typeof o.claimId === "string" &&
        typeof o.commitmentHash === "string" &&
        typeof o.timestamp === "number" &&
        typeof o.policyId === "string" &&
        typeof o.policyMax === "number");
};
export const validatePublicInputs = (p) => {
    if (!isPublicInputs(p))
        throw new Error("Invalid PublicInputs");
    const pi = p;
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
export const isProofPayload = (x) => {
    if (!x || typeof x !== "object")
        return false;
    const o = x;
    return isPublicInputs(o.publicInputs) && "proof" in o;
};
export const validateProofPayload = (payload) => {
    if (!payload || typeof payload !== "object") {
        throw new Error("Payload must be an object");
    }
    // Narrow the shape so TS knows publicInputs/proof may exist
    const o = payload;
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
//# sourceMappingURL=index.js.map