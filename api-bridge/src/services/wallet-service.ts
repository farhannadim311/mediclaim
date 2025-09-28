import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import * as crypto from "crypto";
import type { Logger } from "pino";

export interface WalletConnection {
  address: string;
  seed: string;
  balance?: string;
}

export class WalletService {
  constructor(private logger: Logger) {}

  /**
   * Connect wallet using a seed phrase - Uses REAL Midnight Network wallet
   */
  async connectWallet(seed: string): Promise<WalletConnection> {
    this.logger.info("Connecting wallet with real Midnight infrastructure...");

    try {
      // Clean and validate seed
      const cleanSeed = seed.trim().replace(/^0x/, "");

      if (!/^[0-9a-fA-F]{64}$/.test(cleanSeed)) {
        throw new Error(
          "Invalid seed. Must be exactly 64 hexadecimal characters."
        );
      }

      this.logger.info("Building wallet from seed...");

      // Use REAL Midnight Network wallet builder
      const walletAndMidnightProvider = await WalletBuilder.buildFromSeed(
        cleanSeed,
        "https://rpc.testnet.midnight.network", // Real testnet RPC
        1000 // funding amount
      );

      const wallet = walletAndMidnightProvider.wallet;

      // Get real wallet address
      const walletAddress = wallet.address();
      this.logger.info(`Real wallet connected: ${walletAddress}`);

      // Get real balance
      let balance = "0";
      try {
        const balanceInfo = await wallet.balance();
        balance = balanceInfo.toString();
        this.logger.info(`Wallet balance: ${balance}`);
      } catch (balanceError) {
        this.logger.warn("Could not fetch balance, using 0");
      }

      return {
        address: walletAddress,
        seed: cleanSeed,
        balance,
      };
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to connect wallet");
      throw new Error(`Wallet connection failed: ${error.message}`);
    }
  }

  /**
   * Generate a new wallet with random seed - Uses REAL Midnight Network wallet
   */
  async generateWallet(): Promise<WalletConnection> {
    this.logger.info(
      "Generating new wallet with real Midnight infrastructure..."
    );

    try {
      // Generate cryptographically secure random seed
      const randomBytes = crypto.randomBytes(32);
      const seed = toHex(randomBytes).replace(/^0x/, ""); // Remove 0x prefix

      this.logger.info("Generated new random seed, building wallet...");

      // Use REAL Midnight Network wallet builder
      const walletAndMidnightProvider = await WalletBuilder.buildFromSeed(
        seed,
        "https://rpc.testnet.midnight.network", // Real testnet RPC
        1000 // funding amount
      );

      const wallet = walletAndMidnightProvider.wallet;

      // Get real wallet address
      const walletAddress = wallet.address();
      this.logger.info(`New real wallet generated: ${walletAddress}`);

      // Get real balance
      let balance = "0";
      try {
        const balanceInfo = await wallet.balance();
        balance = balanceInfo.toString();
        this.logger.info(`New wallet balance: ${balance}`);
      } catch (balanceError) {
        this.logger.warn("Could not fetch balance for new wallet, using 0");
      }

      return {
        address: walletAddress,
        seed: seed,
        balance,
      };
    } catch (error) {
      this.logger.error({ error: error.message }, "Failed to generate wallet");
      throw new Error(`Wallet generation failed: ${error.message}`);
    }
  }

  /**
   * Validate seed format
   */
  validateSeed(seed: string): boolean {
    const cleanSeed = seed.trim().replace(/^0x/, "");
    return /^[0-9a-fA-F]{64}$/.test(cleanSeed);
  }

  /**
   * Get wallet balance for a given seed
   */
  async getWalletBalance(seed: string): Promise<string> {
    this.logger.info("Getting wallet balance...");

    try {
      const cleanSeed = seed.trim().replace(/^0x/, "");

      if (!this.validateSeed(seed)) {
        throw new Error("Invalid seed format");
      }

      const walletAndMidnightProvider = await WalletBuilder.buildFromSeed(
        cleanSeed,
        "https://rpc.testnet.midnight.network",
        0 // Don't fund when just checking balance
      );

      const wallet = walletAndMidnightProvider.wallet;
      const balance = await wallet.balance();

      return balance.toString();
    } catch (error) {
      this.logger.error(
        { error: error.message },
        "Failed to get wallet balance"
      );
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }
}
