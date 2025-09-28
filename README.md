# Healthcare Claim Verification System

A comprehensive, privacy-preserving insurance claim verification system built with zero-knowledge proofs on the Midnight Network. This system provides complete workflows for patients, healthcare providers, and insurance companies while maintaining strict privacy guarantees.

## 🎯 Overview

This system implements the complete healthcare claim verification workflow as described:

1. **Patient Submits the Claim** - User-friendly web interface for claim submission
2. **The Contract Does Its Magic** - Zero-knowledge proof verification of business rules
3. **Involvement of Doctor and Insurance Company** - Multi-stakeholder review process
4. **The End State** - Clear status updates and notifications for all parties

## 🏗️ System Architecture

### Core Components

- **Patient Portal** - Complete claim submission and tracking interface
- **Provider Dashboard** - Healthcare provider claim review and approval
- **Insurance Dashboard** - Final claim review with ZK proof verification
- **Notification Service** - Real-time email/SMS notifications
- **ZK Claim Verifier** - Interactive demonstration of zero-knowledge proofs

### Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Zero-Knowledge Proofs**: Midnight Network Compact
- **Smart Contracts**: Compact language for ZK circuits
- **Notifications**: Email/SMS service integration
- **State Management**: React hooks and context

## 🚀 Features

### Patient Portal Features

- **Complete Claim Submission Workflow**
  - Multi-step form with validation
  - Document upload functionality
  - Real-time form validation
  - Sample data generation for testing

- **Claim Tracking Dashboard**
  - Real-time status updates
  - Document management
  - Payment tracking
  - Notification center

- **Profile Management**
  - Personal information
  - Insurance details
  - Contact preferences
  - Notification settings

### Provider Dashboard Features

- **Claim Review Interface**
  - Pending claims queue
  - Detailed claim information
  - Document viewer
  - Approval/rejection workflow

- **Digital Signature System**
  - Cryptographic signature generation
  - Public key management
  - Signature verification
  - Audit trail

- **Analytics and Reporting**
  - Claim statistics
  - Approval rates
  - Processing times
  - Revenue tracking

### Insurance Dashboard Features

- **ZK Proof Verification**
  - Zero-knowledge proof validation
  - Business rule enforcement
  - Privacy-preserving verification
  - Cryptographic guarantees

- **Final Review Process**
  - Provider signature verification
  - Amount validation
  - Date range checks
  - Eligibility verification

- **Payment Processing**
  - Approved claim processing
  - Payment status tracking
  - Transaction management
  - Audit logging

### Notification Service Features

- **Multi-Channel Notifications**
  - Email notifications
  - SMS alerts
  - In-app notifications
  - Push notifications

- **Template Management**
  - Customizable templates
  - Variable substitution
  - Multi-language support
  - A/B testing

- **Delivery Tracking**
  - Delivery status
  - Open rates
  - Click tracking
  - Bounce handling

## 🔐 Privacy and Security

### Zero-Knowledge Proofs

The system uses zero-knowledge proofs to verify claims without revealing sensitive information:

- **Patient Data Privacy**: No PHI/PII is exposed during verification
- **Amount Verification**: Validates against limits without disclosing amounts
- **Provider Authorization**: Verifies credentials without revealing details
- **Business Rule Enforcement**: Applies rules without exposing data

### Cryptographic Security

- **EdDSA Signatures**: Provider authentication
- **Poseidon Hashing**: Secure data hashing
- **Public Key Cryptography**: Secure communication
- **Audit Trails**: Immutable verification records

## 📱 User Interfaces

### Patient Interface

```
┌─────────────────────────────────────────────────────────────┐
│                    Patient Portal                           │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [My Claims] [Submit Claim] [Notifications]     │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard Stats                                        │
│  • Total Claims: 3                                         │
│  • Approved: 1                                             │
│  • Pending: 2                                              │
├─────────────────────────────────────────────────────────────┤
│  📋 Recent Claims                                          │
│  • Medical Invoice - $750.00 - APPROVED                   │
│  • Prescription Drug - $125.50 - UNDER REVIEW             │
│  • Dental Procedure - $450.00 - PENDING                   │
└─────────────────────────────────────────────────────────────┘
```

### Provider Interface

```
┌─────────────────────────────────────────────────────────────┐
│                  Provider Portal                            │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Claims Review] [Approved] [Notifications]     │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard Stats                                        │
│  • Total Claims: 12                                        │
│  • Pending Review: 3                                       │
│  • Approved Today: 8                                       │
├─────────────────────────────────────────────────────────────┤
│  🔍 Claims Awaiting Review                                 │
│  • John Doe - Medical Invoice - $750.00 - [APPROVE] [REJECT] │
│  • Jane Smith - Prescription - $125.50 - [APPROVE] [REJECT] │
└─────────────────────────────────────────────────────────────┘
```

### Insurance Interface

```
┌─────────────────────────────────────────────────────────────┐
│                  Insurance Portal                           │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Claims Review] [Analytics] [Notifications]    │
├─────────────────────────────────────────────────────────────┤
│  📊 Dashboard Stats                                        │
│  • Total Claims: 45                                        │
│  • Pending Review: 5                                       │
│  • Total Approved: $45,620.75                              │
├─────────────────────────────────────────────────────────────┤
│  🔍 Claims Awaiting Review                                 │
│  • John Doe - Medical Invoice - $750.00                    │
│    ✓ ZK Proof Verified                                     │
│    ✓ Provider Signature Valid                              │
│    [APPROVE] [REJECT]                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Nix with flakes support
- Lace Wallet (Chrome extension)
- Midnight Network testnet access

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dawn

# Install dependencies
npm i --legacy-peer-deps

# Start development environment
make dev-up

# Build contracts
cd contract && npm run build

# Start the UI
cd dawn-ui && npm run dev
```

### Running the System

1. **Start the Development Environment**

   ```bash
   make dev-up
   ```

2. **Build the Smart Contracts**

   ```bash
   cd contract
   npm run build
   ```

3. **Start the User Interface**

   ```bash
   cd dawn-ui
   npm run dev
   ```

4. **Access the Application**
   - Open `http://localhost:5173`
   - Select your role (Patient, Provider, Insurance, or Demo)
   - Explore the complete workflow

## 📋 Usage Guide

### For Patients

1. **Submit a Claim**
   - Fill out the claim form with service details
   - Upload supporting documents
   - Submit for provider review

2. **Track Progress**
   - Monitor claim status in real-time
   - View verification results
   - Download approved documents

3. **Manage Notifications**
   - Configure email/SMS preferences
   - Receive status updates
   - Track payment processing

### For Healthcare Providers

1. **Review Claims**
   - Access pending claims queue
   - Review patient information and documents
   - Verify service details

2. **Approve/Reject Claims**
   - Digital signature generation
   - Approval workflow
   - Rejection with reasons

3. **Monitor Analytics**
   - Track approval rates
   - Monitor processing times
   - View revenue statistics

### For Insurance Companies

1. **Final Review**
   - Verify ZK proofs
   - Validate provider signatures
   - Check business rules

2. **Process Payments**
   - Approve valid claims
   - Process payments
   - Generate audit reports

3. **Analytics Dashboard**
   - Claim statistics
   - Fraud detection
   - Cost analysis

## 🔧 Configuration

### Environment Variables

```bash
# Midnight Network Configuration
VITE_NETWORK_ID=testnet
VITE_LOGGING_LEVEL=info

# Notification Service
VITE_EMAIL_SERVICE_URL=http://localhost:3001
VITE_SMS_SERVICE_URL=http://localhost:3002

# Attestation Service
VITE_ATTESTATION_SERVICE_URL=http://localhost:8788
```

### Notification Templates

The system includes pre-configured notification templates for:

- Claim submitted
- Claim approved
- Claim rejected
- Claim under review
- Payment processed

Templates support variable substitution and can be customized through the admin interface.

## 🧪 Testing

### Test Scenarios

The system includes comprehensive test scenarios:

- **Valid Claims**: Standard claims within limits
- **Invalid Claims**: Exceeding limits, unauthorized providers
- **Edge Cases**: Future dates, invalid signatures
- **Error Handling**: Network failures, validation errors

### Sample Data

Pre-loaded sample data includes:

- **Patients**: John Doe, Jane Smith, Bob Johnson
- **Providers**: Hospitals, clinics, pharmacies, specialists
- **Claims**: Various types and amounts
- **Documents**: Sample invoices and reports

## 📊 Business Rules

### Claim Type Limits

- **Medical Invoice**: $1,000 maximum
- **Prescription Drug**: $500 maximum
- **Dental Procedure**: $2,000 maximum
- **Vision Care**: $1,500 maximum
- **Emergency Room**: $5,000 maximum

### Provider Authorization

- **Hospitals**: Medical and emergency claims
- **Clinics**: Medical, prescription, and dental claims
- **Pharmacies**: Prescription claims only
- **Dentists**: Dental claims only
- **Eye Care**: Vision claims only

### Date Validation

- Service dates must be within the last 365 days
- Future service dates are rejected
- Claims older than 1 year are rejected

## 🔮 Future Enhancements

### Planned Features

1. **Mobile Applications**
   - Native iOS/Android apps
   - Offline claim submission
   - Push notifications

2. **Advanced Analytics**
   - Machine learning fraud detection
   - Predictive analytics
   - Cost optimization

3. **Integration APIs**
   - Third-party insurance systems
   - Electronic health records
   - Payment processors

4. **Multi-Language Support**
   - Internationalization
   - Localized templates
   - Regional compliance

### Technical Improvements

1. **Performance Optimization**
   - Caching strategies
   - Database optimization
   - CDN integration

2. **Security Enhancements**
   - Multi-factor authentication
   - Advanced encryption
   - Security auditing

3. **Scalability**
   - Microservices architecture
   - Load balancing
   - Auto-scaling

## 📝 API Documentation

### Claim Submission API

```typescript
POST /api/claims
{
  "claimType": "MEDICAL_INVOICE",
  "amount": 750.00,
  "serviceDate": "2024-01-15",
  "providerId": "HOSPITAL_001",
  "patientId": "PATIENT_001",
  "description": "Annual physical examination",
  "documents": [...],
  "providerSignature": {...}
}
```

### Notification API

```typescript
POST /api/notifications/send
{
  "templateId": "claim-approved",
  "recipient": "patient@example.com",
  "variables": {
    "patientName": "John Doe",
    "claimType": "Medical Invoice",
    "amount": "750.00"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact the development team

## 🏆 Acknowledgments

- **Midnight Network** for zero-knowledge proof infrastructure
- **React Community** for excellent UI components
- **Tailwind CSS** for utility-first styling
- **TypeScript** for type safety
- **Open Source Community** for inspiration and tools

---

**Built with ❤️ for privacy-preserving healthcare claim verification**
