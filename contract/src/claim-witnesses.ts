/*
 * claim-witnesses.ts for the ZK Claim Verifier contract
 *
 * Implements the ZK-backed witnesses for claim verification:
 *   - VERIFY_CLAIM_SIGNATURE: Verifies EdDSA signature over claim data
 *   - VERIFY_CLAIM_AMOUNT: Validates claim amount against business rules
 *   - VERIFY_SERVICE_DATE: Validates service date is within acceptable range
 *   - VERIFY_PROVIDER_AUTHORIZATION: Checks if provider is authorized for claim type
 *   - VERIFY_PATIENT_ELIGIBILITY: Checks if patient is eligible for claim type
 */

import type { Ledger } from "./managed/claim/contract/index.cjs";
import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";

// For circomlibjs 0.1.7, we need to use async builders
let babyJub: any = null;
let eddsa: any = null;
let F: any = null;

// Initialize circomlib - this must be called before using witnesses
export async function initClaimWitnesses() {
  if (babyJub && eddsa) return; // Already initialized
  
  const { buildBabyjub, buildEddsa } = await import("circomlibjs") as any;
  babyJub = await buildBabyjub();
  eddsa = await buildEddsa();
  F = babyJub.F;
}

// Helper to check if initialized
function ensureInitialized() {
  if (!babyJub || !eddsa || !F) {
    throw new Error("Claim witnesses not initialized. Call initClaimWitnesses() first.");
  }
}

/* ===================== Private state ===================== */

export type ClaimPrivateState = {
  readonly authorizedProviders: Map<string, Set<number>>; // providerId -> claimTypes
  readonly eligiblePatients: Set<string>; // patientId set
  readonly maxClaimAmounts: Map<number, bigint>; // claimType -> maxAmount
  readonly minServiceDate: bigint; // minimum service date (unix timestamp)
  readonly maxServiceDate: bigint; // maximum service date (unix timestamp)
};

export function createClaimPrivateState(params: {
  authorizedProviders: Map<string, Set<number>>;
  eligiblePatients: Set<string>;
  maxClaimAmounts: Map<number, bigint>;
  minServiceDate: bigint;
  maxServiceDate: bigint;
}): ClaimPrivateState {
  return {
    authorizedProviders: params.authorizedProviders,
    eligiblePatients: params.eligiblePatients,
    maxClaimAmounts: params.maxClaimAmounts,
    minServiceDate: params.minServiceDate,
    maxServiceDate: params.maxServiceDate,
  };
}

/* ===================== Utilities ===================== */

function assertHex32(hex: string): string {
  if (hex.startsWith("0x") || hex.startsWith("0X")) hex = hex.slice(2);
  if (hex.length !== 64) throw new Error("Expected 32-byte hex (64 chars)");
  return hex;
}

function hexToBytes32(hex: string): Uint8Array {
  const h = assertHex32(hex);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function u8To0xHex(b: Uint8Array): string {
  return "0x" + Buffer.from(b).toString("hex").padStart(64, "0");
}

function stringToBytes32(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const padded = new Uint8Array(32);
  padded.set(bytes.slice(0, 32));
  return padded;
}

/* ===================== Witness implementations ===================== */

export const claimWitnesses = {
  VERIFY_CLAIM_SIGNATURE(
    { privateState }: WitnessContext<Ledger, ClaimPrivateState>,
    claimHash: Uint8Array,
    providerPubX: Uint8Array,
    providerPubY: Uint8Array,
    signatureR8x: Uint8Array,
    signatureR8y: Uint8Array,
    signatureS: Uint8Array,
  ): [ClaimPrivateState, boolean] {
    ensureInitialized();
    
    try {
      const A: [any, any] = [
        F.e(u8To0xHex(providerPubX)),
        F.e(u8To0xHex(providerPubY)),
      ];
      
      const msg = F.e(u8To0xHex(claimHash));
      const R8: [any, any] = [F.e(u8To0xHex(signatureR8x)), F.e(u8To0xHex(signatureR8y))];
      const Sscalar = BigInt(u8To0xHex(signatureS));

      const ok = eddsa.verifyPoseidon(msg, { R8, S: Sscalar }, A);
      return [privateState, ok];
    } catch (error) {
      console.error("Error verifying claim signature:", error);
      return [privateState, false];
    }
  },

  VERIFY_CLAIM_AMOUNT(
    { privateState }: WitnessContext<Ledger, ClaimPrivateState>,
    claimType: number,
    amount: bigint,
  ): [ClaimPrivateState, boolean] {
    const maxAmount = privateState.maxClaimAmounts.get(claimType);
    if (!maxAmount) return [privateState, false];
    
    // Check if amount is within valid range (0 < amount <= maxAmount)
    const valid = amount > 0n && amount <= maxAmount;
    return [privateState, valid];
  },

  VERIFY_SERVICE_DATE(
    { privateState }: WitnessContext<Ledger, ClaimPrivateState>,
    serviceDate: bigint,
    currentTimestamp: bigint,
  ): [ClaimPrivateState, boolean] {
    // Check if service date is within valid range
    const valid = serviceDate >= privateState.minServiceDate && 
                  serviceDate <= privateState.maxServiceDate &&
                  serviceDate <= currentTimestamp; // Cannot be in the future
    
    return [privateState, valid];
  },

  VERIFY_PROVIDER_AUTHORIZATION(
    { privateState }: WitnessContext<Ledger, ClaimPrivateState>,
    providerId: Uint8Array,
    claimType: number,
  ): [ClaimPrivateState, boolean] {
    // Convert providerId bytes back to string for lookup
    const providerIdStr = new TextDecoder().decode(providerId).replace(/\0/g, '');
    const authorizedClaimTypes = privateState.authorizedProviders.get(providerIdStr);
    
    if (!authorizedClaimTypes) return [privateState, false];
    
    const authorized = authorizedClaimTypes.has(claimType);
    return [privateState, authorized];
  },

  VERIFY_PATIENT_ELIGIBILITY(
    { privateState }: WitnessContext<Ledger, ClaimPrivateState>,
    patientId: Uint8Array,
    claimType: number,
  ): [ClaimPrivateState, boolean] {
    // Convert patientId bytes back to string for lookup
    const patientIdStr = new TextDecoder().decode(patientId).replace(/\0/g, '');
    const eligible = privateState.eligiblePatients.has(patientIdStr);
    
    return [privateState, eligible];
  },
};

/* ===================== Helper functions for claim data ===================== */

export function createSampleClaimPrivateState(): ClaimPrivateState {
  // Sample data for demo purposes
  const authorizedProviders = new Map<string, Set<number>>();
  authorizedProviders.set("HOSPITAL_001", new Set([0, 4])); // Medical invoice, Emergency room
  authorizedProviders.set("CLINIC_002", new Set([0, 1, 2])); // Medical, Prescription, Dental
  authorizedProviders.set("PHARMACY_003", new Set([1])); // Prescription only
  authorizedProviders.set("DENTIST_004", new Set([2])); // Dental only
  authorizedProviders.set("EYE_CARE_005", new Set([3])); // Vision only

  const eligiblePatients = new Set<string>();
  eligiblePatients.add("PATIENT_001");
  eligiblePatients.add("PATIENT_002");
  eligiblePatients.add("PATIENT_003");

  const maxClaimAmounts = new Map<number, bigint>();
  maxClaimAmounts.set(0, 100000n); // Medical invoice: $1000.00
  maxClaimAmounts.set(1, 50000n);  // Prescription: $500.00
  maxClaimAmounts.set(2, 200000n); // Dental: $2000.00
  maxClaimAmounts.set(3, 150000n); // Vision: $1500.00
  maxClaimAmounts.set(4, 500000n); // Emergency: $5000.00

  const now = BigInt(Math.floor(Date.now() / 1000));
  const oneYearAgo = now - (365n * 24n * 60n * 60n);
  const oneDayFromNow = now + (24n * 60n * 60n);

  return createClaimPrivateState({
    authorizedProviders,
    eligiblePatients,
    maxClaimAmounts,
    minServiceDate: oneYearAgo,
    maxServiceDate: oneDayFromNow,
  });
}
