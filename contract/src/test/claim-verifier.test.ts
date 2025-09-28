// claim-verifier.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";

import { 
  ClaimVerifierSimulator, 
  ClaimType, 
  ClaimStatus,
  type Claim 
} from "./claim-verifier-simulator.js";

setNetworkId(NetworkId.Undeployed);

// Test constants
const TEST_PROVIDER_ID = "HOSPITAL_001";
const TEST_PATIENT_ID = "PATIENT_001";
const TEST_CLAIM_HASH = new Uint8Array(32).fill(1);
const TEST_SIGNATURE_R8X = new Uint8Array(32).fill(2);
const TEST_SIGNATURE_R8Y = new Uint8Array(32).fill(3);
const TEST_SIGNATURE_S = new Uint8Array(32).fill(4);

beforeAll(async () => {
  // Initialize any required setup
});

describe("ZK Claim Verifier", () => {
  it("initializes with sample data", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const privateState = simulator.getPrivateState();
    expect(privateState.authorizedProviders.size).toBeGreaterThan(0);
    expect(privateState.eligiblePatients.size).toBeGreaterThan(0);
    expect(privateState.maxClaimAmounts.size).toBeGreaterThan(0);
  });

  it("verifies valid medical claim", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n, // $500 (within $1000 limit)
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Emergency room visit",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ClaimStatus.APPROVED);
    expect(result.claimId).toBe(0n);
    expect(result.verificationHash).toBeTruthy();
  });

  it("rejects claim with amount over policy limit", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 150000n, // $1500 (over $1000 limit)
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Expensive procedure",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("rejects claim with future service date", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const futureDate = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day in future
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: futureDate,
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Future appointment",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("rejects claim from unauthorized provider", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode("UNAUTHORIZED_PROVIDER"),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Unauthorized provider",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("rejects claim for ineligible patient", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode("INELIGIBLE_PATIENT"),
      description: "Ineligible patient",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("verifies prescription drug claim", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.PRESCRIPTION_DRUG,
      amount: 25000n, // $250 (within $500 limit)
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode("PHARMACY_003"), // Authorized for prescriptions
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Prescription medication",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ClaimStatus.APPROVED);
  });

  it("rejects prescription claim from wrong provider type", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.PRESCRIPTION_DRUG,
      amount: 25000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode("DENTIST_004"), // Not authorized for prescriptions
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Prescription from dentist",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("verifies emergency room claim with higher limit", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.EMERGENCY_ROOM,
      amount: 300000n, // $3000 (within $5000 limit)
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID), // Authorized for emergency
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Emergency room treatment",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ClaimStatus.APPROVED);
  });

  it("tracks multiple claims correctly", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    // First claim
    const result1 = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "First claim",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    // Second claim
    const result2 = simulator.verifyClaim({
      claimType: ClaimType.PRESCRIPTION_DRUG,
      amount: 25000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 172800), // 2 days ago
      providerId: new TextEncoder().encode("PHARMACY_003"),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Second claim",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result1.claimId).toBe(0n);
    expect(result2.claimId).toBe(1n);
    
    const stats = simulator.getClaimStats();
    expect(stats.total).toBe(2);
    expect(stats.approved).toBe(2);
    expect(stats.rejected).toBe(0);
  });

  it("retrieves claim status and verification hash", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Test claim",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    const claimId = result.claimId;
    const status = simulator.getClaimStatus(claimId);
    const hash = simulator.getClaimVerificationHash(claimId);
    
    expect(status).toBe(ClaimStatus.APPROVED);
    expect(hash).toBeTruthy();
    expect(hash).toBe(result.verificationHash);
  });

  it("handles edge case with zero amount", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 0n, // Zero amount
      serviceDate: BigInt(Math.floor(Date.now() / 1000) - 86400),
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Zero amount claim",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    expect(result.isValid).toBe(false);
    expect(result.status).toBe(ClaimStatus.REJECTED);
  });

  it("handles edge case with very old service date", async () => {
    const simulator = await ClaimVerifierSimulator.create();
    
    const veryOldDate = BigInt(Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60)); // 1 year ago
    
    const result = simulator.verifyClaim({
      claimType: ClaimType.MEDICAL_INVOICE,
      amount: 50000n,
      serviceDate: veryOldDate,
      providerId: new TextEncoder().encode(TEST_PROVIDER_ID),
      patientId: new TextEncoder().encode(TEST_PATIENT_ID),
      description: "Very old claim",
      metadata: "{}",
      claimHash: TEST_CLAIM_HASH,
      signatureR8x: TEST_SIGNATURE_R8X,
      signatureR8y: TEST_SIGNATURE_R8Y,
      signatureS: TEST_SIGNATURE_S,
    });
    
    // Should be valid if within the min/max date range
    expect(result.isValid).toBe(true);
    expect(result.status).toBe(ClaimStatus.APPROVED);
  });
});
