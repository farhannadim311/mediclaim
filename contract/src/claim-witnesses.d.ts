import type { Ledger } from "./managed/claim/contract/index.cjs";
import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
export declare function initClaimWitnesses(): Promise<void>;
export type ClaimPrivateState = {
    readonly authorizedProviders: Map<string, Set<number>>;
    readonly eligiblePatients: Set<string>;
    readonly maxClaimAmounts: Map<number, bigint>;
    readonly minServiceDate: bigint;
    readonly maxServiceDate: bigint;
};
export declare function createClaimPrivateState(params: {
    authorizedProviders: Map<string, Set<number>>;
    eligiblePatients: Set<string>;
    maxClaimAmounts: Map<number, bigint>;
    minServiceDate: bigint;
    maxServiceDate: bigint;
}): ClaimPrivateState;
export declare const claimWitnesses: {
    VERIFY_CLAIM_SIGNATURE({ privateState }: WitnessContext<Ledger, ClaimPrivateState>, claimHash: Uint8Array, providerPubX: Uint8Array, providerPubY: Uint8Array, signatureR8x: Uint8Array, signatureR8y: Uint8Array, signatureS: Uint8Array): [ClaimPrivateState, boolean];
    VERIFY_CLAIM_AMOUNT({ privateState }: WitnessContext<Ledger, ClaimPrivateState>, claimType: number, amount: bigint): [ClaimPrivateState, boolean];
    VERIFY_SERVICE_DATE({ privateState }: WitnessContext<Ledger, ClaimPrivateState>, serviceDate: bigint, currentTimestamp: bigint): [ClaimPrivateState, boolean];
    VERIFY_PROVIDER_AUTHORIZATION({ privateState }: WitnessContext<Ledger, ClaimPrivateState>, providerId: Uint8Array, claimType: number): [ClaimPrivateState, boolean];
    VERIFY_PATIENT_ELIGIBILITY({ privateState }: WitnessContext<Ledger, ClaimPrivateState>, patientId: Uint8Array, claimType: number): [ClaimPrivateState, boolean];
};
export declare function createSampleClaimPrivateState(): ClaimPrivateState;
