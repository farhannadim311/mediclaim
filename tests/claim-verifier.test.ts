/*
 * Test suite for ZK Claim Verifier
 * Tests the complete claim verification flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { claimVerifierAPI, type ClaimSubmissionRequest } from '../api/src/claim-verifier';
import sampleClaims from '../test-data/sample-claims.json';

describe('ZK Claim Verifier', () => {
  beforeEach(async () => {
    await claimVerifierAPI.initialize();
  });

  describe('Valid Claims', () => {
    it('should verify a valid medical invoice claim', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '50000', // $500.00
        serviceDate: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Emergency room visit',
        metadata: 'Urgent care',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('VERIFIED');
      expect(result.claimId).toBeTruthy();
      expect(result.verificationHash).toBeTruthy();
      expect(result.message).toContain('successfully');
    });

    it('should verify a valid prescription claim', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 1,
        amount: '25000', // $250.00
        serviceDate: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        providerId: 'PHARMACY_003',
        patientId: 'PATIENT_002',
        description: 'Blood pressure medication',
        metadata: '30-day supply',
        providerSignature: {
          r8x: '0x' + '6'.repeat(64),
          r8y: '0x' + '7'.repeat(64),
          s: '0x' + '8'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '9'.repeat(64),
          y: '0x' + 'a'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('VERIFIED');
      expect(result.claimId).toBeTruthy();
    });

    it('should verify a valid dental claim', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 2,
        amount: '150000', // $1,500.00
        serviceDate: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
        providerId: 'DENTIST_004',
        patientId: 'PATIENT_003',
        description: 'Dental cleaning and examination',
        metadata: 'Routine checkup',
        providerSignature: {
          r8x: '0x' + 'b'.repeat(64),
          r8y: '0x' + 'c'.repeat(64),
          s: '0x' + 'd'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + 'e'.repeat(64),
          y: '0x' + 'f'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('VERIFIED');
      expect(result.claimId).toBeTruthy();
    });
  });

  describe('Invalid Claims', () => {
    it('should reject claim with excessive amount', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0, // Medical invoice
        amount: '150000', // $1,500.00 - exceeds $1,000 limit
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Expensive procedure',
        metadata: 'Over limit',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('amount');
    });

    it('should reject claim from unauthorized provider', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0, // Medical invoice
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'PHARMACY_003', // Pharmacy not authorized for medical claims
        patientId: 'PATIENT_001',
        description: 'Medical service',
        metadata: 'Wrong provider',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('authorized');
    });

    it('should reject claim for ineligible patient', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_999', // Unknown patient
        description: 'Medical service',
        metadata: 'Unknown patient',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('eligible');
    });

    it('should reject claim with future service date', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) + 86400, // 1 day in the future
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Future service',
        metadata: 'Invalid date',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('date');
    });

    it('should reject claim with invalid signature', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Medical service',
        metadata: 'Invalid signature',
        providerSignature: {
          r8x: '0x' + '0'.repeat(64), // Invalid signature
          r8y: '0x' + '0'.repeat(64),
          s: '0x' + '0'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('signature');
    });
  });

  describe('Business Rules', () => {
    it('should enforce correct amount limits for each claim type', async () => {
      const claimTypes = [
        { type: 0, maxAmount: 100000, description: 'Medical Invoice' },
        { type: 1, maxAmount: 50000, description: 'Prescription Drug' },
        { type: 2, maxAmount: 200000, description: 'Dental Procedure' },
        { type: 3, maxAmount: 150000, description: 'Vision Care' },
        { type: 4, maxAmount: 500000, description: 'Emergency Room' }
      ];

      for (const claimType of claimTypes) {
        // Test amount at limit (should pass)
        const validClaim: ClaimSubmissionRequest = {
          claimType: claimType.type,
          amount: claimType.maxAmount.toString(),
          serviceDate: Math.floor(Date.now() / 1000) - 86400,
          providerId: 'HOSPITAL_001',
          patientId: 'PATIENT_001',
          description: `${claimType.description} at limit`,
          metadata: 'At limit test',
          providerSignature: {
            r8x: '0x' + '1'.repeat(64),
            r8y: '0x' + '2'.repeat(64),
            s: '0x' + '3'.repeat(64)
          },
          providerPublicKey: {
            x: '0x' + '4'.repeat(64),
            y: '0x' + '5'.repeat(64)
          }
        };

        const validResult = await claimVerifierAPI.verifyClaim(validClaim);
        expect(validResult.status).toBe('VERIFIED');

        // Test amount over limit (should fail)
        const invalidClaim: ClaimSubmissionRequest = {
          ...validClaim,
          amount: (claimType.maxAmount + 1).toString()
        };

        const invalidResult = await claimVerifierAPI.verifyClaim(invalidClaim);
        expect(invalidResult.status).toBe('REJECTED');
      }
    });
  });

  describe('Privacy Features', () => {
    it('should not reveal sensitive data in verification result', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Sensitive medical information',
        metadata: 'Private data',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      // Verify that sensitive data is not in the response
      expect(result.claimId).toBeTruthy();
      expect(result.verificationHash).toBeTruthy();
      expect(result.status).toBe('VERIFIED');
      
      // These should NOT be in the response
      expect(result).not.toHaveProperty('amount');
      expect(result).not.toHaveProperty('patientId');
      expect(result).not.toHaveProperty('providerId');
      expect(result).not.toHaveProperty('description');
      expect(result).not.toHaveProperty('metadata');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 0,
        amount: '',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
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
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('Invalid');
    });

    it('should handle invalid claim types', async () => {
      const claim: ClaimSubmissionRequest = {
        claimType: 999, // Invalid claim type
        amount: '50000',
        serviceDate: Math.floor(Date.now() / 1000) - 86400,
        providerId: 'HOSPITAL_001',
        patientId: 'PATIENT_001',
        description: 'Test claim',
        metadata: 'Invalid type',
        providerSignature: {
          r8x: '0x' + '1'.repeat(64),
          r8y: '0x' + '2'.repeat(64),
          s: '0x' + '3'.repeat(64)
        },
        providerPublicKey: {
          x: '0x' + '4'.repeat(64),
          y: '0x' + '5'.repeat(64)
        }
      };

      const result = await claimVerifierAPI.verifyClaim(claim);
      
      expect(result.status).toBe('REJECTED');
      expect(result.message).toContain('Invalid');
    });
  });
});
