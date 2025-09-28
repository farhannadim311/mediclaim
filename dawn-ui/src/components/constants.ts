

// ZK Claim Verifier Configuration

// Policy tiers for claim verification
export const POLICY_TIERS = {
  BASIC_1000: { id: 1, name: 'Basic', limit: 1000, color: '#4ecdc4' },
  PLUS_2500: { id: 2, name: 'Plus', limit: 2500, color: '#45b7d1' },
  PREMIUM_5000: { id: 3, name: 'Premium', limit: 5000, color: '#ff6b6b' }
} as const;

// Claim types supported by the system
export const CLAIM_TYPES = {
  MEDICAL_INVOICE: { id: 0, name: 'Medical Invoice', color: '#4ecdc4' },
  PRESCRIPTION_DRUG: { id: 1, name: 'Prescription Drug', color: '#45b7d1' },
  DENTAL_PROCEDURE: { id: 2, name: 'Dental Procedure', color: '#96ceb4' },
  VISION_CARE: { id: 3, name: 'Vision Care', color: '#feca57' },
  EMERGENCY_ROOM: { id: 4, name: 'Emergency Room', color: '#ff6b6b' }
} as const;

// Service configuration
export const SERVICE_CONFIG = {
  ATTESTATION_SERVICE_URL: import.meta.env.VITE_ATTESTATION_SERVICE_URL || 'http://localhost:8788',
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  CHALLENGE_TTL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_CLAIM_AMOUNT: 10000, // $100.00 in cents
  MIN_CLAIM_AMOUNT: 1, // $0.01 in cents
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_METADATA_LENGTH: 200,
} as const;
  