import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  DollarSign,
  Calendar,
  Shield,
  Bell,
  Eye,
  Download,
  Search,
  Filter,
  Signature,
  AlertTriangle,
  CheckSquare,
  XSquare
} from 'lucide-react';

interface Claim {
  id: string;
  claimType: string;
  amount: number;
  serviceDate: string;
  providerName: string;
  patientName: string;
  patientId: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PROVIDER_REVIEW' | 'INSURANCE_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  providerApprovedAt?: string;
  insuranceApprovedAt?: string;
  rejectionReason?: string;
  documents: Document[];
  verificationHash?: string;
  providerSignature?: {
    r8x: string;
    r8y: string;
    s: string;
  };
  providerPublicKey?: {
    x: string;
    y: string;
  };
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialties: string[];
  isVerified: boolean;
  publicKey: {
    x: string;
    y: string;
  };
}

const CLAIM_TYPES = [
  { value: 'MEDICAL_INVOICE', label: 'Medical Invoice', maxAmount: 1000, icon: '🏥' },
  { value: 'PRESCRIPTION_DRUG', label: 'Prescription Drug', maxAmount: 500, icon: '💊' },
  { value: 'DENTAL_PROCEDURE', label: 'Dental Procedure', maxAmount: 2000, icon: '🦷' },
  { value: 'VISION_CARE', label: 'Vision Care', maxAmount: 1500, icon: '👁️' },
  { value: 'EMERGENCY_ROOM', label: 'Emergency Room', maxAmount: 5000, icon: '🚨' }
];

interface ProviderDashboardProps {
  onBack?: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<ProviderProfile>({
    id: 'PROVIDER_001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@citygeneral.com',
    phone: '+1 (555) 234-5678',
    licenseNumber: 'MD-12345',
    specialties: ['Internal Medicine', 'Emergency Medicine'],
    isVerified: true,
    publicKey: {
      x: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      y: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
    }
  });

  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 'CLM-001',
      claimType: 'MEDICAL_INVOICE',
      amount: 750.00,
      serviceDate: '2024-01-15',
      providerName: 'City General Hospital',
      patientName: 'John Doe',
      patientId: 'PATIENT_001',
      description: 'Annual physical examination',
      status: 'PROVIDER_REVIEW',
      submittedAt: '2024-01-16T10:30:00Z',
      documents: [
        { id: 'DOC-001', name: 'Medical Invoice.pdf', type: 'application/pdf', size: 245760, uploadedAt: '2024-01-16T10:30:00Z', url: '/documents/medical-invoice.pdf' },
        { id: 'DOC-002', name: 'Doctor Report.pdf', type: 'application/pdf', size: 189440, uploadedAt: '2024-01-16T10:32:00Z', url: '/documents/doctor-report.pdf' }
      ],
      providerSignature: {
        r8x: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
        r8y: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        s: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd'
      },
      providerPublicKey: {
        x: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        y: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
      }
    },
    {
      id: 'CLM-002',
      claimType: 'PRESCRIPTION_DRUG',
      amount: 125.50,
      serviceDate: '2024-01-20',
      providerName: 'MediCare Pharmacy',
      patientName: 'Jane Smith',
      patientId: 'PATIENT_002',
      description: 'Blood pressure medication - 30 day supply',
      status: 'INSURANCE_REVIEW',
      submittedAt: '2024-01-21T08:45:00Z',
      providerApprovedAt: '2024-01-21T09:15:00Z',
      documents: [
        { id: 'DOC-003', name: 'Prescription Receipt.pdf', type: 'application/pdf', size: 156720, uploadedAt: '2024-01-21T08:45:00Z', url: '/documents/prescription-receipt.pdf' }
      ],
      providerSignature: {
        r8x: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        r8y: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        s: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678'
      },
      providerPublicKey: {
        x: '0x90abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        y: '0x0abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a'
      }
    },
    {
      id: 'CLM-003',
      claimType: 'DENTAL_PROCEDURE',
      amount: 450.00,
      serviceDate: '2024-01-25',
      providerName: 'Smile Dental Care',
      patientName: 'Bob Johnson',
      patientId: 'PATIENT_003',
      description: 'Dental cleaning and examination',
      status: 'PROVIDER_REVIEW',
      submittedAt: '2024-01-26T11:20:00Z',
      documents: [
        { id: 'DOC-004', name: 'Dental Invoice.pdf', type: 'application/pdf', size: 198340, uploadedAt: '2024-01-26T11:20:00Z', url: '/documents/dental-invoice.pdf' }
      ]
    }
  ]);

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-001',
      type: 'info',
      title: 'New Claim Submitted',
      message: 'A new medical invoice claim (CLM-001) has been submitted for your review.',
      timestamp: '2024-01-16T10:30:00Z',
      isRead: false
    },
    {
      id: 'NOTIF-002',
      type: 'success',
      title: 'Claim Approved',
      message: 'Your approval for prescription drug claim (CLM-002) has been processed.',
      timestamp: '2024-01-21T09:15:00Z',
      isRead: false
    },
    {
      id: 'NOTIF-003',
      type: 'warning',
      title: 'Claim Requires Review',
      message: 'Dental procedure claim (CLM-003) is awaiting your signature and approval.',
      timestamp: '2024-01-26T11:20:00Z',
      isRead: true
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500';
      case 'SUBMITTED': return 'bg-blue-500';
      case 'PROVIDER_REVIEW': return 'bg-yellow-500';
      case 'INSURANCE_REVIEW': return 'bg-orange-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4" />;
      case 'SUBMITTED': return <Clock className="h-4 w-4" />;
      case 'PROVIDER_REVIEW': return <User className="h-4 w-4" />;
      case 'INSURANCE_REVIEW': return <Building2 className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveClaim = async (claimId: string) => {
    setIsProcessing(true);
    
    // Simulate API call for approval
    await new Promise(resolve => setTimeout(resolve, 2000));

    setClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { 
            ...claim, 
            status: 'INSURANCE_REVIEW' as const,
            providerApprovedAt: new Date().toISOString(),
            providerSignature: {
              r8x: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
              r8y: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
              s: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
            },
            providerPublicKey: profile.publicKey
          }
        : claim
    ));

    setSelectedClaim(null);
    setReviewComment('');
    setIsProcessing(false);

    // Add notification
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: 'success',
      title: 'Claim Approved',
      message: `You have approved claim ${claimId} and it has been forwarded to insurance for review.`,
      timestamp: new Date().toISOString(),
      isRead: false
    }, ...prev]);
  };

  const handleRejectClaim = async (claimId: string, reason: string) => {
    setIsProcessing(true);
    
    // Simulate API call for rejection
    await new Promise(resolve => setTimeout(resolve, 2000));

    setClaims(prev => prev.map(claim => 
      claim.id === claimId 
        ? { 
            ...claim, 
            status: 'REJECTED' as const,
            rejectionReason: reason
          }
        : claim
    ));

    setSelectedClaim(null);
    setReviewComment('');
    setIsProcessing(false);

    // Add notification
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: 'warning',
      title: 'Claim Rejected',
      message: `You have rejected claim ${claimId}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
      isRead: false
    }, ...prev]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const pendingClaims = claims.filter(c => c.status === 'PROVIDER_REVIEW').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold">Provider Portal</h1>
                <p className="text-gray-400">Healthcare provider claim management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  ← Back to Roles
                </Button>
              )}
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{profile.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="claims">Claims Review</TabsTrigger>
            <TabsTrigger value="approved">Approved Claims</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Claims</p>
                      <p className="text-2xl font-bold text-white">{claims.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Pending Review</p>
                      <p className="text-2xl font-bold text-yellow-400">{pendingClaims}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Approved Today</p>
                      <p className="text-2xl font-bold text-green-400">
                        {claims.filter(c => c.providerApprovedAt && new Date(c.providerApprovedAt).toDateString() === new Date().toDateString()).length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Rejected Today</p>
                      <p className="text-2xl font-bold text-red-400">
                        {claims.filter(c => c.status === 'REJECTED' && c.rejectionReason).length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {claims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(claim.status)}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{claim.patientName}</p>
                            <p className="text-xs text-gray-400">{claim.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{formatCurrency(claim.amount)}</p>
                          <Badge className={`${getStatusColor(claim.status)} text-xs`}>
                            {claim.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Provider Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{profile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">License:</span>
                      <span className="text-white">{profile.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Specialties:</span>
                      <span className="text-white">{profile.specialties.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Public Key:</span>
                      <span className="text-white font-mono text-xs">
                        {profile.publicKey.x.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Claims Review Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Claims Awaiting Review</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and approve or reject submitted claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search claims by patient name, ID, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PROVIDER_REVIEW">Pending Review</SelectItem>
                      <SelectItem value="INSURANCE_REVIEW">Insurance Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Claims List */}
                <div className="space-y-4">
                  {filteredClaims.map((claim) => (
                    <div key={claim.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {CLAIM_TYPES.find(t => t.value === claim.claimType)?.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {CLAIM_TYPES.find(t => t.value === claim.claimType)?.label}
                            </h3>
                            <p className="text-sm text-gray-400">{claim.description}</p>
                            <p className="text-xs text-gray-500">Patient: {claim.patientName} • {formatDate(claim.submittedAt || '')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(claim.status)}>
                            {getStatusIcon(claim.status)}
                            <span className="ml-1">{claim.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-sm font-medium text-white">{formatCurrency(claim.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Service Date</p>
                          <p className="text-sm font-medium text-white">{formatDate(claim.serviceDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Patient ID</p>
                          <p className="text-sm font-medium text-white font-mono">{claim.patientId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Claim ID</p>
                          <p className="text-sm font-medium text-white font-mono">{claim.id}</p>
                        </div>
                      </div>

                      {claim.documents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-2">Supporting Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {claim.documents.map((doc) => (
                              <Button
                                key={doc.id}
                                variant="outline"
                                size="sm"
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {doc.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {claim.status === 'PROVIDER_REVIEW' && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedClaim(claim)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review Details
                          </Button>
                          <Button
                            onClick={() => handleApproveClaim(claim.id)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckSquare className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) handleRejectClaim(claim.id, reason);
                            }}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XSquare className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {claim.providerSignature && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/20 rounded">
                          <div className="flex items-center space-x-2 mb-2">
                            <Signature className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">Provider Signature</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-gray-400">R8X:</span>
                              <p className="font-mono text-white">{claim.providerSignature.r8x.slice(0, 16)}...</p>
                            </div>
                            <div>
                              <span className="text-gray-400">R8Y:</span>
                              <p className="font-mono text-white">{claim.providerSignature.r8y.slice(0, 16)}...</p>
                            </div>
                            <div>
                              <span className="text-gray-400">S:</span>
                              <p className="font-mono text-white">{claim.providerSignature.s.slice(0, 16)}...</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {claim.rejectionReason && (
                        <Alert className="mt-4 bg-red-900/20 border-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-red-400">
                            <strong>Rejection Reason:</strong> {claim.rejectionReason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Claims Tab */}
          <TabsContent value="approved" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Approved Claims</CardTitle>
                <CardDescription className="text-gray-400">
                  Claims that have been approved and forwarded to insurance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claims.filter(c => c.status === 'APPROVED' || c.status === 'INSURANCE_REVIEW').map((claim) => (
                    <div key={claim.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {CLAIM_TYPES.find(t => t.value === claim.claimType)?.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {CLAIM_TYPES.find(t => t.value === claim.claimType)?.label}
                            </h3>
                            <p className="text-sm text-gray-400">{claim.description}</p>
                            <p className="text-xs text-gray-500">Patient: {claim.patientName}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(claim.status)}>
                          {getStatusIcon(claim.status)}
                          <span className="ml-1">{claim.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-sm font-medium text-white">{formatCurrency(claim.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Approved At</p>
                          <p className="text-sm font-medium text-white">
                            {claim.providerApprovedAt ? formatDate(claim.providerApprovedAt) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Claim ID</p>
                          <p className="text-sm font-medium text-white font-mono">{claim.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Status</p>
                          <p className="text-sm font-medium text-white">
                            {claim.status === 'INSURANCE_REVIEW' ? 'Under Insurance Review' : 'Fully Approved'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Stay updated on claim activities and important information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.isRead 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-white">{notification.title}</h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-400">
                            {formatDate(notification.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNotifications(prev => 
                              prev.map(n => 
                                n.id === notification.id 
                                  ? { ...n, isRead: true }
                                  : n
                              )
                            );
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Claim Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Review Claim Details</CardTitle>
              <CardDescription className="text-gray-400">
                Review all details before approving or rejecting this claim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Patient Name</Label>
                  <p className="text-white">{selectedClaim.patientName}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Amount</Label>
                  <p className="text-white">{formatCurrency(selectedClaim.amount)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Service Date</Label>
                  <p className="text-white">{formatDate(selectedClaim.serviceDate)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Claim Type</Label>
                  <p className="text-white">
                    {CLAIM_TYPES.find(t => t.value === selectedClaim.claimType)?.label}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-gray-400">Description</Label>
                <p className="text-white">{selectedClaim.description}</p>
              </div>

              <div>
                <Label className="text-gray-400">Review Comment</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Add any comments about this claim..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedClaim(null)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRejectClaim(selectedClaim.id, reviewComment || 'No reason provided')}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XSquare className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveClaim(selectedClaim.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
