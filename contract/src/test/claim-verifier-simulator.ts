import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  constructorContext,
  convert_bigint_to_Uint8Array,
} from "@midnight-ntwrk/compact-runtime";

import {
  type ClaimPrivateState,
  claimWitnesses,
  createClaimPrivateState,
  initClaimWitnesses,
  createSampleClaimPrivateState,
} from "../claim-witnesses.js";

// Mock contract interface for ZK Claim Verifier
export interface ClaimVerifierContract<T> {
  witnesses: any;
  circuits: {
    verifyClaim: (context: CircuitContext<T>, claim: Claim) => { result: boolean; context: CircuitContext<T>; proofData: any };
    getClaimStatus: (context: CircuitContext<T>, claimId: bigint) => { result: ClaimStatus; context: CircuitContext<T>; proofData: any };
    getClaimVerificationHash: (context: CircuitContext<T>, claimId: bigint) => { result: string; context: CircuitContext<T>; proofData: any };
  };
  impureCircuits: {
    verifyClaim: (context: CircuitContext<T>, claim: Claim) => { result: boolean; context: CircuitContext<T>; proofData: any };
    getClaimStatus: (context: CircuitContext<T>, claimId: bigint) => { result: ClaimStatus; context: CircuitContext<T>; proofData: any };
    getClaimVerificationHash: (context: CircuitContext<T>, claimId: bigint) => { result: string; context: CircuitContext<T>; proofData: any };
  };
  initialState(context: any): {
    currentContractState: any;
    currentPrivateState: T;
    currentZswapLocalState: any;
  };
}

export enum ClaimType {
  MEDICAL_INVOICE = 0,
  PRESCRIPTION_DRUG = 1,
  DENTAL_PROCEDURE = 2,
  VISION_CARE = 3,
  EMERGENCY_ROOM = 4,
}

export enum ClaimStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export interface Claim {
  claimType: ClaimType;
  amount: bigint;
  serviceDate: bigint;
  providerId: Uint8Array;
  patientId: Uint8Array;
  description: string;
  metadata: string;
}

export interface ClaimVerificationResult {
  isValid: boolean;
  claimId: bigint;
  verificationHash: string;
  status: ClaimStatus;
  timestamp: bigint;
}

export class ClaimVerifierSimulator {
  readonly contract: ClaimVerifierContract<ClaimPrivateState>;
  circuitContext: CircuitContext<ClaimPrivateState>;
  private claimCounter: bigint = 0n;
  private claims: Map<bigint, Claim> = new Map();
  private claimStatuses: Map<bigint, ClaimStatus> = new Map();
  private verificationHashes: Map<bigint, string> = new Map();

  private constructor(params: {
    authorizedProviders: Map<string, Set<number>>;
    eligiblePatients: Set<string>;
    maxClaimAmounts: Map<number, bigint>;
    minServiceDate: bigint;
    maxServiceDate: bigint;
  }) {
    // Create a mock contract that uses our claim witnesses
    this.contract = {
      witnesses: claimWitnesses,
      circuits: {
        verifyClaim: this.mockVerifyClaim.bind(this),
        getClaimStatus: this.mockGetClaimStatus.bind(this),
        getClaimVerificationHash: this.mockGetClaimVerificationHash.bind(this),
      },
      impureCircuits: {
        verifyClaim: this.mockVerifyClaim.bind(this),
        getClaimStatus: this.mockGetClaimStatus.bind(this),
        getClaimVerificationHash: this.mockGetClaimVerificationHash.bind(this),
      },
      initialState: this.mockInitialState.bind(this),
    };

    const privateState = createClaimPrivateState(params);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(privateState, "0".repeat(64)),
    );

    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  static async create(params?: {
    authorizedProviders?: Map<string, Set<number>>;
    eligiblePatients?: Set<string>;
    maxClaimAmounts?: Map<number, bigint>;
    minServiceDate?: bigint;
    maxServiceDate?: bigint;
  }): Promise<ClaimVerifierSimulator> {
    await initClaimWitnesses();
    
    // Use sample data if no params provided
    const sampleState = createSampleClaimPrivateState();
    const finalParams = {
      authorizedProviders: params?.authorizedProviders ?? sampleState.authorizedProviders,
      eligiblePatients: params?.eligiblePatients ?? sampleState.eligiblePatients,
      maxClaimAmounts: params?.maxClaimAmounts ?? sampleState.maxClaimAmounts,
      minServiceDate: params?.minServiceDate ?? sampleState.minServiceDate,
      maxServiceDate: params?.maxServiceDate ?? sampleState.maxServiceDate,
    };
    
    return new ClaimVerifierSimulator(finalParams);
  }

  public getPrivateState(): ClaimPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public verifyClaim(args: {
    claimType: ClaimType;
    amount: bigint;
    serviceDate: bigint;
    providerId: Uint8Array;
    patientId: Uint8Array;
    description: string;
    metadata: string;
    // ZK proof data
    claimHash: Uint8Array;
    signatureR8x: Uint8Array;
    signatureR8y: Uint8Array;
    signatureS: Uint8Array;
  }): ClaimVerificationResult {
    const {
      claimType,
      amount,
      serviceDate,
      providerId,
      patientId,
      description,
      metadata,
      claimHash,
      signatureR8x,
      signatureR8y,
      signatureS,
    } = args;

    // Create claim object
    const claim: Claim = {
      claimType,
      amount,
      serviceDate,
      providerId,
      patientId,
      description,
      metadata,
    };

    // Generate claim ID
    const claimId = this.claimCounter++;
    this.claims.set(claimId, claim);

    // Verify claim using ZK witnesses
    let isValid = false;
    try {
      // Create witness context with mock ledger
      const witnessContext = {
        privateState: this.circuitContext.currentPrivateState,
        ledger: {
          sequence: 0n,
          claims: {
            isEmpty: () => true,
            size: () => 0n,
            member: () => false,
            lookup: () => undefined,
            [Symbol.iterator]: () => [][Symbol.iterator](),
          },
          claimAttested: {
            isEmpty: () => true,
            size: () => 0n,
            member: () => false,
            lookup: () => undefined,
            [Symbol.iterator]: () => [][Symbol.iterator](),
          },
        },
        contractAddress: this.circuitContext.transactionContext.address,
      } as any;

      // 1. Verify signature
      const [_, sigValid] = claimWitnesses.VERIFY_CLAIM_SIGNATURE(
        witnessContext,
        claimHash,
        signatureR8x,
        signatureR8y,
        signatureR8x,
        signatureR8y,
        signatureS
      );

      // 2. Verify amount
      const [__, amountValid] = claimWitnesses.VERIFY_CLAIM_AMOUNT(
        witnessContext,
        claimType,
        amount
      );

      // 3. Verify service date
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
      const [___, dateValid] = claimWitnesses.VERIFY_SERVICE_DATE(
        witnessContext,
        serviceDate,
        currentTimestamp
      );

      // 4. Verify provider authorization
      const [____, providerValid] = claimWitnesses.VERIFY_PROVIDER_AUTHORIZATION(
        witnessContext,
        providerId,
        claimType
      );

      // 5. Verify patient eligibility
      const [_____, patientValid] = claimWitnesses.VERIFY_PATIENT_ELIGIBILITY(
        witnessContext,
        patientId,
        claimType
      );

      // All validations must pass
      isValid = sigValid && amountValid && dateValid && providerValid && patientValid;

    } catch (error) {
      console.error("Error verifying claim:", error);
      isValid = false;
    }

    // Set claim status
    const status = isValid ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;
    this.claimStatuses.set(claimId, status);

    // Generate verification hash
    const verificationHash = this.generateVerificationHash(claimId, claim, isValid);
    this.verificationHashes.set(claimId, verificationHash);

    return {
      isValid,
      claimId,
      verificationHash,
      status,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  public getClaimStatus(claimId: bigint): ClaimStatus {
    return this.claimStatuses.get(claimId) ?? ClaimStatus.PENDING;
  }

  public getClaimVerificationHash(claimId: bigint): string {
    return this.verificationHashes.get(claimId) ?? "";
  }

  public getClaim(claimId: bigint): Claim | undefined {
    return this.claims.get(claimId);
  }

  public getAllClaims(): Map<bigint, Claim> {
    return new Map(this.claims);
  }

  public getClaimStats(): {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  } {
    const total = this.claims.size;
    let approved = 0;
    let rejected = 0;
    let pending = 0;

    for (const [_, status] of this.claimStatuses) {
      switch (status) {
        case ClaimStatus.APPROVED:
          approved++;
          break;
        case ClaimStatus.REJECTED:
          rejected++;
          break;
        case ClaimStatus.PENDING:
          pending++;
          break;
      }
    }

    return { total, approved, rejected, pending };
  }

  private generateVerificationHash(claimId: bigint, claim: Claim, isValid: boolean): string {
    // Simple hash generation for demo purposes
    const data = `${claimId}-${claim.claimType}-${claim.amount}-${isValid}-${Date.now()}`;
    return "0x" + Buffer.from(data).toString("hex").padStart(64, "0");
  }

  // Mock contract methods
  private mockVerifyClaim(context: CircuitContext<ClaimPrivateState>, claim: Claim) {
    // This would normally call the actual contract circuit
    return {
      result: true,
      context,
      proofData: {},
    };
  }

  private mockGetClaimStatus(context: CircuitContext<ClaimPrivateState>, claimId: bigint) {
    return {
      result: this.getClaimStatus(claimId),
      context,
      proofData: {},
    };
  }

  private mockGetClaimVerificationHash(context: CircuitContext<ClaimPrivateState>, claimId: bigint) {
    return {
      result: this.getClaimVerificationHash(claimId),
      context,
      proofData: {},
    };
  }

  private mockInitialState(context: any) {
    return {
      currentContractState: {},
      currentPrivateState: this.circuitContext.currentPrivateState,
      currentZswapLocalState: {},
    };
  }
}
