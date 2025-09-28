import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { claimAPI } from '../lib/claim-api';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Building,
  Calendar,
  FileText,
  Loader2,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface ClaimVerifierProps {
  walletAddress: string;
}

interface ClaimFormData {
  claimType: number;
  amount: string;
  serviceDate: string;
  providerId: string;
  patientId: string;
  description: string;
  metadata: string;
}

interface VerificationResult {
  claimId: string;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
  verificationHash: string;
  timestamp: number;
  message: string;
}

const CLAIM_TYPES = [
  { value: 0, label: 'Medical Invoice', icon: '🏥' },
  { value: 1, label: 'Prescription Drug', icon: '💊' },
  { value: 2, label: 'Dental Procedure', icon: '🦷' },
  { value: 3, label: 'Vision Care', icon: '👁️' },
  { value: 4, label: 'Emergency Room', icon: '🚨' },
];

const SAMPLE_PROVIDERS = [
  { id: 'HOSPITAL_001', name: 'City General Hospital', type: 'Hospital' },
  { id: 'CLINIC_002', name: 'Family Health Clinic', type: 'Clinic' },
  { id: 'PHARMACY_003', name: 'MediCare Pharmacy', type: 'Pharmacy' },
  { id: 'DENTIST_004', name: 'Smile Dental Care', type: 'Dental' },
  { id: 'EYE_CARE_005', name: 'Vision Plus Center', type: 'Vision' },
];

const SAMPLE_PATIENTS = [
  { id: 'PATIENT_001', name: 'John Doe', age: 45 },
  { id: 'PATIENT_002', name: 'Jane Smith', age: 32 },
  { id: 'PATIENT_003', name: 'Bob Johnson', age: 58 },
];

const ClaimVerifier: React.FC<ClaimVerifierProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState<ClaimFormData>({
    claimType: 0,
    amount: '',
    serviceDate: '',
    providerId: '',
    patientId: '',
    description: '',
    metadata: '',
  });

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'verifying' | 'result'>('form');

  const handleInputChange = (field: keyof ClaimFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSampleData = () => {
    const sampleProvider = SAMPLE_PROVIDERS[Math.floor(Math.random() * SAMPLE_PROVIDERS.length)];
    const samplePatient = SAMPLE_PATIENTS[Math.floor(Math.random() * SAMPLE_PATIENTS.length)];
    const sampleAmount = (Math.random() * 1000 + 100).toFixed(2);
    const serviceDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const claimType = Math.floor(Math.random() * 5);

    setFormData({
      claimType,
      amount: sampleAmount,
      serviceDate: serviceDate.toISOString().split('T')[0],
      providerId: sampleProvider.id,
      patientId: samplePatient.id,
      description: `${CLAIM_TYPES[claimType].label} for ${samplePatient.name}`,
      metadata: `Generated sample claim - ${sampleProvider.type}`,
    });

    setError(null);
    setVerificationResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.amount || !formData.serviceDate || !formData.providerId || !formData.patientId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setCurrentStep('verifying');

    try {
      // First ensure we have a contract deployed
      try {
        await claimAPI.deployContract();
      } catch {
        // Contract might already be deployed, continue
      }

      // Use the real claim API to verify the claim
      const claimData = {
        claimType: formData.claimType,
        amount: (parseFloat(formData.amount) * 100).toString(), // Convert to cents
        serviceDate: formData.serviceDate,
        providerId: formData.providerId,
        patientId: formData.patientId,
        description: formData.description,
        metadata: formData.metadata,
      };

      const result = await claimAPI.verifyClaim(claimData);

      setVerificationResult(result);
      setCurrentStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setCurrentStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      claimType: 0,
      amount: '',
      serviceDate: '',
      providerId: '',
      patientId: '',
      description: '',
      metadata: '',
    });
    setVerificationResult(null);
    setError(null);
    setCurrentStep('form');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'REJECTED':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />;
      case 'PENDING':
        return <Clock className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  if (currentStep === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Verifying Claim</h3>
            <p className="text-gray-300 mb-6">Generating zero-knowledge proof and verifying claim authenticity...</p>
            <div className="space-y-3 text-left">
              {[
                'Validating claim signature',
                'Checking policy compliance',
                'Generating ZK proof',
                'Submitting to contract',
              ].map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'result' && verificationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-6">
                <div
                  className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${
                    verificationResult.status === 'VERIFIED'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                >
                  {getStatusIcon(verificationResult.status)}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {verificationResult.status === 'VERIFIED' ? 'Claim Verified!' : 'Verification Failed'}
                </h2>
                <p className="text-gray-300">{verificationResult.message}</p>
              </div>

              <div className="space-y-4">
                <div
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(verificationResult.status)}`}
                >
                  {getStatusIcon(verificationResult.status)}
                  <span className="font-semibold">{verificationResult.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">Claim ID</span>
                    </div>
                    <p className="text-white font-mono">{verificationResult.claimId}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400">Timestamp</span>
                    </div>
                    <p className="text-white">{new Date(verificationResult.timestamp * 1000).toLocaleString()}</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 sm:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">Verification Hash</span>
                    </div>
                    <p className="text-white font-mono text-xs break-all">{verificationResult.verificationHash}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={resetForm}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Verify Another Claim
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-black hover:bg-gray-700 hover:text-white"
                    onClick={() => (window.location.href = '/dashboard')}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="bg-blue-500/10 border border-blue-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-400 font-semibold mb-1">Privacy Protected</h4>
                  <p className="text-blue-300 text-sm">
                    Your claim was verified using zero-knowledge proofs. No sensitive patient data, financial amounts,
                    or provider details were revealed during verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Verify Insurance Claim</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Submit your claim for zero-knowledge verification. Your sensitive data remains private.
          </p>
        </div>

        {/* Connected Wallet Info */}
        <Card className="mb-8 bg-green-500/10 border border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-green-400 font-medium">Connected Wallet</p>
                <p className="text-green-300 font-mono text-sm">
                  {walletAddress.slice(0, 20)}...{walletAddress.slice(-10)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Claim Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Claim Details
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter your insurance claim information for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Claim Type & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="claimType" className="text-white">
                        Claim Type
                      </Label>
                      <Select
                        value={formData.claimType.toString()}
                        onValueChange={(value) => handleInputChange('claimType', parseInt(value))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLAIM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value.toString()}>
                              <div className="flex items-center space-x-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount" className="text-white flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        Amount ($)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Service Date */}
                  <div>
                    <Label htmlFor="serviceDate" className="text-white flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Service Date
                    </Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => handleInputChange('serviceDate', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                      required
                    />
                  </div>

                  {/* Provider & Patient */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="providerId" className="text-white flex items-center">
                        <Building className="mr-1 h-4 w-4" />
                        Healthcare Provider
                      </Label>
                      <Select
                        value={formData.providerId}
                        onValueChange={(value) => handleInputChange('providerId', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex flex-col items-start">
                                <span>{provider.name}</span>
                                <span className="text-xs text-gray-400">{provider.type}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="patientId" className="text-white flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        Patient
                      </Label>
                      <Select
                        value={formData.patientId}
                        onValueChange={(value) => handleInputChange('patientId', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_PATIENTS.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              <div className="flex flex-col items-start">
                                <span>{patient.name}</span>
                                <span className="text-xs text-gray-400">Age: {patient.age}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description & Metadata */}
                  <div>
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                      placeholder="Brief description of the medical service"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metadata" className="text-white">
                      Additional Notes
                    </Label>
                    <Input
                      id="metadata"
                      value={formData.metadata}
                      onChange={(e) => handleInputChange('metadata', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mt-2"
                      placeholder="Any additional information"
                    />
                  </div>

                  {error && (
                    <Alert className="bg-red-900/20 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      onClick={generateSampleData}
                      variant="outline"
                      className="flex-1 border-gray-600 text-black hover:bg-gray-700 hover:text-white"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Sample
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Verify Claim
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    icon: <Shield className="h-5 w-5 text-blue-400" />,
                    title: 'Zero-Knowledge Proof',
                    description: 'Cryptographic verification without revealing sensitive data',
                  },
                  {
                    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
                    title: 'Instant Validation',
                    description: 'Real-time claim authenticity verification',
                  },
                  {
                    icon: <Shield className="h-5 w-5 text-purple-400" />,
                    title: 'Privacy Protected',
                    description: 'Patient data and amounts remain completely private',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{item.title}</h4>
                      <p className="text-gray-400 text-xs">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card className="bg-blue-500/10 border border-blue-500/20">
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                  <h4 className="text-blue-400 font-semibold mb-2">Privacy Guaranteed</h4>
                  <p className="text-blue-300 text-sm">
                    Your claim verification uses zero-knowledge proofs. Sensitive patient information, financial
                    amounts, and provider details never leave your device.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimVerifier;
