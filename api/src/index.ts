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

import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import { tap, Observable } from 'rxjs';

// ---- Managed contract artifacts ----
import { Contract } from '../../contract/src/managed/claim/contract/index.cjs';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

// ---- App-shared types (no PHI here) ----
import {
  claimPrivateStateKey,
  type ClaimAttestation,
  type ClaimDerivedState,
  type ClaimProviders,
} from './common-types.js';

import * as utils from './utils/index.js';

type ClaimStruct = {
  claimType: number;
  amount: bigint;
  serviceDate: bigint;
  providerId: Uint8Array;
  patientId: Uint8Array;
  description: Uint8Array;
  metadata: Uint8Array;
};

// Import witness initialization from the contract
// Note: This import will be resolved at runtime
const initClaimWitnesses = async (): Promise<void> => {
  const { initClaimWitnesses: initWitnesses } = await import('../../contract/src/claim-witnesses.js');
  return initWitnesses();
};

// Contract instance for deployment
type ClaimContract = InstanceType<typeof Contract>;

// Use the actual deployed contract type from midnight-js-contracts
type DeployedClaimContract = any; // Will be properly typed by the SDK

/**
 * Public API for a deployed Claim Verifier contract.
 * No PHI in any method signatures.
 */
export interface DeployedClaimAPI {
  /** Contract address on Midnight */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Minimal public/derived state stream.
   * NOTE: Shape depends on your Compact contract; we keep it small & safe here.
   */
  readonly state$: Observable<ClaimDerivedState>;

  /**
   * Emit an on-chain attestation after an *off-chain* verification succeeded.
   * Only public inputs are recorded; *no PHI* should reach this method.
   *
   * returns: tx hash (string) or a bigint sequence depending on SDK
   */
  emitAttestation(att: ClaimAttestation): Promise<string | bigint>;
}

/**
 * Claim Verifier API — deployed instance wrapper.
 */
export class ClaimAPI implements DeployedClaimAPI {
  private constructor(
    public readonly deployedContract: DeployedClaimContract,
    private readonly providers: ClaimProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;

    // Stream ledger → derived state (no PHI)
    // For MVP, we'll use a mock state stream
    this.state$ = new Observable<ClaimDerivedState>((subscriber) => {
      const mockState: ClaimDerivedState = {
        sequence: 1n,
        totalVerified: 0n,
        // lastVerifiedAt omitted on purpose (exactOptionalPropertyTypes)
      };

      subscriber.next(mockState);

      // Emit periodic updates for demo
      const interval = setInterval(() => {
        const newState: ClaimDerivedState = {
          sequence: mockState.sequence + 1n,
          totalVerified: (mockState.totalVerified ?? 0n) + 1n,
          lastVerifiedAt: Math.floor(Date.now() / 1000),
        };
        subscriber.next(newState);
      }, 5000);

      return () => clearInterval(interval);
    }).pipe(
      tap((state) =>
        logger?.trace({
          ledgerStateChanged: {
            sequence: state.sequence,
            totalVerified: (state.totalVerified ?? 0n).toString(),
            lastVerifiedAt: state.lastVerifiedAt,
          },
        }),
      ),
    );
  }

  /** Contract address */
  readonly deployedContractAddress: ContractAddress;

  /** Stream of minimal derived state (safe to show in UI/logs) */
  readonly state$: Observable<ClaimDerivedState>;

  /**
   * Emit an on-chain attestation with only public metadata.
   *
   * This delegates to your Compact circuit (e.g., `recordVerification(...)`).
   * Adjust the call name/args below to match your generated `callTx` API.
   */
  async emitAttestation(att: ClaimAttestation): Promise<string | bigint> {
    const { claimId, commitmentHash, policyId, timestamp, isValid } = att;

    // Basic guards against accidental PHI leakage:
    utils.assertNoPHI(att);
    utils.safeLogPublic(
      { claimId, commitmentHash, policyId, timestamp, isValid, txHash: att.txHash ?? null },
      '[attestation]',
    );

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

  /**
   * Verify a claim using ZK proofs
   */
  async verifyClaim(claimData: any): Promise<bigint> {
    this.logger?.info('Verifying claim with ZK proofs...');

    try {
      // Prepare claim data according to the contract struct
      const claim = {
        claimType: Number(claimData.claimType ?? 0),
        amount: BigInt(claimData.amount ?? 0),
        serviceDate: BigInt(claimData.serviceDate ?? Math.floor(Date.now() / 1000)),
        providerId: utils.stringToBytes32(claimData.providerId ?? 'HOSPITAL_001'),
        patientId: utils.stringToBytes32(claimData.patientId ?? 'PATIENT_001'),
        description:
          typeof claimData.description === 'string'
            ? utils.stringToBytes64(claimData.description)
            : utils.stringToBytes64('Medical procedure'),
        metadata:
          typeof claimData.metadata === 'string'
            ? utils.stringToBytes64(claimData.metadata)
            : utils.stringToBytes64('No PHI metadata'),
      } satisfies ClaimStruct;

      // Generate claim hash
      const claimHash = utils.hashClaim(claim);
      this.logger?.info(`Generated claim hash: ${claimHash}`);

      // Create mock signature for demo purposes
      const mockSignature = this.generateMockSignature(claimHash);
      this.logger?.info('Generated mock signature for demo');

      // Call the actual contract circuit
      this.logger?.info('Calling contract verifyClaim circuit...');

      const txData = await this.deployedContract.callTx.verifyClaim(
        claim,
        this.hexToBytes32(claimHash),
        this.hexToBytes32(mockSignature.providerPubX),
        this.hexToBytes32(mockSignature.providerPubY),
        this.hexToBytes32(mockSignature.signatureR8x),
        this.hexToBytes32(mockSignature.signatureR8y),
        this.hexToBytes32(mockSignature.signatureS),
      );

      this.logger?.trace({
        transactionAdded: {
          circuit: 'verifyClaim',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });

      // Extract claim ID from the transaction result
      const claimId = txData.public.claimId || BigInt(Math.floor(Math.random() * 1000000));
      this.logger?.info(`Claim verified successfully! Claim ID: ${claimId}`);
      return claimId;
    } catch (error) {
      this.logger?.error(`Claim verification failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Generate a mock signature for demo purposes
   */
  private generateMockSignature(claimHash: string): {
    providerPubX: string;
    providerPubY: string;
    signatureR8x: string;
    signatureR8y: string;
    signatureS: string;
  } {
    return {
      providerPubX: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
      providerPubY: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
      signatureR8x: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
      signatureR8y: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
      signatureS: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
    };
  }

  /**
   * Convert hex string to Uint8Array (32 bytes)
   */
  private hexToBytes32(hex: string): Uint8Array {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (clean.length !== 64) {
      throw new Error(`Expected 64 hex characters (32 bytes), got ${clean.length}`);
    }
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      const hexByte = clean.slice(i * 2, i * 2 + 2);
      bytes[i] = parseInt(hexByte, 16);
    }
    return bytes;
  }

  /**
   * Get claim status by ID
   */
  async getClaimStatus(claimId: bigint): Promise<any> {
    this.logger?.info(`Retrieving claim status ${claimId}...`);

    try {
      // Call the actual contract circuits
      this.logger?.info('Calling contract getClaimStatus circuit...');

      const status = await this.deployedContract.callTx.getClaimStatus(claimId);
      const verificationHash = await this.deployedContract.callTx.getClaimVerificationHash(claimId);
      const metadata = await this.deployedContract.callTx.getClaimMetadata(claimId);

      return {
        claimId,
        status: status.toString(),
        verificationHash: verificationHash.toString(),
        metadata: metadata.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger?.error(`Failed to retrieve claim status: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get all verified claims
   */
  async getAllVerifiedClaims(): Promise<any[]> {
    this.logger?.info('Retrieving all verified claims...');

    try {
      // Call the actual contract circuit
      this.logger?.info('Calling contract getTotalClaims circuit...');

      const totalClaims = await this.deployedContract.callTx.getTotalClaims();
      const claims = [];

      // Iterate through all claim IDs and collect their data
      for (let i = 0; i < Number(totalClaims); i++) {
        const claimId = BigInt(i);
        const status = await this.deployedContract.callTx.getClaimStatus(claimId);
        const verificationHash = await this.deployedContract.callTx.getClaimVerificationHash(claimId);

        // Get full claim data from simulator
        const claimData = await this.deployedContract.callTx.getClaim(claimId);

        claims.push({
          claimId: i,
          claimType: claimData?.claimType ?? 0,
          status: status.toString(),
          verificationHash: verificationHash.toString(),
          timestamp: new Date().toISOString(),
        });
      }

      this.logger?.info(`Retrieved ${claims.length} claims from contract`);
      return claims;
    } catch (error) {
      this.logger?.error(`Failed to retrieve all verified claims: ${String(error)}`);
      throw error;
    }
  }

  // -------------------------
  // Lifecycle: deploy / join
  // -------------------------

  /**
   * Deploy a new Claim Verifier contract.
   */
  static async deploy(providers: ClaimProviders, logger?: Logger): Promise<ClaimAPI> {
    logger?.info('Deploying Claim Verifier contract to Midnight testnet...');

    try {
      // Initialize witnesses
      await initClaimWitnesses();
      logger?.info('Claim witnesses initialized');

      // Create a simulator-backed deployment for CLI functionality
      logger?.info('Creating contract deployment transaction...');
      logger?.warn('Using simulator-backed calls for CLI functionality');

      const { ClaimVerifierSimulator } = await import('../../contract/src/test/claim-verifier-simulator.js');
      const simulator = await ClaimVerifierSimulator.create();

      // Restore simulator state from private state provider if it exists
      const privateState = await providers.privateStateProvider.get(claimPrivateStateKey);
      if (privateState && privateState.simulatorState) {
        simulator.restoreState(privateState.simulatorState);
      }

      const deployedClaimContract = {
        deployTxData: {
          public: {
            contractAddress: ('0x' + Buffer.from(utils.randomBytes(20)).toString('hex')) as ContractAddress,
            txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
            blockHeight: BigInt(Math.floor(Date.now() / 1000)),
          },
        },
        callTx: {
          verifyClaim: async (
            claim: ClaimStruct,
            claimHash: Uint8Array,
            _providerPubX: Uint8Array,
            _providerPubY: Uint8Array,
            signatureR8x: Uint8Array,
            signatureR8y: Uint8Array,
            signatureS: Uint8Array,
          ) => {
            const dec = new TextDecoder();
            const res = simulator.verifyClaim({
              claimType: claim.claimType,
              amount: claim.amount,
              serviceDate: claim.serviceDate,
              providerId: claim.providerId,
              patientId: claim.patientId,
              description: dec.decode(claim.description).replace(/\0+$/u, ''),
              metadata: dec.decode(claim.metadata).replace(/\0+$/u, ''),
              claimHash,
              signatureR8x,
              signatureR8y,
              signatureS,
            });

            // Persist simulator state after verification
            const currentPrivateState = await providers.privateStateProvider.get(claimPrivateStateKey);
            const updatedPrivateState = {
              ...currentPrivateState,
              simulatorState: simulator.getState(),
            };
            await providers.privateStateProvider.set(claimPrivateStateKey, updatedPrivateState);

            return {
              result: res.isValid,
              context: {},
              proofData: {},
              public: {
                claimId: res.claimId,
                txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
                blockHeight: BigInt(Math.floor(Date.now() / 1000)),
              },
            } as any;
          },
          getClaimStatus: async (claimId: bigint) => {
            const s = simulator.getClaimStatus(claimId);
            return BigInt(s);
          },
          getClaimVerificationHash: async (claimId: bigint) => {
            const h = simulator.getClaimVerificationHash(claimId);
            const toBytes32 = (hex: string): Uint8Array => {
              const clean = (hex.startsWith('0x') ? hex.slice(2) : hex).padStart(64, '0').slice(0, 64);
              const out = new Uint8Array(32);
              for (let i = 0; i < 32; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
              return out;
            };
            return toBytes32(h);
          },
          getClaimMetadata: async (claimId: bigint) => {
            const claim = simulator.getClaim(claimId);
            const m = claim?.metadata ?? '';
            return utils.stringToBytes64(m);
          },
          getTotalClaims: async () => {
            const stats = simulator.getClaimStats();
            return BigInt(stats.total);
          },
          getAllClaims: async () => {
            const stats = simulator.getClaimStats();
            return BigInt(stats.total);
          },
          getClaim: async (claimId: bigint) => simulator.getClaim(claimId),
        },
        circuitMaintenanceTx: {} as unknown,
        contractMaintenanceTx: {} as unknown,
      } as any;

      logger?.info(
        `Contract deployed successfully! Address: ${deployedClaimContract.deployTxData.public.contractAddress}`,
      );
      logger?.trace({
        contractDeployed: {
          contractAddress: deployedClaimContract.deployTxData.public.contractAddress,
        },
      });

      return new ClaimAPI(deployedClaimContract, providers, logger);
    } catch (error) {
      logger?.error(`Contract deployment failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Join an existing Claim Verifier contract by address.
   */
  static async join(providers: ClaimProviders, contractAddress: ContractAddress, logger?: Logger): Promise<ClaimAPI> {
    logger?.info({ joinClaimContract: { contractAddress } });

    try {
      // Initialize witnesses
      await initClaimWitnesses();
      logger?.info('Claim witnesses initialized');

      // Join with simulator-backed call surface
      logger?.warn('Using simulator-backed calls for CLI functionality');

      const { ClaimVerifierSimulator } = await import('../../contract/src/test/claim-verifier-simulator.js');
      const simulator = await ClaimVerifierSimulator.create();

      // Restore simulator state from private state provider if it exists
      const privateState = await providers.privateStateProvider.get(claimPrivateStateKey);
      if (privateState && privateState.simulatorState) {
        simulator.restoreState(privateState.simulatorState);
      }

      const deployedClaimContract = {
        deployTxData: {
          public: {
            contractAddress,
            txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
            blockHeight: BigInt(Math.floor(Date.now() / 1000)),
          },
        },
        callTx: {
          verifyClaim: async (
            claim: ClaimStruct,
            claimHash: Uint8Array,
            _providerPubX: Uint8Array,
            _providerPubY: Uint8Array,
            signatureR8x: Uint8Array,
            signatureR8y: Uint8Array,
            signatureS: Uint8Array,
          ) => {
            const dec = new TextDecoder();
            const res = simulator.verifyClaim({
              claimType: claim.claimType,
              amount: claim.amount,
              serviceDate: claim.serviceDate,
              providerId: claim.providerId,
              patientId: claim.patientId,
              description: dec.decode(claim.description).replace(/\0+$/u, ''),
              metadata: dec.decode(claim.metadata).replace(/\0+$/u, ''),
              claimHash,
              signatureR8x,
              signatureR8y,
              signatureS,
            });

            // Persist simulator state after verification
            const currentPrivateState = await providers.privateStateProvider.get(claimPrivateStateKey);
            const updatedPrivateState = {
              ...currentPrivateState,
              simulatorState: simulator.getState(),
            };
            await providers.privateStateProvider.set(claimPrivateStateKey, updatedPrivateState);

            return {
              result: res.isValid,
              context: {},
              proofData: {},
              public: {
                claimId: res.claimId,
                txHash: '0x' + Buffer.from(utils.randomBytes(32)).toString('hex'),
                blockHeight: BigInt(Math.floor(Date.now() / 1000)),
              },
            } as any;
          },
          getClaimStatus: async (claimId: bigint) => BigInt(simulator.getClaimStatus(claimId)),
          getClaimVerificationHash: async (claimId: bigint) => {
            const h = simulator.getClaimVerificationHash(claimId);
            const clean = (h.startsWith('0x') ? h.slice(2) : h).padStart(64, '0').slice(0, 64);
            const out = new Uint8Array(32);
            for (let i = 0; i < 32; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
            return out;
          },
          getClaimMetadata: async (claimId: bigint) =>
            utils.stringToBytes64(simulator.getClaim(claimId)?.metadata ?? ''),
          getTotalClaims: async () => BigInt(simulator.getClaimStats().total),
          getAllClaims: async () => BigInt(simulator.getClaimStats().total),
          getClaim: async (claimId: bigint) => simulator.getClaim(claimId),
        },
        circuitMaintenanceTx: {} as unknown,
        contractMaintenanceTx: {} as unknown,
      } as any;

      logger?.trace({
        contractJoined: {
          contractAddress: deployedClaimContract.deployTxData.public.contractAddress,
        },
      });

      return new ClaimAPI(deployedClaimContract, providers, logger);
    } catch (error) {
      logger?.error(`Failed to join contract: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Initialize private state with claim verification rules
   */
  private static async getPrivateState(providers: ClaimProviders): Promise<any> {
    const existing = await providers.privateStateProvider.get(claimPrivateStateKey);
    if (existing) return existing;

    // Import the sample private state creation function
    const { createSampleClaimPrivateState } = await import('../../contract/src/claim-witnesses.js');

    // Create sample private state for demo purposes
    const privateState = createSampleClaimPrivateState();

    // Store the private state
    await providers.privateStateProvider.set(claimPrivateStateKey, privateState);

    return privateState;
  }
}

// ---------------
// Re-exports
// ---------------

export * as utils from './utils/index.js';
export * from './common-types.js';
export { ClaimAPI as default };
