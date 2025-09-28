#!/bin/bash

# ZK Claim Verifier - Hackathon Demo Script
# This script demonstrates the complete ZK Claim Verifier MVP

set -e

echo "🚀 ZK Claim Verifier - Hackathon Demo"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm i --legacy-peer-deps
print_success "Dependencies installed"

# Build the contract
print_status "Building ZK Claim Verifier contract..."
cd contract
npm run build
print_success "Contract built successfully"
cd ..

# Start the development environment
print_status "Starting development environment..."
make dev-up &
DEV_PID=$!

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Start the UI
print_status "Starting the UI..."
cd dawn-ui
npm run dev &
UI_PID=$!

# Wait for UI to start
print_status "Waiting for UI to start..."
sleep 15

print_success "Demo environment is ready!"
echo ""
echo "🎯 Demo Instructions:"
echo "===================="
echo ""
echo "1. Open your browser and go to: http://localhost:5173/claims"
echo ""
echo "2. Click the 'Generate Sample Data' button to populate the form with test data"
echo ""
echo "3. Click 'Verify Claim' to see the ZK verification process"
echo ""
echo "4. Observe the verification result showing:"
echo "   - Claim ID (generated)"
echo "   - Verification status (VERIFIED/REJECTED)"
echo "   - Verification hash (ZK proof)"
echo "   - Timestamp"
echo "   - Status message"
echo ""
echo "5. Try different claim types and amounts to see validation rules"
echo ""
echo "🔐 Privacy Features Demonstrated:"
echo "================================"
echo ""
echo "✓ Zero-knowledge verification - sensitive data not revealed"
echo "✓ Provider signature verification"
echo "✓ Business rule validation (amount limits, date ranges)"
echo "✓ Authorization checks (provider and patient eligibility)"
echo "✓ Minimal disclosure (only verification status and metadata)"
echo ""
echo "📊 Sample Data Available:"
echo "========================"
echo ""
echo "Providers:"
echo "- HOSPITAL_001 (Medical, Emergency)"
echo "- CLINIC_002 (Medical, Prescription, Dental)"
echo "- PHARMACY_003 (Prescription only)"
echo "- DENTIST_004 (Dental only)"
echo "- EYE_CARE_005 (Vision only)"
echo ""
echo "Patients:"
echo "- PATIENT_001 (John Doe)"
echo "- PATIENT_002 (Jane Smith)"
echo "- PATIENT_003 (Bob Johnson)"
echo ""
echo "Claim Types & Limits:"
echo "- Medical Invoice: Up to $1,000"
echo "- Prescription Drug: Up to $500"
echo "- Dental Procedure: Up to $2,000"
echo "- Vision Care: Up to $1,500"
echo "- Emergency Room: Up to $5,000"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

# Function to cleanup on exit
cleanup() {
    print_status "Stopping demo..."
    kill $UI_PID 2>/dev/null || true
    kill $DEV_PID 2>/dev/null || true
    print_success "Demo stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep the script running
while true; do
    sleep 1
done
