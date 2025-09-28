# Dawn CLI - Censorship-Free Media Reports

Updated Dawn CLI that implements the complete end-to-end flow for posting censorship-free media reports with email-based attestation.

## Features

- **Email-based Attestation**: Get verified access to post reports by verifying your email address
- **Board-based Reporting**: Post reports to predetermined boards (GOV_POLITICS, HEALTHCARE, INFRA, etc.)
- **Signature Verification**: All reports are cryptographically verified using BabyJub/EdDSA over Poseidon
- **Report Retrieval**: Retrieve and view published reports by ID

## End-to-End Flow

1. **Get Attestation**: Verify your email to receive signed grants for specific boards
2. **Post Reports**: Submit reports with title, description, and metadata to authorized boards
3. **Retrieve Reports**: View published reports using their unique IDs

## Usage

### Prerequisites

Ensure the attestation service is running at `http://localhost:8787`. The service should provide:
- `POST /verify` - Send email verification code
- `POST /attestate` - Get signed attestation after code verification

### Running the CLI

```bash
npm run testnet-remote
```

### Menu Options

1. **Get email attestation for posting reports**
   - Enter your email address
   - Receive and enter verification code
   - Get signed attestation with board permissions

2. **Post a report to a board (requires attestation)**
   - Select from available boards based on your attestation
   - Enter report title, description, and metadata
   - Submit cryptographically signed report

3. **Retrieve a report by ID**
   - Enter report ID to view full report details

4. **Display ledger state**
   - View current contract state and recent reports

5. **Display private/derived state**
   - View local state information

## Smart Contract Integration

The CLI integrates with the Dawn smart contract which defines:

- **Boards**: Predetermined categories (GOV_POLITICS, HEALTHCARE, INFRA, EDUCATION, MEDIA, CORPORATE, LEGAL, ENVIRONMENT, CIVIL, CITIZEN)
- **Reports**: Structured data with board, title, shortDescription, and metadata
- **Attestation Verification**: BabyJub/EdDSA signature verification for posting rights

## Technical Details

- Uses Midnight Network for privacy-preserving smart contracts
- Implements witness-based zero-knowledge proofs for attestation verification
- Supports signature verification with domain-specific hashing
- Maintains report ledger with sequential IDs

## Development

```bash
# Build the project
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run full CI pipeline
npm run ci
```