import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  constructorContext,
} from "@midnight-ntwrk/compact-runtime";

import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/claim/contract/index.cjs";

import {
  type ClaimPrivateState,
  claimWitnesses,
  createClaimPrivateState,
  initClaimWitnesses,
  createSampleClaimPrivateState,
} from "../claim-witnesses.js";

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
  readonly contract: Contract<ClaimPrivateState>;
  circuitContext: CircuitContext<ClaimPrivateState>;
  private claimCounter: bigint = 0n;
  private claims: Map<bigint, Claim> = new Map();
  private claimStatuses: Map<bigint, ClaimStatus> = new Map();
  private verificationHashes: Map<bigint, string> = new Map();

  private constructor() {
    this.contract = new Contract<ClaimPrivateState>(claimWitnesses);

    const privateState = createSampleClaimPrivateState();
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(privateState, "0".repeat(64))
    );

    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress()
      ),
    };
  }

  static async create(): Promise<ClaimVerifierSimulator> {
    await initClaimWitnesses();
    return new ClaimVerifierSimulator();
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
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
      const [____, providerValid] =
        claimWitnesses.VERIFY_PROVIDER_AUTHORIZATION(
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
      isValid =
        sigValid && amountValid && dateValid && providerValid && patientValid;
    } catch (error) {
      console.error("Error verifying claim:", error);
      isValid = false;
    }

    // Set claim status
    const status = isValid ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;
    this.claimStatuses.set(claimId, status);

    // Generate verification hash
    const verificationHash = this.generateVerificationHash(
      claimId,
      claim,
      isValid
    );
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

  private generateVerificationHash(
    claimId: bigint,
    claim: Claim,
    isValid: boolean
  ): string {
    // Simple hash generation for demo purposes
    const data = `${claimId}-${claim.claimType}-${claim.amount}-${isValid}-${Date.now()}`;
    return "0x" + Buffer.from(data).toString("hex").padStart(64, "0");
  }

  // State persistence methods
  public getState(): any {
    return {
      claimCounter: this.claimCounter,
      claims: Array.from(this.claims.entries()),
      claimStatuses: Array.from(this.claimStatuses.entries()),
      verificationHashes: Array.from(this.verificationHashes.entries()),
    };
  }

  public restoreState(state: any): void {
    if (state) {
      this.claimCounter = BigInt(state.claimCounter || 0);
      this.claims = new Map(state.claims || []);
      this.claimStatuses = new Map(state.claimStatuses || []);
      this.verificationHashes = new Map(state.verificationHashes || []);
    }
  }
}
