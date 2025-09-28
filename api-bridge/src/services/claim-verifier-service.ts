import {
  ClaimAPI,
  type ClaimProviders,
  claimPrivateStateKey,
} from "claim-verifier-api";
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { type ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { assertIsContractAddress } from "@midnight-ntwrk/midnight-js-utils";
import type { Logger } from "pino";
import path from "path";
import fs from "fs";

export interface ClaimVerificationRequest {
  claimType: number;
  amount: string;
  serviceDate: string;
  providerId: string;
  patientId: string;
  description: string;
  metadata: string;
  walletSeed: string;
}

export interface ClaimVerificationResponse {
  claimId: string;
  status: "VERIFIED" | "REJECTED" | "PENDING";
  verificationHash: string;
  timestamp: number;
  message: string;
  txHash?: string;
  blockHeight?: string;
}

export interface ClaimRecord {
  id: string;
  claimType: string;
  amount: number;
  status: "VERIFIED" | "REJECTED" | "PENDING";
  serviceDate: string;
  verificationDate: string;
  providerId: string;
  providerName: string;
  verificationHash: string;
  metadata?: string;
}

export interface ContractDeploymentResult {
  contractAddress: string;
  txHash: string;
  blockHeight: string;
  message: string;
}

export class ClaimVerifierService {
  private deployedApis = new Map<string, ClaimAPI>(); // Cache by wallet seed
  private readonly config = {
    indexer:
      process.env.INDEXER_URL || "https://indexer.testnet.midnight.network",
    indexerWS:
      process.env.INDEXER_WS_URL || "wss://indexer.testnet.midnight.network",
    proofServer:
      process.env.PROOF_SERVER_URL ||
      "https://proof-server.testnet.midnight.network",
    zkConfigPath:
      process.env.ZK_CONFIG_PATH ||
      path.join(process.cwd(), "../contract/src/managed/claim"),
    rpcUrl: process.env.RPC_URL || "https://rpc.testnet.midnight.network",
  };

  constructor(private logger: Logger) {
    this.logger.info(
      "ClaimVerifierService initialized with real infrastructure",
      {
        indexer: this.config.indexer,
        proofServer: this.config.proofServer,
        rpcUrl: this.config.rpcUrl,
      }
    );
  }

  /**
   * Create real Midnight providers for a given wallet seed
   */
  private async createProviders(walletSeed: string): Promise<ClaimProviders> {
    this.logger.info("Creating real Midnight Network providers...");

    const cleanSeed = walletSeed.trim().replace(/^0x/, "");

    // Create real wallet and providers
    const walletAndMidnightProvider = await WalletBuilder.buildFromSeed(
      cleanSeed,
      this.config.rpcUrl,
      1000 // funding amount
    );

    // Create private state provider with persistent storage
    const dbPath = path.join(
      process.cwd(),
      "claim-verifier-db",
      `wallet-${cleanSeed.slice(0, 8)}`
    );
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const privateStateProvider = levelPrivateStateProvider(dbPath);

    const providers: ClaimProviders = {
      privateStateProvider,
      publicDataProvider: indexerPublicDataProvider(
        this.config.indexer,
        this.config.indexerWS
      ),
      zkConfigProvider: new NodeZkConfigProvider(
        this.config.zkConfigPath
      ) as any,
      proofProvider: httpClientProofProvider(this.config.proofServer) as any,
      walletProvider: walletAndMidnightProvider as any,
      midnightProvider: walletAndMidnightProvider as any,
    };

    this.logger.info("Real Midnight providers created successfully");
    return providers;
  }

  /**
   * Deploy a new claim verifier contract using REAL infrastructure
   */
  async deployContract(walletSeed: string): Promise<ContractDeploymentResult> {
    this.logger.info(
      "Deploying claim verifier contract with real infrastructure..."
    );

    try {
      const providers = await this.createProviders(walletSeed);

      // Initialize claim witnesses (real ZK setup)
      this.logger.info("Initializing real claim witnesses...");
      const { initClaimWitnesses } = await import(
        "../../../contract/src/claim-witnesses.js"
      );
      await initClaimWitnesses();

      // Deploy using REAL ClaimAPI
      this.logger.info("Deploying contract to Midnight testnet...");
      const claimApi = await ClaimAPI.deploy(providers, this.logger);

      // Cache the deployed API
      this.deployedApis.set(walletSeed, claimApi);

      const result: ContractDeploymentResult = {
        contractAddress: claimApi.deployedContractAddress,
        txHash: "real-tx-hash", // TODO: Extract from deployment result
        blockHeight: "real-block-height", // TODO: Extract from deployment result
        message: "Contract deployed successfully to Midnight testnet",
      };

      this.logger.info("Contract deployed successfully", result);
      return result;
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to deploy contract");
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  }

  /**
   * Join an existing claim verifier contract using REAL infrastructure
   */
  async joinContract(
    walletSeed: string,
    contractAddress: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.info("Joining existing contract with real infrastructure...", {
      contractAddress,
    });

    try {
      assertIsContractAddress(contractAddress);
      const providers = await this.createProviders(walletSeed);

      // Initialize claim witnesses (real ZK setup)
      this.logger.info("Initializing real claim witnesses...");
      const { initClaimWitnesses } = await import(
        "../../../contract/src/claim-witnesses.js"
      );
      await initClaimWitnesses();

      // Join using REAL ClaimAPI
      this.logger.info("Joining contract on Midnight testnet...");
      const claimApi = await ClaimAPI.join(
        providers,
        contractAddress as ContractAddress,
        this.logger
      );

      // Cache the joined API
      this.deployedApis.set(walletSeed, claimApi);

      this.logger.info("Successfully joined contract", { contractAddress });
      return {
        success: true,
        message: "Successfully joined contract on Midnight testnet",
      };
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to join contract");
      throw new Error(`Contract join failed: ${error.message}`);
    }
  }

  /**
   * Verify a claim using REAL ZK proofs and infrastructure
   */
  async verifyClaim(
    claimData: ClaimVerificationRequest
  ): Promise<ClaimVerificationResponse> {
    this.logger.info("Verifying claim with real ZK proofs...");

    try {
      // Get or create ClaimAPI instance
      let claimApi = this.deployedApis.get(claimData.walletSeed);

      if (!claimApi) {
        this.logger.info("No existing contract found, deploying new one...");
        await this.deployContract(claimData.walletSeed);
        claimApi = this.deployedApis.get(claimData.walletSeed)!;
      }

      // Prepare claim data for contract
      const claimPayload = {
        claimType: Number(claimData.claimType),
        amount: BigInt(claimData.amount),
        serviceDate: BigInt(
          Math.floor(new Date(claimData.serviceDate).getTime() / 1000)
        ),
        providerId: claimData.providerId,
        patientId: claimData.patientId,
        description: claimData.description,
        metadata: claimData.metadata,
      };

      this.logger.info("Calling real verifyClaim with ZK proofs...");

      // Call REAL verification with ZK proofs
      const claimId = await claimApi.verifyClaim(claimPayload);

      const result: ClaimVerificationResponse = {
        claimId: claimId.toString(),
        status: "VERIFIED",
        verificationHash: `0x${claimId.toString(16).padStart(64, "0")}`,
        timestamp: Math.floor(Date.now() / 1000),
        message:
          "Claim verified successfully using real ZK proofs on Midnight testnet",
        txHash: "real-tx-hash", // TODO: Extract from verification result
        blockHeight: "real-block-height", // TODO: Extract from verification result
      };

      this.logger.info("Claim verified successfully with real ZK proofs", {
        claimId: result.claimId,
      });
      return result;
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to verify claim");

      // Return rejection result instead of throwing
      const result: ClaimVerificationResponse = {
        claimId: "0",
        status: "REJECTED",
        verificationHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: Math.floor(Date.now() / 1000),
        message: `Claim verification failed: ${error.message}`,
      };

      return result;
    }
  }

  /**
   * Get all claims for a wallet using REAL contract state
   */
  async getClaims(walletSeed: string): Promise<ClaimRecord[]> {
    this.logger.info("Retrieving claims from real contract state...");

    try {
      const claimApi = this.deployedApis.get(walletSeed);

      if (!claimApi) {
        this.logger.info(
          "No contract found for wallet, returning empty claims list"
        );
        return [];
      }

      // Get real claims from contract
      this.logger.info("Calling real getAllVerifiedClaims...");
      const claims = await claimApi.getAllVerifiedClaims();

      // Transform to UI format
      const claimRecords: ClaimRecord[] = claims.map((claim, index) => ({
        id: claim.claimId?.toString() || index.toString(),
        claimType: this.getClaimTypeName(claim.claimType || 0),
        amount: Number(claim.amount || 0) / 100, // Convert from cents
        status: claim.status || "VERIFIED",
        serviceDate: new Date(Number(claim.serviceDate || 0) * 1000)
          .toISOString()
          .split("T")[0],
        verificationDate: new Date(Number(claim.timestamp || Date.now()) * 1000)
          .toISOString()
          .split("T")[0],
        providerId: claim.providerId || "UNKNOWN",
        providerName: this.getProviderName(claim.providerId || "UNKNOWN"),
        verificationHash: claim.verificationHash || "0x0",
        metadata: claim.metadata || undefined,
      }));

      this.logger.info(
        `Retrieved ${claimRecords.length} claims from real contract`
      );
      return claimRecords;
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to get claims");
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get claim status using REAL contract state
   */
  async getClaimStatus(
    walletSeed: string,
    claimId: string
  ): Promise<ClaimRecord | null> {
    this.logger.info("Getting claim status from real contract...", { claimId });

    try {
      const claimApi = this.deployedApis.get(walletSeed);

      if (!claimApi) {
        return null;
      }

      // Get real claim status from contract
      const status = await claimApi.getClaimStatus(BigInt(claimId));

      if (!status) {
        return null;
      }

      // Transform to UI format
      const claimRecord: ClaimRecord = {
        id: claimId,
        claimType: this.getClaimTypeName(status.claimType || 0),
        amount: Number(status.amount || 0) / 100,
        status: status.status || ("UNKNOWN" as any),
        serviceDate: new Date(Number(status.serviceDate || 0) * 1000)
          .toISOString()
          .split("T")[0],
        verificationDate: new Date(
          Number(status.timestamp || Date.now()) * 1000
        )
          .toISOString()
          .split("T")[0],
        providerId: status.providerId || "UNKNOWN",
        providerName: this.getProviderName(status.providerId || "UNKNOWN"),
        verificationHash: status.verificationHash || "0x0",
        metadata: status.metadata || undefined,
      };

      return claimRecord;
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to get claim status");
      return null;
    }
  }

  /**
   * Get contract state using REAL infrastructure
   */
  async getContractState(
    walletSeed: string,
    contractAddress: string
  ): Promise<any> {
    this.logger.info("Getting real contract state...", { contractAddress });

    try {
      const providers = await this.createProviders(walletSeed);

      // Query real contract state
      assertIsContractAddress(contractAddress);
      const contractState =
        await providers.publicDataProvider.queryContractState(
          contractAddress as ContractAddress
        );

      return contractState;
    } catch (error) {
      this.logger.error(
        { error: error.message },
        "Failed to get contract state"
      );
      throw new Error(`Contract state query failed: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  private getClaimTypeName(claimType: number): string {
    const types = {
      0: "Medical Invoice",
      1: "Prescription Drug",
      2: "Dental Procedure",
      3: "Vision Care",
      4: "Emergency Room",
    };
    return types[claimType as keyof typeof types] || `Unknown(${claimType})`;
  }

  private getProviderName(providerId: string): string {
    const providers: Record<string, string> = {
      HOSPITAL_001: "City General Hospital",
      CLINIC_002: "Family Health Clinic",
      PHARMACY_003: "MediCare Pharmacy",
      DENTIST_004: "Smile Dental Care",
      EYE_CARE_005: "Vision Plus Center",
    };
    return providers[providerId] || providerId;
  }
}
