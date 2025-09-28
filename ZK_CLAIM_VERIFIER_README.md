# ZK Claim Verifier - Hackathon MVP

A privacy-preserving insurance claim verification system using zero-knowledge proofs on the Midnight Network.

## 🎯 Overview

The ZK Claim Verifier is a hackathon-ready MVP that demonstrates how insurers can verify insurance claims without learning the claimant's private data (PHI/PII). The system uses zero-knowledge proofs to prove claim validity while only revealing minimal metadata needed for processing.

## 🔐 Privacy Features

- **Zero-Knowledge Verification**: Claims are verified without revealing sensitive data
- **Minimal Disclosure**: Only claim ID, timestamp, and verification status are public
- **Cryptographic Signatures**: Provider signatures ensure claim authenticity
- **Business Rule Validation**: Amount limits, date ranges, and authorization checks

## 🏗️ Architecture

### Smart Contract (Compact)
- **File**: `contract/src/claim-verifier.compact`
- **Circuit**: `verifyClaim` - Main ZK circuit for claim verification
- **Witnesses**: Signature verification, amount validation, date validation, authorization checks

### API Layer
- **File**: `api/src/claim-verifier.ts`
- **Endpoints**: Claim submission, verification, status checking
- **Integration**: Midnight Network smart contract integration

### Frontend (React)
- **File**: `dawn-ui/src/components/ClaimVerifier.tsx`
- **Features**: Claim submission form, verification results, sample data generation

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+)
2. **Nix** with flakes support
3. **Lace Wallet** (Chrome extension)
4. **Midnight Network** testnet access

### Installation

```bash
# Clone and setup
git clone <repository>
cd dawn
npm i --legacy-peer-deps

# Start development environment
make dev-up

# Build contracts
cd contract && npm run build

# Start UI
cd dawn-ui && npm run dev
```

### Demo Scripts

#### Linux/macOS
```bash
./demo.sh
```

#### Windows
```cmd
demo.bat
```

#### Manual Demo
```bash
# 1. Start the development environment
make dev-up

# 2. Build the claim verifier contract
cd contract
npm run build

# 3. Start the UI
cd ../dawn-ui
npm run dev

# 4. Open browser to http://localhost:5173/claims
# 5. Click "Generate Sample Data" to populate form
# 6. Click "Verify Claim" to see ZK verification
```

## 📋 Claim Types Supported

1. **Medical Invoice** - Up to $1,000
2. **Prescription Drug** - Up to $500
3. **Dental Procedure** - Up to $2,000
4. **Vision Care** - Up to $1,500
5. **Emergency Room** - Up to $5,000

## 🔍 ZK Circuit Details

### Verification Steps

1. **Signature Verification**: EdDSA signature over claim hash
2. **Amount Validation**: Check against claim type limits
3. **Date Validation**: Ensure service date is within acceptable range
4. **Provider Authorization**: Verify provider can submit this claim type
5. **Patient Eligibility**: Confirm patient is eligible for coverage

### Privacy Guarantees

- **Amount**: Only verified against limits, not disclosed
- **Patient Data**: Only eligibility checked, not revealed
- **Provider Details**: Only authorization verified
- **Service Description**: Remains opaque
- **Metadata**: Not disclosed to verifier

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run
```

### Test Coverage
- Valid claim verification
- Invalid claim rejection
- Business rule enforcement
- Privacy feature validation
- Edge case handling

## 📊 Sample Data

The system includes sample data for testing:

### Providers
- `HOSPITAL_001` - City General Hospital (Medical, Emergency)
- `CLINIC_002` - Family Health Clinic (Medical, Prescription, Dental)
- `PHARMACY_003` - MediCare Pharmacy (Prescription only)
- `DENTIST_004` - Smile Dental Care (Dental only)
- `EYE_CARE_005` - Vision Plus Center (Vision only)

### Patients
- `PATIENT_001` - John Doe
- `PATIENT_002` - Jane Smith
- `PATIENT_003` - Bob Johnson

## 🔧 Technical Implementation

### ZK Witnesses

```typescript
// Signature verification
VERIFY_CLAIM_SIGNATURE(claimHash, providerPubX, providerPubY, sigR8x, sigR8y, sigS)

// Business rule validation
VERIFY_CLAIM_AMOUNT(claimType, amount)
VERIFY_SERVICE_DATE(serviceDate, currentTimestamp)
VERIFY_PROVIDER_AUTHORIZATION(providerId, claimType)
VERIFY_PATIENT_ELIGIBILITY(patientId, claimType)
```

### Smart Contract Circuit

```compact
export circuit verifyClaim(
  claim: Claim,
  providerPubX: Bytes<32>,
  providerPubY: Bytes<32>,
  signatureR8x: Bytes<32>,
  signatureR8y: Bytes<32>,
  signatureS: Bytes<32>,
  currentTimestamp: Uint<32>
): Uint<64>
```

## 📊 Verification Flow

1. **Claim Submission**: User submits claim with provider signature
2. **ZK Proof Generation**: System generates proof of claim validity
3. **Witness Verification**: All business rules are checked in ZK
4. **Public Disclosure**: Only verification status and minimal metadata revealed
5. **Blockchain Storage**: Verification result stored on-chain

## 🛡️ Security Features

- **Cryptographic Signatures**: EdDSA over Poseidon hash
- **Zero-Knowledge Proofs**: No sensitive data revealed
- **Business Rule Enforcement**: Automated validation
- **Provider Authorization**: Role-based access control
- **Patient Eligibility**: Coverage verification

## 🎮 Demo Features

### Interactive UI
- **Sample Data Generation**: One-click form population
- **Real-time Verification**: Instant ZK proof verification
- **Status Display**: Clear verification results
- **Privacy Indicators**: Visual privacy guarantees

### Developer Tools
- **Mock API**: Simulated verification for demo
- **Sample Signatures**: Pre-generated test data
- **Error Handling**: Comprehensive error messages
- **Logging**: Detailed verification logs

## 📈 Business Value

### For Insurers
- **Reduced Fraud**: Cryptographic verification prevents fake claims
- **Privacy Compliance**: No PHI/PII exposure
- **Automated Processing**: ZK proofs enable instant verification
- **Cost Savings**: Reduced manual review requirements

### For Patients
- **Privacy Protection**: Sensitive data never revealed
- **Faster Processing**: Instant verification
- **Transparency**: Clear verification status
- **Trust**: Cryptographic guarantees

## 🔮 Future Enhancements

1. **Real ZK Proofs**: Integration with actual ZK proof generation
2. **Multiple Claim Types**: Support for more insurance categories
3. **Batch Verification**: Process multiple claims simultaneously
4. **Mobile App**: Native mobile interface
5. **API Integration**: Real insurance system integration

## 📁 Project Structure

```
dawn/
├── contract/
│   ├── src/
│   │   ├── claim-verifier.compact    # ZK circuit definition
│   │   └── claim-witnesses.ts        # Witness implementations
│   └── dist/                         # Compiled contracts
├── api/
│   └── src/
│       └── claim-verifier.ts         # API endpoints
├── dawn-ui/
│   └── src/
│       └── components/
│           └── ClaimVerifier.tsx     # React UI component
├── tests/
│   ├── claim-verifier.test.ts        # Test suite
│   └── setup.ts                      # Test setup
├── test-data/
│   └── sample-claims.json            # Sample test data
├── demo.sh                           # Linux/macOS demo script
├── demo.bat                          # Windows demo script
└── ZK_CLAIM_VERIFIER_DEMO.md         # Demo documentation
```

## 🚨 Important Notes

### Hackathon MVP
This is a hackathon MVP designed for demonstration purposes. For production use, additional security audits and testing would be required.

### Mock Implementation
The current implementation uses mock ZK proofs for demonstration. In a production system, real ZK proof generation and verification would be implemented.

### Security Considerations
- Real cryptographic signatures would be required
- ZK proof generation would need optimization
- Smart contract would need security audits
- API endpoints would need authentication

## 📝 License

Apache 2.0 - See LICENSE file for details

## 🤝 Contributing

This is a hackathon MVP. For production use, additional security audits and testing would be required.

---

**Built for the Midnight Network Hackathon** 🚀

## 🎯 Demo Instructions for Judges

1. **Run the demo script**:
   ```bash
   # Linux/macOS
   ./demo.sh
   
   # Windows
   demo.bat
   ```

2. **Open the application**:
   - Navigate to `http://localhost:5173/claims`
   - Click "ZK Claims" in the header

3. **Test the verification**:
   - Click "Generate Sample Data" to populate the form
   - Click "Verify Claim" to see the ZK verification process
   - Observe the verification result

4. **Try different scenarios**:
   - Change claim types and amounts
   - Test with different providers and patients
   - Observe how business rules are enforced

5. **Review the code**:
   - Check `contract/src/claim-verifier.compact` for ZK circuit
   - Review `api/src/claim-verifier.ts` for API logic
   - Examine `dawn-ui/src/components/ClaimVerifier.tsx` for UI

The system demonstrates privacy-preserving claim verification using zero-knowledge proofs while maintaining business rule enforcement and fraud prevention.
