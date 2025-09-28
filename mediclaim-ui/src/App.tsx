import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import ClaimVerifier from './components/ClaimVerifier';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import { Shield, Home, FileText, Wallet, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/verify', label: 'Verify Claims', icon: Shield },
    { path: '/dashboard', label: 'Dashboard', icon: FileText },
    { path: '/wallet', label: 'Wallet', icon: Wallet },
  ];

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
    navigate('/verify');
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress('');
    navigate('/');
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">MediClaim ZK</h1>
                <p className="text-xs text-gray-400">Zero-Knowledge Claims</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Wallet Status & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {isWalletConnected && (
                <div className="hidden sm:flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-400 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg bg-white/10 text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-lg">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              {isWalletConnected && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="text-xs text-green-400">Connected Wallet</p>
                      <p className="text-sm text-green-400 font-mono">
                        {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/verify"
            element={
              isWalletConnected ? (
                <ClaimVerifier walletAddress={walletAddress} />
              ) : (
                <WalletConnect onConnect={handleWalletConnect} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isWalletConnected ? (
                <Dashboard walletAddress={walletAddress} />
              ) : (
                <WalletConnect onConnect={handleWalletConnect} />
              )
            }
          />
          <Route
            path="/wallet"
            element={
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                isConnected={isWalletConnected}
                walletAddress={walletAddress}
              />
            }
          />
        </Routes>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default App;
