import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ClaimSubmissionRequest {
  claimType: number;
  amount: string;
  serviceDate: string;
  providerId: string;
  patientId: string;
  description: string;
  metadata: string;
  providerSignature: {
    r8x: string;
    r8y: string;
    s: string;
  };
  providerPublicKey: {
    x: string;
    y: string;
  };
}

interface ClaimVerificationResponse {
  claimId: string;
  status: string;
  verificationHash: string;
  timestamp: number;
  message: string;
}

interface AttestationResponse {
  domainHash: string;
  policyMask: number;
  expiryDays: number;
  sigR8x: string;
  sigR8y: string;
  sigS: string;
  policiesGranted: number[];
}

interface EmailVerificationState {
  email: string;
  code: string;
  isVerified: boolean;
  isVerifying: boolean;
  isSendingCode: boolean;
  error: string | null;
}

const CLAIM_TYPES = [
  { value: 0, label: 'Medical Invoice' },
  { value: 1, label: 'Prescription Drug' },
  { value: 2, label: 'Dental Procedure' },
  { value: 3, label: 'Vision Care' },
  { value: 4, label: 'Emergency Room' }
];

const SAMPLE_PROVIDERS = [
  { id: 'HOSPITAL_001', name: 'City General Hospital' },
  { id: 'CLINIC_002', name: 'Family Health Clinic' },
  { id: 'PHARMACY_003', name: 'MediCare Pharmacy' },
  { id: 'DENTIST_004', name: 'Smile Dental Care' },
  { id: 'EYE_CARE_005', name: 'Vision Plus Center' }
];

const SAMPLE_PATIENTS = [
  { id: 'PATIENT_001', name: 'John Doe' },
  { id: 'PATIENT_002', name: 'Jane Smith' },
  { id: 'PATIENT_003', name: 'Bob Johnson' }
];

interface ClaimVerifierProps {
  onBack?: () => void;
}

export const ClaimVerifier: React.FC<ClaimVerifierProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<ClaimSubmissionRequest>({
    claimType: 0,
    amount: '',
    serviceDate: '',
    providerId: '',
    patientId: '',
    description: '',
    metadata: '',
    providerSignature: {
      r8x: '',
      r8y: '',
      s: ''
    },
    providerPublicKey: {
      x: '',
      y: ''
    }
  });

  const [verificationResult, setVerificationResult] = useState<ClaimVerificationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [emailVerification, setEmailVerification] = useState<EmailVerificationState>({
    email: '',
    code: '',
    isVerified: false,
    isVerifying: false,
    isSendingCode: false,
    error: null
  });
  
  const [attestation, setAttestation] = useState<AttestationResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<'email' | 'attestation' | 'claim'>('email');

  // Attestation service configuration
  const ATTESTATION_SERVICE_URL = import.meta.env.VITE_ATTESTATION_SERVICE_URL || 'http://localhost:8788';

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ClaimSubmissionRequest],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleEmailVerification = async () => {
    if (!emailVerification.email || !emailVerification.email.includes('@')) {
      setEmailVerification(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    setEmailVerification(prev => ({ ...prev, isSendingCode: true, error: null }));

    try {
      const response = await fetch(`${ATTESTATION_SERVICE_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVerification.email })
      });

      if (response.ok) {
        setEmailVerification(prev => ({ ...prev, isSendingCode: false }));
        setCurrentStep('attestation');
      } else {
        const errorData = await response.json();
        setEmailVerification(prev => ({ 
          ...prev, 
          isSendingCode: false, 
          error: errorData.error || 'Failed to send verification code' 
        }));
      }
    } catch (err) {
      setEmailVerification(prev => ({ 
        ...prev, 
        isSendingCode: false, 
        error: 'Network error. Please try again.' 
      }));
    }
  };

  const handleAttestation = async () => {
    if (!emailVerification.code) {
      setEmailVerification(prev => ({ ...prev, error: 'Please enter the verification code' }));
      return;
    }

    setEmailVerification(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const response = await fetch(`${ATTESTATION_SERVICE_URL}/attestate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailVerification.email, 
          proof: { code: emailVerification.code } 
        })
      });

      if (response.ok) {
        const attestationData: AttestationResponse = await response.json();
        setAttestation(attestationData);
        setEmailVerification(prev => ({ ...prev, isVerified: true, isVerifying: false }));
        setCurrentStep('claim');
      } else {
        const errorData = await response.json();
        setEmailVerification(prev => ({ 
          ...prev, 
          isVerifying: false, 
          error: errorData.error || 'Invalid verification code' 
        }));
      }
    } catch (err) {
      setEmailVerification(prev => ({ 
        ...prev, 
        isVerifying: false, 
        error: 'Network error. Please try again.' 
      }));
    }
  };

  const generateSampleData = () => {
    const sampleProvider = SAMPLE_PROVIDERS[Math.floor(Math.random() * SAMPLE_PROVIDERS.length)];
    const samplePatient = SAMPLE_PATIENTS[Math.floor(Math.random() * SAMPLE_PATIENTS.length)];
    const sampleAmount = (Math.random() * 1000 + 100).toFixed(2);
    const serviceDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    setFormData({
      claimType: Math.floor(Math.random() * 5),
      amount: (parseFloat(sampleAmount) * 100).toString(), // Convert to cents
      serviceDate: Math.floor(serviceDate.getTime() / 1000).toString(),
      providerId: sampleProvider.id,
      patientId: samplePatient.id,
      description: `Medical service for ${samplePatient.name}`,
      metadata: 'Sample claim data',
      providerSignature: {
        r8x: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        r8y: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        s: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      },
      providerPublicKey: {
        x: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        y: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setVerificationResult(null);

    try {
      // Convert amount to cents and serviceDate to timestamp
      const requestData = {
        ...formData,
        amount: formData.amount,
        serviceDate: parseInt(formData.serviceDate)
      };

      // In a real implementation, this would call the actual API
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification result
      const result: ClaimVerificationResponse = {
        claimId: Math.floor(Math.random() * 1000000).toString(),
        status: Math.random() > 0.3 ? 'VERIFIED' : 'REJECTED',
        verificationHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        timestamp: Math.floor(Date.now() / 1000),
        message: Math.random() > 0.3 ? 'Claim verified successfully' : 'Claim rejected due to invalid signature'
      };

      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              ← Back to Roles
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">ZK Claim Verifier Demo</h1>
        <p className="text-gray-400">
          Verify insurance claims using zero-knowledge proofs without revealing private data
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep === 'email' ? 'text-orange-400' : currentStep === 'attestation' || currentStep === 'claim' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'email' ? 'bg-orange-500' : currentStep === 'attestation' || currentStep === 'claim' ? 'bg-green-500' : 'bg-gray-600'}`}>
              <Mail className="h-4 w-4" />
            </div>
            <span className="ml-2 text-sm font-medium">Email Verification</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className={`flex items-center ${currentStep === 'attestation' ? 'text-orange-400' : currentStep === 'claim' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'attestation' ? 'bg-orange-500' : currentStep === 'claim' ? 'bg-green-500' : 'bg-gray-600'}`}>
              <Shield className="h-4 w-4" />
            </div>
            <span className="ml-2 text-sm font-medium">Get Attestation</span>
          </div>
          <div className="w-8 h-px bg-gray-600"></div>
          <div className={`flex items-center ${currentStep === 'claim' ? 'text-orange-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'claim' ? 'bg-orange-500' : 'bg-gray-600'}`}>
              <CheckCircle className="h-4 w-4" />
            </div>
            <span className="ml-2 text-sm font-medium">Verify Claim</span>
          </div>
        </div>
      </div>

      {/* Email Verification Step */}
      {currentStep === 'email' && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email Verification
            </CardTitle>
            <CardDescription className="text-gray-400">
              Verify your email to get policy attestation for claim verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailVerification.email}
                onChange={(e) => setEmailVerification(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="your.email@domain.com"
              />
            </div>
            {emailVerification.error && (
              <Alert className="bg-red-900/20 border-red-500">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">{emailVerification.error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleEmailVerification}
              disabled={emailVerification.isSendingCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {emailVerification.isSendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attestation Step */}
      {currentStep === 'attestation' && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Get Policy Attestation
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter the verification code sent to {emailVerification.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-white">Verification Code</Label>
              <Input
                id="code"
                type="text"
                value={emailVerification.code}
                onChange={(e) => setEmailVerification(prev => ({ ...prev, code: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            {emailVerification.error && (
              <Alert className="bg-red-900/20 border-red-500">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">{emailVerification.error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentStep('email')}
                variant="outline"
                className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                Back
              </Button>
              <Button
                onClick={handleAttestation}
                disabled={emailVerification.isVerifying}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {emailVerification.isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Get Attestation'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Verification Step */}
      {currentStep === 'claim' && attestation && (
        <div className="space-y-6">
          {/* Attestation Info */}
          <Card className="bg-green-900/20 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-400">Attestation Received</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Domain Hash:</span>
                  <p className="text-white font-mono text-xs">{attestation.domainHash.slice(0, 16)}...</p>
                </div>
                <div>
                  <span className="text-gray-400">Policy Mask:</span>
                  <p className="text-white">{attestation.policyMask}</p>
                </div>
                <div>
                  <span className="text-gray-400">Policies Granted:</span>
                  <p className="text-white">{attestation.policiesGranted.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Expires:</span>
                  <p className="text-white">{new Date(attestation.expiryDays * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claim Submission Form */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Submit Claim</CardTitle>
            <CardDescription className="text-gray-400">
              Enter claim details for ZK verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="claimType" className="text-white">Claim Type</Label>
                  <Select
                    value={formData.claimType.toString()}
                    onValueChange={(value) => handleInputChange('claimType', parseInt(value))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value.toString()}>
                          {type.label}
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
                    value={(parseFloat(formData.amount) / 100).toFixed(2)}
                    onChange={(e) => handleInputChange('amount', (parseFloat(e.target.value) * 100).toString())}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serviceDate" className="text-white">Service Date</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={formData.serviceDate ? new Date(parseInt(formData.serviceDate) * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('serviceDate', Math.floor(new Date(e.target.value).getTime() / 1000).toString())}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="providerId" className="text-white">Provider ID</Label>
                  <Select
                    value={formData.providerId}
                    onValueChange={(value) => handleInputChange('providerId', value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="patientId" className="text-white">Patient ID</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) => handleInputChange('patientId', value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_PATIENTS.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
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
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Medical service description"
                />
              </div>

              <div>
                <Label htmlFor="metadata" className="text-white">Metadata</Label>
                <Input
                  id="metadata"
                  value={formData.metadata}
                  onChange={(e) => handleInputChange('metadata', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Additional metadata"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={generateSampleData}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  Generate Sample Data
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Claim'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Verification Result */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Verification Result</CardTitle>
            <CardDescription className="text-gray-400">
              ZK proof verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-900/20 border-red-500">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {verificationResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    verificationResult.status === 'VERIFIED' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`font-semibold ${
                    verificationResult.status === 'VERIFIED' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {verificationResult.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Claim ID:</span>
                    <span className="text-white font-mono">{verificationResult.claimId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verification Hash:</span>
                    <span className="text-white font-mono text-xs">
                      {verificationResult.verificationHash.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timestamp:</span>
                    <span className="text-white">
                      {new Date(verificationResult.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Message:</span>
                    <span className="text-white">{verificationResult.message}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                Submit a claim to see verification results
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            {/* Privacy Notice */}
            <Card className="bg-blue-900/20 border-blue-500">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-blue-400">Privacy-First Verification</h3>
                  <p className="text-blue-300 text-sm">
                    This system uses zero-knowledge proofs to verify claims without revealing sensitive 
                    patient data, provider details, or claim amounts to the verifier. Only verification 
                    status and minimal metadata are disclosed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
