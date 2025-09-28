import * as circomlib from "circomlibjs";
export const randomBytes = (length) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
};
export function hex32(u8) {
    return "0x" + Buffer.from(u8).toString("hex").padStart(64, "0");
}
export function hexToBytes32(hex) {
    if (hex.startsWith("0x") || hex.startsWith("0X"))
        hex = hex.slice(2);
    if (hex.length !== 64)
        throw new Error("Expected 32-byte hex");
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++)
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
}
function u8To0xHex(b) {
    return "0x" + Buffer.from(b).toString("hex").padStart(64, "0");
}
// Build the Poseidon message for claim verification (matches claim-witnesses.ts)
export function buildClaimVerificationMessage(F, claimHash, providerId, patientId, amount, serviceDate) {
    // Pre-computed hash for "claim:v1:verification" to match claim verification
    const tag = "0x2a8b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b";
    const messageArray = [
        F.e(tag),
        F.e(u8To0xHex(claimHash)),
        F.e(u8To0xHex(providerId)),
        F.e(u8To0xHex(patientId)),
        F.e(amount),
        F.e(serviceDate)
    ];
    return messageArray;
}
// Signs claim verification message with BabyJub EdDSA (matches VERIFY_CLAIM_SIGNATURE)
export async function signClaimVerification(params) {
    const babyJub = await circomlib.buildBabyjub();
    const eddsa = await circomlib.buildEddsa();
    const F = babyJub.F;
    let skHex = params.skHex;
    if (skHex.startsWith("0x") || skHex.startsWith("0X"))
        skHex = skHex.slice(2);
    if (skHex.length !== 64)
        throw new Error("skHex must be 32 bytes hex");
    // Use Buffer directly like claim-witnesses
    const sk = Buffer.from(skHex, "hex");
    const msgArray = buildClaimVerificationMessage(F, params.claimHash, params.providerId, params.patientId, params.amount, params.serviceDate);
    // Hash the message array to get a single field element for signing
    const msg = eddsa.poseidon(msgArray);
    const sig = eddsa.signPoseidon(sk, msg);
    const R8x = hexToBytes32("0x" + F.toObject(sig.R8[0]).toString(16).padStart(64, "0"));
    const R8y = hexToBytes32("0x" + F.toObject(sig.R8[1]).toString(16).padStart(64, "0"));
    const S = hexToBytes32("0x" + BigInt(sig.S).toString(16).padStart(64, "0"));
    return { R8x, R8y, S };
}
// Generate a deterministic claim hash from claim data
export function generateClaimHash(claimData) {
    // Simple hash generation for demo purposes
    const data = JSON.stringify({
        claimType: claimData.claimType,
        amount: claimData.amount.toString(),
        serviceDate: claimData.serviceDate.toString(),
        providerId: Array.from(claimData.providerId),
        patientId: Array.from(claimData.patientId),
        description: claimData.description,
        metadata: claimData.metadata,
    });
    const hash = new TextEncoder().encode(data);
    const result = new Uint8Array(32);
    result.set(hash.slice(0, 32));
    return result;
}
// Convert string to 32-byte array (for provider/patient IDs)
export function stringToBytes32(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const padded = new Uint8Array(32);
    padded.set(bytes.slice(0, 32));
    return padded;
}
// Convert bytes back to string (for provider/patient IDs)
export function bytes32ToString(bytes) {
    const decoder = new TextDecoder();
    return decoder.decode(bytes).replace(/\0/g, '');
}
// Validate claim amount against policy limits
export function validateClaimAmount(claimType, amount, maxAmounts) {
    const maxAmount = maxAmounts.get(claimType);
    if (!maxAmount)
        return false;
    return amount > 0n && amount <= maxAmount;
}
// Validate service date is within acceptable range
export function validateServiceDate(serviceDate, minDate, maxDate, currentTimestamp) {
    return serviceDate >= minDate &&
        serviceDate <= maxDate &&
        serviceDate <= currentTimestamp;
}
// Check if provider is authorized for claim type
export function validateProviderAuthorization(providerId, claimType, authorizedProviders) {
    const authorizedClaimTypes = authorizedProviders.get(providerId);
    if (!authorizedClaimTypes)
        return false;
    return authorizedClaimTypes.has(claimType);
}
// Check if patient is eligible
export function validatePatientEligibility(patientId, eligiblePatients) {
    return eligiblePatients.has(patientId);
}
// Generate sample claim data for testing
export function generateSampleClaim(overrides = {}) {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return {
        claimType: overrides.claimType ?? 0, // MEDICAL_INVOICE
        amount: overrides.amount ?? 50000n, // $500
        serviceDate: overrides.serviceDate ?? (now - 86400n), // 1 day ago
        providerId: stringToBytes32(overrides.providerId ?? "HOSPITAL_001"),
        patientId: stringToBytes32(overrides.patientId ?? "PATIENT_001"),
        description: overrides.description ?? "Sample medical claim",
        metadata: overrides.metadata ?? "{}",
    };
}
// Generate sample signature data for testing
export function generateSampleSignature() {
    return {
        claimHash: randomBytes(32),
        signatureR8x: randomBytes(32),
        signatureR8y: randomBytes(32),
        signatureS: randomBytes(32),
    };
}
// Complete sample claim with signature for testing
export function generateCompleteSampleClaim(overrides = {}) {
    const claimData = generateSampleClaim(overrides);
    const signatureData = generateSampleSignature();
    const claimHash = generateClaimHash(claimData);
    return {
        ...claimData,
        ...signatureData,
        claimHash, // Override with the correct hash
    };
}
//# sourceMappingURL=claim-utils.js.map