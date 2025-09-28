# MediClaim ZK - Zero-Knowledge Healthcare Claim Verification

A revolutionary privacy-preserving insurance claim verification system built with zero-knowledge proofs on the Midnight Network. This comprehensive platform enables secure claim verification while protecting sensitive patient data, financial information, and provider details.

## 🎯 Overview

**MediClaim ZK** is a complete zero-knowledge healthcare claim verification ecosystem that transforms how insurance claims are processed. The system leverages cutting-edge cryptographic techniques to verify claim authenticity without exposing any sensitive information.

### Core Value Proposition

- **🔒 Privacy-First**: Patient data, amounts, and provider details remain completely private
- **⚡ Instant Verification**: Real-time ZK proof generation and validation
- **🛡️ Cryptographically Secure**: EdDSA signatures and Poseidon hashing
- **🌐 Multi-Stakeholder**: Unified platform for patients, providers, and insurers
- **📊 Complete Workflow**: End-to-end claim lifecycle management

## 🏗️ System Architecture

### Application Components

**MediClaim ZK** consists of multiple integrated applications providing a complete healthcare claim ecosystem:

#### 🖥️ Web Application (`mediclaim-ui`)

- **Landing Page**: Modern, responsive homepage with feature showcase
- **Claim Verifier**: Interactive ZK claim verification interface
- **Dashboard**: Comprehensive claim tracking and analytics
- **Wallet Integration**: Seamless Midnight Network wallet connectivity
- **Multi-Role Support**: Unified interface for all stakeholders

#### 🔧 CLI Application (`mediclaim-cli`)

- **Contract Deployment**: Deploy and manage ZK contracts
- **Claim Processing**: Command-line claim verification
- **Development Tools**: Testing and debugging utilities
- **Network Management**: Testnet and mainnet operations

#### 🌐 API Bridge (`api-bridge`)

- **Authentication Service**: Secure user authentication
- **Claim Verifier Service**: ZK proof generation and validation
- **Wallet Service**: Midnight Network wallet operations
- **Simple API Service**: RESTful endpoints for frontend

#### 🏥 Attestation Service (`attestation`)

- **Email Notifications**: Automated claim status updates
- **Cryptographic Signatures**: Secure attestation generation
- **Document Storage**: Secure claim document management
- **Identity Verification**: Provider and patient validation

### Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Zero-Knowledge Proofs**: Midnight Network Compact Runtime
- **Smart Contracts**: Compact language with ZK circuits
- **Backend**: Node.js + TypeScript + Express
- **Authentication**: Wallet-based cryptographic authentication
- **Notifications**: Multi-channel notification system
- **Database**: Level DB for private state management
- **Development**: Nix flakes for reproducible environments

## ✨ Key Features

### 🔐 Zero-Knowledge Verification Engine

- **Privacy-Preserving Validation**: Verify claims without revealing sensitive patient data, amounts, or provider details
- **Cryptographic Signatures**: EdDSA signature verification for provider authentication
- **Business Rule Enforcement**: Automated policy compliance checking via ZK circuits
- **Instant Results**: Real-time verification with immediate feedback
- **Audit Trail**: Immutable verification records with cryptographic hashes

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

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Nix** with flakes support enabled
- **Lace Wallet** browser extension
- **Midnight Network** testnet access

### Quick Start

#### Manual Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd mediclaim

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start development environment
make dev-up

# 4. Build ZK contracts
cd contract && npm run build

# 5. Start web application
cd ../mediclaim-ui && npm run dev

# 6. Start API bridge (optional)
cd ../api-bridge && npm start

# 7. Start attestation service (optional)
cd ../attestation && npm start
```

## 📋 Complete User Guide

### 🔐 Claim Verification Process

#### Step 1: Connect Wallet

- Install and configure Lace wallet for Midnight Network
- Connect wallet to authorize secure claim submission
- View connected wallet address confirmation

#### Step 2: Submit Claim Details

- **Claim Type**: Select from Medical Invoice, Prescription, Dental, Vision, or Emergency
- **Amount**: Enter claim amount (automatically validated against policy limits)
- **Service Date**: Specify when the medical service was provided
- **Provider**: Choose from verified healthcare providers
- **Patient**: Select patient from authorized list
- **Description**: Add service description and additional notes

#### Step 3: Generate Sample Data (Optional)

- Click "Generate Sample" for instant test data
- Perfect for demonstrations and testing workflows
- Automatically populates all required fields

#### Step 4: Verify Claim

- Submit claim for zero-knowledge verification
- Watch real-time progress through verification steps:
  - Validating claim signature
  - Checking policy compliance
  - Generating ZK proof
  - Submitting to contract

#### Step 5: Review Results

- **Verification Status**: VERIFIED, REJECTED, or PENDING
- **Claim ID**: Unique identifier for tracking
- **Verification Hash**: Cryptographic proof of verification
- **Privacy Notice**: Confirmation that no sensitive data was exposed


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

