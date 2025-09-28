import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  DollarSign,
  Calendar,
  Shield,
  Bell,
  Plus,
  Eye,
  Download
} from 'lucide-react';

interface Claim {
  id: string;
  claimType: string;
  amount: number;
  serviceDate: string;
  providerName: string;
  patientName: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PROVIDER_REVIEW' | 'INSURANCE_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  providerApprovedAt?: string;
  insuranceApprovedAt?: string;
  rejectionReason?: string;
  documents: Document[];
  verificationHash?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  insuranceId: string;
  policyNumber: string;
  coverageType: string;
  isVerified: boolean;
}

const CLAIM_TYPES = [
  { value: 'MEDICAL_INVOICE', label: 'Medical Invoice', maxAmount: 1000, icon: '🏥' },
  { value: 'PRESCRIPTION_DRUG', label: 'Prescription Drug', maxAmount: 500, icon: '💊' },
  { value: 'DENTAL_PROCEDURE', label: 'Dental Procedure', maxAmount: 2000, icon: '🦷' },
  { value: 'VISION_CARE', label: 'Vision Care', maxAmount: 1500, icon: '👁️' },
  { value: 'EMERGENCY_ROOM', label: 'Emergency Room', maxAmount: 5000, icon: '🚨' }
];

const SAMPLE_PROVIDERS = [
  { id: 'HOSPITAL_001', name: 'City General Hospital', specialties: ['Medical', 'Emergency'] },
  { id: 'CLINIC_002', name: 'Family Health Clinic', specialties: ['Medical', 'Prescription', 'Dental'] },
  { id: 'PHARMACY_003', name: 'MediCare Pharmacy', specialties: ['Prescription'] },
  { id: 'DENTIST_004', name: 'Smile Dental Care', specialties: ['Dental'] },
  { id: 'EYE_CARE_005', name: 'Vision Plus Center', specialties: ['Vision'] }
];

interface PatientDashboardProps {
  onBack?: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<PatientProfile>({
    id: 'PATIENT_001',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    insuranceId: 'INS_12345',
    policyNumber: 'POL-2024-001',
    coverageType: 'Premium Health Plan',
    isVerified: true
  });

  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 'CLM-001',
      claimType: 'MEDICAL_INVOICE',
      amount: 750.00,
      serviceDate: '2024-01-15',
      providerName: 'City General Hospital',
      patientName: 'John Doe',
      description: 'Annual physical examination',
      status: 'APPROVED',
      submittedAt: '2024-01-16T10:30:00Z',
      providerApprovedAt: '2024-01-16T14:20:00Z',
      insuranceApprovedAt: '2024-01-17T09:15:00Z',
      verificationHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      documents: [
        { id: 'DOC-001', name: 'Medical Invoice.pdf', type: 'application/pdf', size: 245760, uploadedAt: '2024-01-16T10:30:00Z', url: '/documents/medical-invoice.pdf' },
        { id: 'DOC-002', name: 'Doctor Report.pdf', type: 'application/pdf', size: 189440, uploadedAt: '2024-01-16T10:32:00Z', url: '/documents/doctor-report.pdf' }
      ]
    },
    {
      id: 'CLM-002',
      claimType: 'PRESCRIPTION_DRUG',
      amount: 125.50,
      serviceDate: '2024-01-20',
      providerName: 'MediCare Pharmacy',
      patientName: 'John Doe',
      description: 'Blood pressure medication - 30 day supply',
      status: 'INSURANCE_REVIEW',
      submittedAt: '2024-01-21T08:45:00Z',
      providerApprovedAt: '2024-01-21T09:15:00Z',
      documents: [
        { id: 'DOC-003', name: 'Prescription Receipt.pdf', type: 'application/pdf', size: 156720, uploadedAt: '2024-01-21T08:45:00Z', url: '/documents/prescription-receipt.pdf' }
      ]
    },
    {
      id: 'CLM-003',
      claimType: 'DENTAL_PROCEDURE',
      amount: 450.00,
      serviceDate: '2024-01-25',
      providerName: 'Smile Dental Care',
      patientName: 'John Doe',
      description: 'Dental cleaning and examination',
      status: 'PROVIDER_REVIEW',
      submittedAt: '2024-01-26T11:20:00Z',
      documents: [
        { id: 'DOC-004', name: 'Dental Invoice.pdf', type: 'application/pdf', size: 198340, uploadedAt: '2024-01-26T11:20:00Z', url: '/documents/dental-invoice.pdf' }
      ]
    }
  ]);

  const [newClaim, setNewClaim] = useState<Partial<Claim>>({
    claimType: '',
    amount: 0,
    serviceDate: '',
    providerName: '',
    description: '',
    documents: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-001',
      type: 'success',
      title: 'Claim Approved',
      message: 'Your medical invoice claim (CLM-001) has been approved and payment will be processed within 3-5 business days.',
      timestamp: '2024-01-17T09:15:00Z',
      isRead: false
    },
    {
      id: 'NOTIF-002',
      type: 'info',
      title: 'Claim Under Review',
      message: 'Your prescription drug claim (CLM-002) is currently being reviewed by your insurance provider.',
      timestamp: '2024-01-21T09:15:00Z',
      isRead: false
    },
    {
      id: 'NOTIF-003',
      type: 'warning',
      title: 'Provider Review Required',
      message: 'Your dental procedure claim (CLM-003) is awaiting approval from Smile Dental Care.',
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleSubmitClaim = async () => {
    if (!newClaim.claimType || !newClaim.amount || !newClaim.serviceDate || !newClaim.providerName) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const claim: Claim = {
      id: `CLM-${String(claims.length + 1).padStart(3, '0')}`,
      claimType: newClaim.claimType!,
      amount: newClaim.amount!,
      serviceDate: newClaim.serviceDate!,
      providerName: newClaim.providerName!,
      patientName: profile.name,
      description: newClaim.description || '',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      documents: uploadedFiles.map((file, index) => ({
        id: `DOC-${String(claims.length + 1).padStart(3, '0')}-${index + 1}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }))
    };

    setClaims(prev => [claim, ...prev]);
    setNewClaim({
      claimType: '',
      amount: 0,
      serviceDate: '',
      providerName: '',
      description: '',
      documents: []
    });
    setUploadedFiles([]);
    setIsSubmitting(false);

    // Add notification
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: 'info',
      title: 'Claim Submitted',
      message: `Your ${CLAIM_TYPES.find(t => t.value === claim.claimType)?.label} claim has been submitted and is awaiting provider review.`,
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
      day: 'numeric'
    });
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Patient Portal</h1>
                <p className="text-gray-400">Submit and track your insurance claims</p>
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
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
            <TabsTrigger value="claims">My Claims</TabsTrigger>
            <TabsTrigger value="submit">Submit Claim</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <p className="text-sm font-medium text-gray-400">Approved Claims</p>
                      <p className="text-2xl font-bold text-green-400">
                        {claims.filter(c => c.status === 'APPROVED').length}
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
                      <p className="text-sm font-medium text-gray-400">Pending Claims</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {claims.filter(c => ['SUBMITTED', 'PROVIDER_REVIEW', 'INSURANCE_REVIEW'].includes(c.status)).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
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
                    {claims.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(claim.status)}`} />
                          <div>
                            <p className="text-sm font-medium text-white">{claim.description}</p>
                            <p className="text-xs text-gray-400">{formatCurrency(claim.amount)} • {formatDate(claim.serviceDate)}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(claim.status)}>
                          {claim.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{profile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{profile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Policy Number:</span>
                      <span className="text-white">{profile.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage Type:</span>
                      <span className="text-white">{profile.coverageType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Claims</CardTitle>
                <CardDescription className="text-gray-400">
                  Track the status of all your submitted claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claims.map((claim) => (
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
                          <p className="text-xs text-gray-400">Provider</p>
                          <p className="text-sm font-medium text-white">{claim.providerName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Claim ID</p>
                          <p className="text-sm font-medium text-white font-mono">{claim.id}</p>
                        </div>
                      </div>

                      {claim.documents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-2">Documents</p>
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

                      {claim.verificationHash && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-1">Verification Hash</p>
                          <p className="text-xs font-mono text-blue-400 bg-gray-700 p-2 rounded">
                            {claim.verificationHash.slice(0, 32)}...
                          </p>
                        </div>
                      )}

                      {claim.rejectionReason && (
                        <Alert className="bg-red-900/20 border-red-500">
                          <XCircle className="h-4 w-4" />
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

          {/* Submit Claim Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Submit New Claim
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Submit a new insurance claim with supporting documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="claimType" className="text-white">Claim Type</Label>
                    <Select
                      value={newClaim.claimType}
                      onValueChange={(value) => setNewClaim(prev => ({ ...prev, claimType: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <span>{type.icon}</span>
                              <span>{type.label}</span>
                              <span className="text-xs text-gray-400">(Max: ${type.maxAmount})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-white">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newClaim.amount || ''}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="serviceDate" className="text-white">Service Date</Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={newClaim.serviceDate}
                      onChange={(e) => setNewClaim(prev => ({ ...prev, serviceDate: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="provider" className="text-white">Healthcare Provider</Label>
                    <Select
                      value={newClaim.providerName}
                      onValueChange={(value) => setNewClaim(prev => ({ ...prev, providerName: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.id} value={provider.name}>
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-gray-400">
                                {provider.specialties.join(', ')}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Input
                    id="description"
                    value={newClaim.description}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Describe the medical service or treatment received"
                  />
                </div>

                <div>
                  <Label htmlFor="documents" className="text-white">Supporting Documents</Label>
                  <div className="mt-2">
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Upload invoices, receipts, medical reports, or other supporting documents
                    </p>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-400">Uploaded Files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <span className="text-sm text-white">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewClaim({
                        claimType: '',
                        amount: 0,
                        serviceDate: '',
                        providerName: '',
                        description: '',
                        documents: []
                      });
                      setUploadedFiles([]);
                    }}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Clear Form
                  </Button>
                  <Button
                    onClick={handleSubmitClaim}
                    disabled={isSubmitting || !newClaim.claimType || !newClaim.amount || !newClaim.serviceDate || !newClaim.providerName}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Submit Claim
                      </>
                    )}
                  </Button>
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
                  Stay updated on your claim status and important information
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
    </div>
  );
};
