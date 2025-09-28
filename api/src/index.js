// api/src/index.ts
/**
 * ZK Claim Verifier — Midnight API wrapper
 *
 * This module adapts the deployed Compact contract (Claim Verifier) into a small,
 * ergonomic API you can call from the backend. No PHI ever flows through here.
 *
 * Responsibilities:
 * - Deploy or join a Claim Verifier contract
 * - Emit minimal on-chain attestations (boolean + public metadata)
 * - Expose a small derived-state stream for UI/debug (no PHI)
 */
import {} from '@midnight-ntwrk/compact-runtime';
import {} from 'pino';
import { tap, Observable } from 'rxjs';
// ---- Managed contract artifacts (adjust path if your generator differs) ----
// Note: These will be available after contract compilation
import { Contract, ledger, pureCircuits } from '../../contract/src/managed/claim/contract/index.cjs';
// If your Compact project exports these helpers/types, keep the import.
// If not, you can change PrivateState to `unknown` and drop `witnesses/createPrivateState`.
// Note: These will be available after contract compilation
// import {
//   type PrivateState,
//   witnesses,
//   createPrivateState,
// } from '../../contract/src/index.js';
// ---- App-shared types (no PHI here) ----
import { claimPrivateStateKey, } from './common-types.js';
import * as utils from './utils/index.js';
/**
 * Claim Verifier API — deployed instance wrapper.
 */
export class ClaimAPI {
    deployedContract;
    providers;
    logger;
    constructor(deployedContract, providers, logger) {
        this.deployedContract = deployedContract;
        this.providers = providers;
        this.logger = logger;
        this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
        // Stream ledger → derived state (no PHI)
        // For MVP, we'll use a mock state stream
        this.state$ = new Observable((subscriber) => {
            const mockState = {
                sequence: 1n,
                totalVerified: 0n,
                // lastVerifiedAt omitted on purpose (exactOptionalPropertyTypes)
            };
            subscriber.next(mockState);
            // Emit periodic updates for demo
            const interval = setInterval(() => {
                const newState = {
                    sequence: mockState.sequence + 1n,
                    totalVerified: (mockState.totalVerified ?? 0n) + 1n,
                    lastVerifiedAt: Math.floor(Date.now() / 1000),
                };
                subscriber.next(newState);
            }, 5000);
            return () => clearInterval(interval);
        }).pipe(tap((state) => logger?.trace({
            ledgerStateChanged: {
                sequence: state.sequence,
                totalVerified: (state.totalVerified ?? 0n).toString(),
                lastVerifiedAt: state.lastVerifiedAt,
            },
        })));
    }
    /** Contract address */
    deployedContractAddress;
    /** Stream of minimal derived state (safe to show in UI/logs) */
    state$;
    /**
     * Emit an on-chain attestation with only public metadata.
     *
     * This delegates to your Compact circuit (e.g., `recordVerification(...)`).
     * Adjust the call name/args below to match your generated `callTx` API.
     */
    async emitAttestation(att) {
        const { claimId, commitmentHash, policyId, timestamp, isValid } = att;
        // Basic guards against accidental PHI leakage:
        utils.assertNoPHI(att);
        utils.safeLogPublic({ claimId, commitmentHash, policyId, timestamp, isValid, txHash: att.txHash ?? null }, '[attestation]');
        // Call the contract circuit. For now, we'll use a mock implementation
        // In a real implementation, this would call the actual circuit
        const tx = {
            public: {
                txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
                blockHeight: BigInt(Math.floor(Date.now() / 1000)),
            },
        };
        this.logger?.info({
            attestationEmitted: {
                txHash: tx.public.txHash,
                blockHeight: tx.public.blockHeight,
                claimId,
                isValid,
            },
        });
        // Most Midnight SDKs expose a tx hash string; some examples return a field/bigint.
        return tx.public.txHash ?? 0n;
    }
    // -------------------------
    // Lifecycle: deploy / join
    // -------------------------
    /**
     * Deploy a new Claim Verifier contract.
     */
    static async deploy(providers, logger) {
        logger?.info('deployClaimContract');
        // For MVP, we'll use a mock deployment
        const deployed = {
            deployTxData: {
                public: {
                    contractAddress: ('0x' + Buffer.from(utils.randomBytes(20)).toString('hex')),
                    txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
                    blockHeight: BigInt(Math.floor(Date.now() / 1000)),
                },
            },
            callTx: {},
            circuitMaintenanceTx: {},
            contractMaintenanceTx: {},
        };
        logger?.trace({ contractDeployed: deployed.deployTxData.public });
        return new ClaimAPI(deployed, providers, logger);
    }
    /**
     * Join an existing Claim Verifier contract by address.
     */
    static async join(providers, contractAddress, logger) {
        logger?.info({ joinClaimContract: { contractAddress } });
        // For MVP, we'll use a mock contract
        const deployed = {
            deployTxData: {
                public: {
                    contractAddress,
                    txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
                    blockHeight: BigInt(Math.floor(Date.now() / 1000)),
                },
            },
            callTx: {},
            circuitMaintenanceTx: {},
            contractMaintenanceTx: {},
        };
        logger?.trace({ contractJoined: deployed.deployTxData.public });
        return new ClaimAPI(deployed, providers, logger);
    }
    /**
     * Initialize private state (no PHI!). Keep empty for MVP unless your contract needs constants.
     * Example: attestor pubkey, policy registry root, etc.
     */
    static async getPrivateState(providers) {
        const existing = await providers.privateStateProvider.get(claimPrivateStateKey);
        if (existing)
            return existing;
        // Optional public params (NOT PHI) from env or Vite env
        // You can remove these if unused by your Compact contract.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viteEnv = import.meta?.env ?? {};
        const ATTESTOR_PUB_X = process.env.ATTESTOR_PUB_X ?? viteEnv.VITE_ATTESTOR_PUB_X;
        const ATTESTOR_PUB_Y = process.env.ATTESTOR_PUB_Y ?? viteEnv.VITE_ATTESTOR_PUB_Y;
        // Fallbacks are safe randoms (no security reliance in MVP)
        const fallbackHex = () => '0x' + Buffer.from(utils.randomBytes(32)).toString('hex');
        // Note: This will be properly implemented after contract compilation
        return {
            attPubXHex: ATTESTOR_PUB_X || fallbackHex(),
            attPubYHex: ATTESTOR_PUB_Y || fallbackHex(),
        };
    }
}
// ---------------
// Re-exports
// ---------------
export * as utils from './utils/index.js';
export * from './common-types.js';
export { ClaimAPI as default };
//# sourceMappingURL=index.js.map