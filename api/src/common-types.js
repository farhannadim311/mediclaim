// api/src/common-types.ts
/**
 * ZK Claim Verifier — common types shared across the API and contract adapters.
 *
 * Keep this file LIGHT: only types/interfaces and tiny constants.
 * No runtime imports from the contract package to avoid circular deps.
 */
import {} from '@midnight-ntwrk/midnight-js-types';
/** ID string your Midnight private-state provider will register under (if used). */
export const claimPrivateStateKey = 'claimPrivateState';
//# sourceMappingURL=common-types.js.map