import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './Landing';
import WalletConnect from './WalletConnect';
import ClaimVerifier from './ClaimVerifier';
import Dashboard from './Dashboard';
import SplashScreen from './SplashScreen';

const App: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = (address: string) => {
    setWalletAddress(address);
    setIsConnected(true);
    navigate('/dashboard');
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    navigate('/');
  };

  if (showSplash) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white">
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/wallet"
            element={
              <WalletConnect onConnect={handleConnect} isConnected={isConnected} walletAddress={walletAddress || ''} />
            }
          />
          <Route
            path="/verify"
            element={
              isConnected && walletAddress ? (
                <ClaimVerifier walletAddress={walletAddress} />
              ) : (
                <WalletConnect
                  onConnect={handleConnect}
                  isConnected={isConnected}
                  walletAddress={walletAddress || ''}
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isConnected && walletAddress ? (
                <Dashboard walletAddress={walletAddress} />
              ) : (
                <WalletConnect
                  onConnect={handleConnect}
                  isConnected={isConnected}
                  walletAddress={walletAddress || ''}
                />
              )
            }
          />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
