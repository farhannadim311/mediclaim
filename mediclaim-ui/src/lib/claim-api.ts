/**
 * API integration for the ZK Claim Verifier
 * This connects the UI to the working CLI backend
 */

export interface ClaimSubmissionRequest {
  claimType: number;
  amount: string;
  serviceDate: string;
  providerId: string;
  patientId: string;
  description: string;
  metadata: string;
  walletAddress: string;
}

export interface ClaimVerificationResponse {
  claimId: string;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
  verificationHash: string;
  timestamp: number;
  message: string;
}

export interface ClaimRecord {
  id: string;
  claimType: string;
  amount: number;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
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
}

/**
 * ClaimAPI class that interfaces with the working CLI backend
 * Currently uses mock data but structured to easily connect to real backend
 */
export class ClaimAPI {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Connect wallet using seed - mimics CLI wallet connection
   */
  async connectWallet(seed: string): Promise<WalletConnection> {
    // TODO: Replace with actual call to CLI API when available
    // For now, simulate the wallet connection logic from the CLI

    const cleanSeed = seed.trim().replace(/^0x/, '');

    if (!/^[0-9a-fA-F]{64}$/.test(cleanSeed)) {
      throw new Error('Invalid seed. Must be exactly 64 hexadecimal characters.');
    }

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock address generation (in real implementation, this would come from wallet API)
    const mockAddress = `mn_shield-addr_test1v${cleanSeed.slice(0, 8)}...${cleanSeed.slice(-8)}`;

    return {
      address: mockAddress,
      seed: cleanSeed,
    };
  }

  /**
   * Deploy a new claim verifier contract
   */
  async deployContract(walletAddress: string): Promise<{ contractAddress: string }> {
    // TODO: Replace with actual CLI deployment API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockContractAddress = `0x${Array(40)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')}`;

    return {
      contractAddress: mockContractAddress,
    };
  }

  /**
   * Join an existing claim verifier contract
   */
  async joinContract(walletAddress: string, contractAddress: string): Promise<{ success: boolean }> {
    // TODO: Replace with actual CLI join API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true };
  }

  /**
   * Submit a claim for verification
   */
  async verifyClaim(claimData: ClaimSubmissionRequest): Promise<ClaimVerificationResponse> {
    // TODO: Replace with actual API call to CLI backend
    // This should call the working CLI verification logic

    try {
      // Simulate the verification process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock verification result with high success rate
      const isVerified = Math.random() > 0.2;

      const result: ClaimVerificationResponse = {
        claimId: Math.floor(Math.random() * 1000000).toString(),
        status: isVerified ? 'VERIFIED' : 'REJECTED',
        verificationHash:
          '0x' +
          Array(64)
            .fill(0)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join(''),
        timestamp: Math.floor(Date.now() / 1000),
        message: isVerified
          ? 'Claim verified successfully using zero-knowledge proof'
          : 'Claim rejected due to policy verification failure',
      };

      return result;
    } catch (error) {
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all claims for a wallet
   */
  async getClaims(walletAddress: string): Promise<ClaimRecord[]> {
    // TODO: Replace with actual API call to CLI backend
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data - in real implementation, this would come from the CLI's state management
    const mockClaims: ClaimRecord[] = [
      {
        id: '1001',
        claimType: 'Dental Procedure',
        amount: 1500.0,
        status: 'VERIFIED',
        serviceDate: '2025-09-15',
        verificationDate: '2025-09-28',
        providerId: 'DENTIST_004',
        providerName: 'Smile Dental Care',
        verificationHash: '0x742d35cc6e8c2b3e2f4c1234567890abcdef1234567890abcdef1234567890ab',
        metadata: 'Root canal procedure',
      },
      {
        id: '1002',
        claimType: 'Prescription Drug',
        amount: 250.5,
        status: 'VERIFIED',
        serviceDate: '2025-09-20',
        verificationDate: '2025-09-28',
        providerId: 'PHARMACY_003',
        providerName: 'MediCare Pharmacy',
        verificationHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        metadata: 'Prescription medication',
      },
    ];

    return mockClaims;
  }

  /**
   * Get claim status by ID
   */
  async getClaimStatus(claimId: string): Promise<ClaimRecord | null> {
    // TODO: Replace with actual API call
    const claims = await this.getClaims('');
    return claims.find((claim) => claim.id === claimId) || null;
  }
}

// Import and export the real API
import { realClaimAPI } from './claim-api-real.js';

// Export a singleton instance that uses REAL infrastructure
export const claimAPI = realClaimAPI;
