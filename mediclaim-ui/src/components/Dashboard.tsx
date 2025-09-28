import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { claimAPI, type ClaimRecord } from '../lib/claim-api';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
  TrendingUp,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface DashboardProps {
  walletAddress: string;
}

// ClaimRecord interface is now imported from claim-api

interface DashboardStats {
  totalClaims: number;
  verifiedClaims: number;
  rejectedClaims: number;
  pendingClaims: number;
  totalAmount: number;
  verifiedAmount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ walletAddress }) => {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<ClaimRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClaims: 0,
    verifiedClaims: 0,
    rejectedClaims: 0,
    pendingClaims: 0,
    totalAmount: 0,
    verifiedAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data for demonstration
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
    {
      id: '1003',
      claimType: 'Medical Invoice',
      amount: 3200.0,
      status: 'PENDING',
      serviceDate: '2025-09-25',
      verificationDate: '2025-09-28',
      providerId: 'HOSPITAL_001',
      providerName: 'City General Hospital',
      verificationHash: '0xpending...',
      metadata: 'Emergency room visit',
    },
    {
      id: '1004',
      claimType: 'Vision Care',
      amount: 450.0,
      status: 'REJECTED',
      serviceDate: '2025-09-10',
      verificationDate: '2025-09-28',
      providerId: 'EYE_CARE_005',
      providerName: 'Vision Plus Center',
      verificationHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      metadata: 'Annual eye exam',
    },
  ];

  useEffect(() => {
    loadClaims();
  }, [walletAddress]);

  useEffect(() => {
    filterClaims();
  }, [claims, searchTerm, statusFilter]);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      // Use the real claim API to load claims
      const claimsData = await claimAPI.getClaims();
      setClaims(claimsData);

      // Calculate stats
      const totalClaims = claimsData.length;
      const verifiedClaims = claimsData.filter((c) => c.status === 'VERIFIED').length;
      const rejectedClaims = claimsData.filter((c) => c.status === 'REJECTED').length;
      const pendingClaims = claimsData.filter((c) => c.status === 'PENDING').length;
      const totalAmount = claimsData.reduce((sum, c) => sum + c.amount, 0);
      const verifiedAmount = claimsData.filter((c) => c.status === 'VERIFIED').reduce((sum, c) => sum + c.amount, 0);

      setStats({
        totalClaims,
        verifiedClaims,
        rejectedClaims,
        pendingClaims,
        totalAmount,
        verifiedAmount,
      });
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = claims;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (claim) =>
          claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.claimType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.providerName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((claim) => claim.status === statusFilter);
    }

    setFilteredClaims(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <RefreshCw className="h-10 w-10 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Loading Dashboard</h3>
            <p className="text-gray-300">Fetching your claim history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Claims Dashboard</h1>
          <p className="text-gray-300 text-lg">Monitor your verified claims and verification history</p>
        </div>

        {/* Connected Wallet Info */}
        <Card className="mb-8 bg-green-500/10 border border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-green-400 font-medium">Connected Wallet</p>
                  <p className="text-green-300 font-mono text-sm">
                    {walletAddress.slice(0, 20)}...{walletAddress.slice(-10)}
                  </p>
                </div>
              </div>
              <Button
                onClick={loadClaims}
                variant="outline"
                size="sm"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Claims</p>
                  <p className="text-2xl font-bold text-white">{stats.totalClaims}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Verified</p>
                  <p className="text-2xl font-bold text-green-400">{stats.verifiedClaims}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalClaims ? Math.round((stats.verifiedClaims / stats.totalClaims) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Verified Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.verifiedAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search claims by ID, type, or provider..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'VERIFIED', 'PENDING', 'REJECTED'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'border-white/20 text-white hover:bg-white/10'
                    }
                  >
                    {status === 'all' ? 'All' : status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Claim History
            </CardTitle>
            <CardDescription className="text-gray-400">Your verified and pending insurance claims</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClaims.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Claims Found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No claims match your current filters.'
                    : "You haven't submitted any claims yet."}
                </p>
                <Button
                  onClick={() => (window.location.href = '/verify')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Your First Claim
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">Claim #{claim.id}</h3>
                          <Badge className={`border ${getStatusColor(claim.status)}`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(claim.status)}
                              {claim.status}
                            </div>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Type</p>
                            <p className="text-white font-medium">{claim.claimType}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Amount</p>
                            <p className="text-white font-medium">{formatCurrency(claim.amount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Provider</p>
                            <p className="text-white font-medium">{claim.providerName}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Service Date</p>
                            <p className="text-white">{new Date(claim.serviceDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Verified Date</p>
                            <p className="text-white">{new Date(claim.verificationDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Verification Hash</p>
                            <p className="text-white font-mono text-xs">
                              {claim.verificationHash.slice(0, 10)}...{claim.verificationHash.slice(-6)}
                            </p>
                          </div>
                        </div>
                        {claim.metadata && (
                          <div className="mt-3">
                            <p className="text-gray-400 text-sm">Notes</p>
                            <p className="text-white text-sm">{claim.metadata}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
