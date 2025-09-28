/**
 * Simple API service that provides a bridge to connect UI to CLI-like functionality
 * Uses real wallet validation and the existing ClaimAPI structure
 */
import type { Logger } from "pino";
import * as crypto from "crypto";

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

export interface WalletConnection {
  address: string;
  seed: string;
  balance?: string;
}

export interface ContractDeploymentResult {
  contractAddress: string;
  txHash: string;
  blockHeight: string;
  message: string;
}

export class SimpleAPIService {
  private walletClaims = new Map<string, ClaimRecord[]>(); // Store claims by wallet seed
  private walletContracts = new Map<string, string>(); // Store contract addresses by wallet seed

  constructor(private logger: Logger) {
    this.logger.info("SimpleAPIService initialized for UI-CLI bridge");
  }

  /**
   * Connect wallet using real validation but mock address generation
   */
  async connectWallet(seed: string): Promise<WalletConnection> {
    this.logger.info("Connecting wallet with validation...");

    const cleanSeed = seed.trim().replace(/^0x/, "");

    if (!/^[0-9a-fA-F]{64}$/.test(cleanSeed)) {
      throw new Error(
        "Invalid seed. Must be exactly 64 hexadecimal characters."
      );
    }

    // Generate deterministic address from seed
    const hash = crypto.createHash("sha256").update(cleanSeed).digest("hex");
    const walletAddress = `mn_shield-addr_test1v${hash.slice(0, 50)}`;

    this.logger.info(`Wallet connected: ${walletAddress}`);

    return {
      address: walletAddress,
      seed: cleanSeed,
      balance: "1000", // Mock balance
    };
  }

  /**
   * Generate a new wallet
   */
  async generateWallet(): Promise<WalletConnection> {
    this.logger.info("Generating new wallet...");

    const randomBytes = crypto.randomBytes(32);
    const seed = randomBytes.toString("hex");

    return this.connectWallet(seed);
  }

  /**
   * Deploy a new claim verifier contract
   */
  async deployContract(walletSeed: string): Promise<ContractDeploymentResult> {
    this.logger.info("Deploying claim verifier contract...");

    // Generate deterministic contract address
    const contractHash = crypto
      .createHash("sha256")
      .update(walletSeed + "contract")
      .digest("hex");
    const contractAddress = `0x${contractHash.slice(0, 40)}`;

    // Store contract for this wallet
    this.walletContracts.set(walletSeed, contractAddress);

    // Initialize empty claims list for this wallet
    if (!this.walletClaims.has(walletSeed)) {
      this.walletClaims.set(walletSeed, []);
    }

    const result: ContractDeploymentResult = {
      contractAddress,
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      blockHeight: Math.floor(Date.now() / 1000).toString(),
      message: "Contract deployed successfully (simulated for UI bridge)",
    };

    this.logger.info(`Contract deployed: ${contractAddress}`);
    return result;
  }

  /**
   * Join an existing claim verifier contract
   */
  async joinContract(
    walletSeed: string,
    contractAddress: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.info(`Joining existing contract: ${contractAddress}`);

    // Store contract for this wallet
    this.walletContracts.set(walletSeed, contractAddress);

    // Initialize claims list if not exists
    if (!this.walletClaims.has(walletSeed)) {
      this.walletClaims.set(walletSeed, []);
    }

    this.logger.info("Successfully joined contract");
    return {
      success: true,
      message: "Successfully joined contract (simulated for UI bridge)",
    };
  }

  /**
   * Verify a claim - simulates the CLI verification flow
   */
  async verifyClaim(
    claimData: ClaimVerificationRequest
  ): Promise<ClaimVerificationResponse> {
    this.logger.info(
      `Verifying claim: type=${claimData.claimType}, amount=${claimData.amount}, provider=${claimData.providerId}`
    );

    // Get or create claims list for this wallet
    let claims = this.walletClaims.get(claimData.walletSeed) || [];

    // Simulate verification logic (high success rate)
    const isVerified = Math.random() > 0.15;
    const claimId = (claims.length + 1).toString();

    // Create verification result
    const result: ClaimVerificationResponse = {
      claimId,
      status: isVerified ? "VERIFIED" : "REJECTED",
      verificationHash:
        "0x" +
        crypto
          .createHash("sha256")
          .update(claimId + claimData.walletSeed)
          .digest("hex"),
      timestamp: Math.floor(Date.now() / 1000),
      message: isVerified
        ? "Claim verified successfully using ZK proof simulation"
        : "Claim rejected due to validation failure",
      txHash: "0x" + crypto.randomBytes(32).toString("hex"),
      blockHeight: Math.floor(Date.now() / 1000).toString(),
    };

    // Store the claim if verified
    if (isVerified) {
      const claimRecord: ClaimRecord = {
        id: claimId,
        claimType: this.getClaimTypeName(claimData.claimType),
        amount: parseFloat(claimData.amount),
        status: "VERIFIED",
        serviceDate: claimData.serviceDate,
        verificationDate: new Date().toISOString().split("T")[0],
        providerId: claimData.providerId,
        providerName: this.getProviderName(claimData.providerId),
        verificationHash: result.verificationHash,
        metadata: claimData.metadata || undefined,
      };

      claims.push(claimRecord);
      this.walletClaims.set(claimData.walletSeed, claims);
    }

    this.logger.info(
      `Claim verification completed: ${claimId} - ${result.status}`
    );
    return result;
  }

  /**
   * Get all claims for a wallet
   */
  async getClaims(walletSeed: string): Promise<ClaimRecord[]> {
    this.logger.info(
      `Retrieving claims for wallet: ${walletSeed.slice(0, 8)}...`
    );

    const claims = this.walletClaims.get(walletSeed) || [];

    this.logger.info(`Retrieved ${claims.length} claims`);
    return claims;
  }

  /**
   * Get claim status by ID
   */
  async getClaimStatus(
    walletSeed: string,
    claimId: string
  ): Promise<ClaimRecord | null> {
    this.logger.info(`Getting claim status: ${claimId}`);

    const claims = this.walletClaims.get(walletSeed) || [];
    const claim = claims.find((c) => c.id === claimId);

    return claim || null;
  }

  /**
   * Get contract state
   */
  async getContractState(
    walletSeed: string,
    contractAddress: string
  ): Promise<any> {
    this.logger.info(`Getting contract state: ${contractAddress}`);

    const claims = this.walletClaims.get(walletSeed) || [];

    return {
      contractAddress,
      totalClaims: claims.length,
      verifiedClaims: claims.filter((c) => c.status === "VERIFIED").length,
      rejectedClaims: claims.filter((c) => c.status === "REJECTED").length,
      lastActivity:
        claims.length > 0 ? claims[claims.length - 1].verificationDate : null,
    };
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
