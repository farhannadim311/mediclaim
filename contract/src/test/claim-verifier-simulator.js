import { QueryContext, sampleContractAddress, constructorContext, convert_bigint_to_Uint8Array, } from "@midnight-ntwrk/compact-runtime";
import { claimWitnesses, createClaimPrivateState, initClaimWitnesses, createSampleClaimPrivateState, } from "../claim-witnesses.js";
export var ClaimType;
(function (ClaimType) {
    ClaimType[ClaimType["MEDICAL_INVOICE"] = 0] = "MEDICAL_INVOICE";
    ClaimType[ClaimType["PRESCRIPTION_DRUG"] = 1] = "PRESCRIPTION_DRUG";
    ClaimType[ClaimType["DENTAL_PROCEDURE"] = 2] = "DENTAL_PROCEDURE";
    ClaimType[ClaimType["VISION_CARE"] = 3] = "VISION_CARE";
    ClaimType[ClaimType["EMERGENCY_ROOM"] = 4] = "EMERGENCY_ROOM";
})(ClaimType || (ClaimType = {}));
export var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus[ClaimStatus["PENDING"] = 0] = "PENDING";
    ClaimStatus[ClaimStatus["APPROVED"] = 1] = "APPROVED";
    ClaimStatus[ClaimStatus["REJECTED"] = 2] = "REJECTED";
})(ClaimStatus || (ClaimStatus = {}));
export class ClaimVerifierSimulator {
    contract;
    circuitContext;
    claimCounter = 0n;
    claims = new Map();
    claimStatuses = new Map();
    verificationHashes = new Map();
    constructor(params) {
        // Create a mock contract that uses our claim witnesses
        this.contract = {
            witnesses: claimWitnesses,
            circuits: {
                verifyClaim: this.mockVerifyClaim.bind(this),
                getClaimStatus: this.mockGetClaimStatus.bind(this),
                getClaimVerificationHash: this.mockGetClaimVerificationHash.bind(this),
            },
            impureCircuits: {
                verifyClaim: this.mockVerifyClaim.bind(this),
                getClaimStatus: this.mockGetClaimStatus.bind(this),
                getClaimVerificationHash: this.mockGetClaimVerificationHash.bind(this),
            },
            initialState: this.mockInitialState.bind(this),
        };
        const privateState = createClaimPrivateState(params);
        const { currentPrivateState, currentContractState, currentZswapLocalState, } = this.contract.initialState(constructorContext(privateState, "0".repeat(64)));
        this.circuitContext = {
            currentPrivateState,
            currentZswapLocalState,
            originalState: currentContractState,
            transactionContext: new QueryContext(currentContractState.data, sampleContractAddress()),
        };
    }
    static async create(params) {
        await initClaimWitnesses();
        // Use sample data if no params provided
        const sampleState = createSampleClaimPrivateState();
        const finalParams = {
            authorizedProviders: params?.authorizedProviders ?? sampleState.authorizedProviders,
            eligiblePatients: params?.eligiblePatients ?? sampleState.eligiblePatients,
            maxClaimAmounts: params?.maxClaimAmounts ?? sampleState.maxClaimAmounts,
            minServiceDate: params?.minServiceDate ?? sampleState.minServiceDate,
            maxServiceDate: params?.maxServiceDate ?? sampleState.maxServiceDate,
        };
        return new ClaimVerifierSimulator(finalParams);
    }
    getPrivateState() {
        return this.circuitContext.currentPrivateState;
    }
    verifyClaim(args) {
        const { claimType, amount, serviceDate, providerId, patientId, description, metadata, claimHash, signatureR8x, signatureR8y, signatureS, } = args;
        // Create claim object
        const claim = {
            claimType,
            amount,
            serviceDate,
            providerId,
            patientId,
            description,
            metadata,
        };
        // Generate claim ID
        const claimId = this.claimCounter++;
        this.claims.set(claimId, claim);
        // Verify claim using ZK witnesses
        let isValid = false;
        try {
            // Create witness context with mock ledger
            const witnessContext = {
                privateState: this.circuitContext.currentPrivateState,
                ledger: {
                    sequence: 0n,
                    claims: {
                        isEmpty: () => true,
                        size: () => 0n,
                        member: () => false,
                        lookup: () => undefined,
                        [Symbol.iterator]: () => [][Symbol.iterator](),
                    },
                    claimAttested: {
                        isEmpty: () => true,
                        size: () => 0n,
                        member: () => false,
                        lookup: () => undefined,
                        [Symbol.iterator]: () => [][Symbol.iterator](),
                    },
                },
                contractAddress: this.circuitContext.transactionContext.address,
            };
            // 1. Verify signature
            const [_, sigValid] = claimWitnesses.VERIFY_CLAIM_SIGNATURE(witnessContext, claimHash, signatureR8x, signatureR8y, signatureR8x, signatureR8y, signatureS);
            // 2. Verify amount
            const [__, amountValid] = claimWitnesses.VERIFY_CLAIM_AMOUNT(witnessContext, claimType, amount);
            // 3. Verify service date
            const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
            const [___, dateValid] = claimWitnesses.VERIFY_SERVICE_DATE(witnessContext, serviceDate, currentTimestamp);
            // 4. Verify provider authorization
            const [____, providerValid] = claimWitnesses.VERIFY_PROVIDER_AUTHORIZATION(witnessContext, providerId, claimType);
            // 5. Verify patient eligibility
            const [_____, patientValid] = claimWitnesses.VERIFY_PATIENT_ELIGIBILITY(witnessContext, patientId, claimType);
            // All validations must pass
            isValid = sigValid && amountValid && dateValid && providerValid && patientValid;
        }
        catch (error) {
            console.error("Error verifying claim:", error);
            isValid = false;
        }
        // Set claim status
        const status = isValid ? ClaimStatus.APPROVED : ClaimStatus.REJECTED;
        this.claimStatuses.set(claimId, status);
        // Generate verification hash
        const verificationHash = this.generateVerificationHash(claimId, claim, isValid);
        this.verificationHashes.set(claimId, verificationHash);
        return {
            isValid,
            claimId,
            verificationHash,
            status,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
    }
    getClaimStatus(claimId) {
        return this.claimStatuses.get(claimId) ?? ClaimStatus.PENDING;
    }
    getClaimVerificationHash(claimId) {
        return this.verificationHashes.get(claimId) ?? "";
    }
    getClaim(claimId) {
        return this.claims.get(claimId);
    }
    getAllClaims() {
        return new Map(this.claims);
    }
    getClaimStats() {
        const total = this.claims.size;
        let approved = 0;
        let rejected = 0;
        let pending = 0;
        for (const [_, status] of this.claimStatuses) {
            switch (status) {
                case ClaimStatus.APPROVED:
                    approved++;
                    break;
                case ClaimStatus.REJECTED:
                    rejected++;
                    break;
                case ClaimStatus.PENDING:
                    pending++;
                    break;
            }
        }
        return { total, approved, rejected, pending };
    }
    generateVerificationHash(claimId, claim, isValid) {
        // Simple hash generation for demo purposes
        const data = `${claimId}-${claim.claimType}-${claim.amount}-${isValid}-${Date.now()}`;
        return "0x" + Buffer.from(data).toString("hex").padStart(64, "0");
    }
    // Mock contract methods
    mockVerifyClaim(context, claim) {
        // This would normally call the actual contract circuit
        return {
            result: true,
            context,
            proofData: {},
        };
    }
    mockGetClaimStatus(context, claimId) {
        return {
            result: this.getClaimStatus(claimId),
            context,
            proofData: {},
        };
    }
    mockGetClaimVerificationHash(context, claimId) {
        return {
            result: this.getClaimVerificationHash(claimId),
            context,
            proofData: {},
        };
    }
    mockInitialState(context) {
        return {
            currentContractState: {},
            currentPrivateState: this.circuitContext.currentPrivateState,
            currentZswapLocalState: {},
        };
    }
}
//# sourceMappingURL=claim-verifier-simulator.js.map