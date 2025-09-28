import type { DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';

declare global {
  interface Window {
    midnight?: {
      [key: string]: DAppConnectorAPI;
    };
  }
}

export interface LaceWalletConnection {
  address: string;
  isConnected: boolean;
  wallet?: DAppConnectorAPI;
}

export interface AuthChallenge {
  nonce: string;
  expiresAt: number;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
  address: string;
}

export class LaceWalletService {
  private wallet: DAppConnectorAPI | null = null;
  private isConnected = false;
  private currentAddress = '';

  /**
   * Check if Lace wallet extension is available
   */
  isAvailable(): boolean {
    return !!window.midnight?.mnLace;
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): LaceWalletConnection {
    return {
      address: this.currentAddress,
      isConnected: this.isConnected,
      wallet: this.wallet || undefined,
    };
  }

  /**
   * Connect to Lace wallet and request access
   */
  async connect(): Promise<LaceWalletConnection> {
    if (!this.isAvailable()) {
      throw new Error('Lace wallet extension not found. Please install the Lace wallet extension.');
    }

    try {
      const laceConnector = window.midnight!.mnLace;

      // Check if already enabled
      const isEnabled = await laceConnector.isEnabled();

      let walletAPI;
      if (isEnabled) {
        walletAPI = await laceConnector.enable();
      } else {
        // Request permission from user
        walletAPI = await laceConnector.enable();
      }

      // Get wallet state to extract address
      const walletState = await walletAPI.state();

      this.wallet = laceConnector;
      this.isConnected = true;
      this.currentAddress = walletState.address;

      console.log('Lace wallet connected:', {
        address: this.currentAddress,
        coinPublicKey: walletState.coinPublicKey,
      });

      return this.getConnectionStatus();
    } catch (error) {
      console.error('Failed to connect to Lace wallet:', error);
      throw new Error('Failed to connect to Lace wallet. Please check your extension and try again.');
    }
  }

  /**
   * Disconnect from Lace wallet
   */
  disconnect(): void {
    this.wallet = null;
    this.isConnected = false;
    this.currentAddress = '';
  }

  /**
   * Request authentication challenge from API bridge
   */
  async requestChallenge(apiBaseUrl: string): Promise<AuthChallenge> {
    if (!this.isConnected || !this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(`${apiBaseUrl}/api/auth/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: this.currentAddress,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to request authentication challenge');
    }

    return response.json();
  }

  /**
   * Sign a message (challenge nonce) using Lace wallet
   * Note: This is a placeholder as Lace wallet may not expose signing APIs yet
   */
  async signChallenge(nonce: string): Promise<string | null> {
    if (!this.isConnected || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // TODO: Implement actual message signing when Lace wallet exposes this API
      // For now, we'll return null to indicate no signature available
      console.warn('Lace wallet message signing not yet available, proceeding without signature');
      return null;
    } catch (error) {
      console.error('Failed to sign challenge:', error);
      return null;
    }
  }

  /**
   * Complete authentication flow with API bridge
   */
  async authenticate(apiBaseUrl: string): Promise<AuthSession> {
    if (!this.isConnected || !this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    // Step 1: Request challenge
    const challenge = await this.requestChallenge(apiBaseUrl);

    // Step 2: Sign challenge (optional for now)
    const signature = await this.signChallenge(challenge.nonce);

    // Step 3: Verify challenge with API bridge
    const response = await fetch(`${apiBaseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: this.currentAddress,
        signature: signature,
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const result = await response.json();
    return result.session;
  }

  /**
   * Logout from authenticated session
   */
  async logout(apiBaseUrl: string, sessionToken: string): Promise<void> {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: sessionToken,
      }),
    });
  }
}

// Singleton instance
export const laceWalletService = new LaceWalletService();
