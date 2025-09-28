export declare const randomBytes: (length: number) => Uint8Array;
export declare function hex32(u8: Uint8Array): string;
export declare function hexToBytes32(hex: string): Uint8Array;
export declare function buildClaimVerificationMessage(F: any, claimHash: Uint8Array, providerId: Uint8Array, patientId: Uint8Array, amount: bigint, serviceDate: bigint): any[];
export declare function signClaimVerification(params: {
    skHex: string;
    claimHash: Uint8Array;
    providerId: Uint8Array;
    patientId: Uint8Array;
    amount: bigint;
    serviceDate: bigint;
}): Promise<{
    R8x: Uint8Array;
    R8y: Uint8Array;
    S: Uint8Array;
}>;
export declare function generateClaimHash(claimData: {
    claimType: number;
    amount: bigint;
    serviceDate: bigint;
    providerId: Uint8Array;
    patientId: Uint8Array;
    description: string;
    metadata: string;
}): Uint8Array;
export declare function stringToBytes32(str: string): Uint8Array;
export declare function bytes32ToString(bytes: Uint8Array): string;
export declare function validateClaimAmount(claimType: number, amount: bigint, maxAmounts: Map<number, bigint>): boolean;
export declare function validateServiceDate(serviceDate: bigint, minDate: bigint, maxDate: bigint, currentTimestamp: bigint): boolean;
export declare function validateProviderAuthorization(providerId: string, claimType: number, authorizedProviders: Map<string, Set<number>>): boolean;
export declare function validatePatientEligibility(patientId: string, eligiblePatients: Set<string>): boolean;
export declare function generateSampleClaim(overrides?: Partial<{
    claimType: number;
    amount: bigint;
    serviceDate: bigint;
    providerId: string;
    patientId: string;
    description: string;
    metadata: string;
}>): {
    claimType: number;
    amount: bigint;
    serviceDate: bigint;
    providerId: Uint8Array<ArrayBufferLike>;
    patientId: Uint8Array<ArrayBufferLike>;
    description: string;
    metadata: string;
};
export declare function generateSampleSignature(): {
    claimHash: Uint8Array;
    signatureR8x: Uint8Array;
    signatureR8y: Uint8Array;
    signatureS: Uint8Array;
};
export declare function generateCompleteSampleClaim(overrides?: Partial<{
    claimType: number;
    amount: bigint;
    serviceDate: bigint;
    providerId: string;
    patientId: string;
    description: string;
    metadata: string;
}>): {
    claimHash: Uint8Array;
    signatureR8x: Uint8Array;
    signatureR8y: Uint8Array;
    signatureS: Uint8Array;
    claimType: number;
    amount: bigint;
    serviceDate: bigint;
    providerId: Uint8Array<ArrayBufferLike>;
    patientId: Uint8Array<ArrayBufferLike>;
    description: string;
    metadata: string;
};
