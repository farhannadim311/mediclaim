import { type CircuitContext } from "@midnight-ntwrk/compact-runtime";
import { type ClaimPrivateState } from "../claim-witnesses.js";
export interface ClaimVerifierContract<T> {
    witnesses: any;
    circuits: {
        verifyClaim: (context: CircuitContext<T>, claim: Claim) => {
            result: boolean;
            context: CircuitContext<T>;
            proofData: any;
        };
        getClaimStatus: (context: CircuitContext<T>, claimId: bigint) => {
            result: ClaimStatus;
            context: CircuitContext<T>;
            proofData: any;
        };
        getClaimVerificationHash: (context: CircuitContext<T>, claimId: bigint) => {
            result: string;
            context: CircuitContext<T>;
            proofData: any;
        };
    };
    impureCircuits: {
        verifyClaim: (context: CircuitContext<T>, claim: Claim) => {
            result: boolean;
            context: CircuitContext<T>;
            proofData: any;
        };
        getClaimStatus: (context: CircuitContext<T>, claimId: bigint) => {
            result: ClaimStatus;
            context: CircuitContext<T>;
            proofData: any;
        };
        getClaimVerificationHash: (context: CircuitContext<T>, claimId: bigint) => {
            result: string;
            context: CircuitContext<T>;
            proofData: any;
        };
    };
    initialState(context: any): {
        currentContractState: any;
        currentPrivateState: T;
        currentZswapLocalState: any;
    };
}
export declare enum ClaimType {
    MEDICAL_INVOICE = 0,
    PRESCRIPTION_DRUG = 1,
    DENTAL_PROCEDURE = 2,
    VISION_CARE = 3,
    EMERGENCY_ROOM = 4
}
export declare enum ClaimStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2
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
export declare class ClaimVerifierSimulator {
    readonly contract: ClaimVerifierContract<ClaimPrivateState>;
    circuitContext: CircuitContext<ClaimPrivateState>;
    private claimCounter;
    private claims;
    private claimStatuses;
    private verificationHashes;
    private constructor();
    static create(params?: {
        authorizedProviders?: Map<string, Set<number>>;
        eligiblePatients?: Set<string>;
        maxClaimAmounts?: Map<number, bigint>;
        minServiceDate?: bigint;
        maxServiceDate?: bigint;
    }): Promise<ClaimVerifierSimulator>;
    getPrivateState(): ClaimPrivateState;
    verifyClaim(args: {
        claimType: ClaimType;
        amount: bigint;
        serviceDate: bigint;
        providerId: Uint8Array;
        patientId: Uint8Array;
        description: string;
        metadata: string;
        claimHash: Uint8Array;
        signatureR8x: Uint8Array;
        signatureR8y: Uint8Array;
        signatureS: Uint8Array;
    }): ClaimVerificationResult;
    getClaimStatus(claimId: bigint): ClaimStatus;
    getClaimVerificationHash(claimId: bigint): string;
    getClaim(claimId: bigint): Claim | undefined;
    getAllClaims(): Map<bigint, Claim>;
    getClaimStats(): {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    };
    private generateVerificationHash;
    private mockVerifyClaim;
    private mockGetClaimStatus;
    private mockGetClaimVerificationHash;
    private mockInitialState;
}
