// api/src/common-types.ts

/**
 * ZK Claim Verifier — common types shared across the API and contract adapters.
 *
 * Keep this file LIGHT: only types/interfaces and tiny constants.
 * No runtime imports from the contract package to avoid circular deps.
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

/** ID string your Midnight private-state provider will register under (if used). */
export const claimPrivateStateKey = 'claimPrivateState';
export type PrivateStateId = typeof claimPrivateStateKey;

/**
 * Private state consumed by the Claim Verifier contract (if any).
 * For the MVP we don't persist PHI here — keep it minimal or empty.
 * You can extend this later if your Compact contract reads private state.
 */
export interface ClaimPrivateState {
  // Intentionally empty for MVP; add fields if your contract needs local private data.
  // Example future fields:
  // readonly proverPubKey?: string;
  // readonly policyRegistryRoot?: string;
}

/** Schema map for all private states used by contracts in this app. */
export type PrivateStates = {
  readonly claimPrivateState: ClaimPrivateState;
};

/**
 * Keys of circuits exported by your Compact contract (string union).
 * If you don't need to reference circuit names at the API layer, keep it as `string`.
 */
export type ClaimCircuitKeys = string;

/** Midnight providers required by the Claim Verifier. */
export type ClaimProviders = MidnightProviders;


/**
 * On-chain attestation we care about (what we’ll emit/log after verification).
 * Matches the public surface: no PHI in here.
 */
export interface ClaimAttestation {
  claimId: string;
  commitmentHash: string; // 0x-hex
  policyId: string;
  timestamp: number;      // unix seconds
  isValid: boolean;
  txHash?: string | null; // set if we emitted an on-chain event
  chain?: 'midnight' | 'ethereum' | 'api'; // where the attestation lives
}

/**
 * Optional: a typed wrapper for a deployed contract.
 * If you don't have a generated TypeScript `Contract` type yet, leave this generic.
 */

/**
 * (Optional) A compact "derived state" shape you might read back from chain/indexer.
 * Nothing PHI here — just minimal ledger-visible metadata for UI display.
 */
export interface ClaimDerivedState {
  readonly sequence: bigint; // monotonically increasing sequence (if your contract tracks it)
  readonly lastVerifiedAt?: number; // unix seconds
  readonly totalVerified?: bigint;
}
