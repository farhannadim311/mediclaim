/**
 * Real API integration for the ZK Claim Verifier
 * This connects the UI to the real CLI backend via API bridge
 */

export interface ClaimSubmissionRequest {
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
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
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
  balance?: string;
}

export interface ContractDeploymentResult {
  contractAddress: string;
  txHash: string;
  blockHeight: string;
  message: string;
}

/**
 * RealClaimAPI class that connects to the API bridge for real infrastructure
 */
export class RealClaimAPI {
  private baseUrl: string;
  private walletSeed: string | null = null;
  private contractAddress: string | null = null;
  private sessionToken: string | null = null;
  private sessionExpiry: number | null = null;
  private walletAddress: string | null = null;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Connect wallet using seed - calls real Midnight Network infrastructure
   */
  async connectWallet(seed: string): Promise<WalletConnection> {
    const response = await fetch(`${this.baseUrl}/api/wallet/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ seed }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect wallet');
    }

    const result = await response.json();
    this.walletSeed = result.seed;
    this.walletAddress = result.address;
    return result;
  }

  /**
   * Generate a new wallet with real infrastructure
   */
  async generateWallet(): Promise<WalletConnection> {
    const response = await fetch(`${this.baseUrl}/api/wallet/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate wallet');
    }

    const result = await response.json();
    this.walletSeed = result.seed;
    this.walletAddress = result.address;
    return result;
  }

  /**
   * Deploy a new claim verifier contract using real infrastructure
   */
  async deployContract(): Promise<ContractDeploymentResult> {
    if (!this.walletSeed && !this.isSessionValid()) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    const response = await fetch(`${this.baseUrl}/api/contract/deploy`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ walletSeed: this.walletSeed || this.walletAddress }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deploy contract');
    }

    const result = await response.json();
    this.contractAddress = result.contractAddress;
    return result;
  }

  /**
   * Join an existing claim verifier contract
   */
  async joinContract(contractAddress: string): Promise<{ success: boolean; message: string }> {
    if (!this.walletSeed && !this.isSessionValid()) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    const response = await fetch(`${this.baseUrl}/api/contract/join`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        walletSeed: this.walletSeed || this.walletAddress,
        contractAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join contract');
    }

    const result = await response.json();
    this.contractAddress = contractAddress;
    return result;
  }

  /**
   * Submit a claim for verification using real ZK proofs
   */
  async verifyClaim(claimData: Omit<ClaimSubmissionRequest, 'walletSeed'>): Promise<ClaimVerificationResponse> {
    if (!this.walletSeed && !this.isSessionValid()) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    const requestData: ClaimSubmissionRequest = {
      ...claimData,
      walletSeed: this.walletSeed || this.walletAddress,
    };

    const response = await fetch(`${this.baseUrl}/api/claims/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify claim');
    }

    return await response.json();
  }

  /**
   * Get all claims for the connected wallet
   */
  async getClaims(): Promise<ClaimRecord[]> {
    if (!this.walletSeed && !this.isSessionValid()) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    const response = await fetch(`${this.baseUrl}/api/claims/${this.walletSeed || this.walletAddress}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get claims');
    }

    return await response.json();
  }

  /**
   * Get claim status by ID
   */
  async getClaimStatus(claimId: string): Promise<ClaimRecord | null> {
    if (!this.walletSeed && !this.isSessionValid()) {
      throw new Error('Wallet not connected. Please connect wallet first.');
    }

    const response = await fetch(`${this.baseUrl}/api/claims/${this.walletSeed || this.walletAddress}/${claimId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get claim status');
    }

    return await response.json();
  }

  /**
   * Get contract state
   */
  async getContractState(): Promise<any> {
    if ((!this.walletSeed && !this.isSessionValid()) || !this.contractAddress) {
      throw new Error('Wallet not connected or contract not deployed/joined.');
    }

    const response = await fetch(
      `${this.baseUrl}/api/contract/${this.walletSeed || this.walletAddress}/${this.contractAddress}/state`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get contract state');
    }

    return await response.json();
  }

  /**
   * Check API bridge health
   */
  async checkHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('API bridge is not accessible');
    }

    return await response.json();
  }

  /**
   * Authenticate with Lace wallet session
   */
  async authenticateWithLace(address: string, sessionToken: string, expiresAt: number): Promise<void> {
    this.walletAddress = address;
    this.sessionToken = sessionToken;
    this.sessionExpiry = expiresAt;
    // Clear seed-based auth when using Lace
    this.walletSeed = null;
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    return !!(this.sessionToken && this.sessionExpiry && Date.now() < this.sessionExpiry);
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionToken && this.isSessionValid()) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return headers;
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): {
    seed: string | null;
    contractAddress: string | null;
    address: string | null;
    sessionToken: string | null;
  } {
    return {
      seed: this.walletSeed,
      contractAddress: this.contractAddress,
      address: this.walletAddress,
      sessionToken: this.sessionToken,
    };
  }

  /**
   * Reset connection state
   */
  disconnect(): void {
    this.walletSeed = null;
    this.contractAddress = null;
    this.walletAddress = null;
    this.sessionToken = null;
    this.sessionExpiry = null;
  }
}

// Export a singleton instance
export const realClaimAPI = new RealClaimAPI();
