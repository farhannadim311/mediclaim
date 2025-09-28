import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { claimAPI } from '../lib/claim-api';
import { Wallet, Shield, Key, CheckCircle, AlertCircle, ArrowRight, Copy, LogOut } from 'lucide-react';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  walletAddress?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  isConnected = false,
  walletAddress = '',
}) => {
  const [seedInput, setSeedInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSeedInput, setShowSeedInput] = useState(false);

  // Sample wallet seed for demo
  const DEMO_SEED = 'e79a51ccd0a7360d78dc3cb7741033156ed49d1f25b0f775511e063303acb858';
  const DEMO_ADDRESS = 'mn_shield-addr_test1vdzsujwh7vlmyg4yyt8cep9ljqnq27kmn83kq7mnj4p29d9r8ggqxq';

  const validateSeed = (seed: string): boolean => {
    const cleanSeed = seed.trim().replace(/^0x/, '');
    return /^[0-9a-fA-F]{64}$/.test(cleanSeed);
  };

  const handleConnect = async () => {
    if (!showSeedInput) {
      setShowSeedInput(true);
      return;
    }

    const cleanSeed = seedInput.trim().replace(/^0x/, '');

    if (!validateSeed(seedInput)) {
      setError('Invalid seed. Must be exactly 64 hexadecimal characters.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Use the real claim API to connect wallet
      const walletConnection = await claimAPI.connectWallet(cleanSeed);

      setSuccess('Wallet connected successfully with real infrastructure!');
      setTimeout(() => {
        onConnect(walletConnection.address);
      }, 1000);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateWallet = async () => {
    setIsConnecting(true);
    setError('');

    try {
      // Generate a real wallet using the API
      const walletConnection = await claimAPI.generateWallet();
      setSeedInput(walletConnection.seed);
      setSuccess('Real wallet generated! Click Connect Wallet to proceed.');
    } catch (err) {
      setError('Failed to generate wallet. Please try again.');
      // Fallback to demo seed
      setSeedInput(DEMO_SEED);
      setSuccess('Demo wallet seed generated! Click Connect Wallet to proceed.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleDisconnect = () => {
    setSeedInput('');
    setShowSeedInput(false);
    setError('');
    setSuccess('');
    onDisconnect?.();
  };

  if (isConnected && walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Wallet Connected</h1>
            <p className="text-gray-300 text-lg">Your Midnight Network wallet is ready for claim verification</p>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm text-green-400 font-medium">Connected Wallet</p>
                      <p className="text-green-300 font-mono text-sm">
                        {walletAddress.slice(0, 20)}...{walletAddress.slice(-10)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(walletAddress)}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Secure Connection</p>
                    <p className="text-gray-400 text-sm">Zero-knowledge ready</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <Key className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Private Keys</p>
                    <p className="text-gray-400 text-sm">Locally stored</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
          <p className="text-gray-300 text-lg">Connect your Midnight Network wallet to start verifying claims</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription className="text-gray-400">
              {showSeedInput
                ? 'Enter your 64-character wallet seed to connect'
                : 'Generate a demo wallet or connect with existing seed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showSeedInput ? (
              <div className="space-y-4">
                <Button
                  onClick={handleGenerateWallet}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                >
                  Generate Demo Wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-center">
                  <span className="text-gray-400 text-sm">or</span>
                </div>

                <Button
                  onClick={() => setShowSeedInput(true)}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 py-3"
                >
                  Connect Existing Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seed" className="text-white">
                    Wallet Seed
                  </Label>
                  <Input
                    id="seed"
                    type="password"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                    placeholder="Enter your 64-character hex seed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Must be exactly 64 hexadecimal characters (0-9, a-f)</p>
                </div>

                {seedInput && (
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {validateSeed(seedInput) ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">Valid seed format</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <span className="text-sm text-red-400">Invalid seed format</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !validateSeed(seedInput)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                >
                  {isConnecting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>

                <Button
                  onClick={() => setShowSeedInput(false)}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
              </div>
            )}

            {error && (
              <Alert className="bg-red-900/20 border-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-900/20 border-green-500">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Your seed never leaves your device and is used to generate wallet addresses securely.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletConnect;
