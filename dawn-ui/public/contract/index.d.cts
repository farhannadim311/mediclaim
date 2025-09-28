import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Board { GOV_POLITICS = 0,
                    HEALTHCARE = 1,
                    INFRA = 2,
                    EDUCATION = 3,
                    MEDIA = 4,
                    CORPORATE = 5,
                    LEGAL = 6,
                    ENVIRONMENT = 7,
                    CIVIL = 8,
                    CITIZEN = 9
}

export type Report = { board: Board;
                       title: string;
                       shortDescription: string;
                       metadata: string
                     };

export type Witnesses<T> = {
  VERIFY_GRANTS_SIGNATURE(context: __compactRuntime.WitnessContext<Ledger, T>,
                          domainHash_0: Uint8Array,
                          boardsMask_0: bigint,
                          expiryDays_0: bigint,
                          R8x_0: Uint8Array,
                          R8y_0: Uint8Array,
                          S_0: Uint8Array): [T, boolean];
  IS_BOARD_GRANTED(context: __compactRuntime.WitnessContext<Ledger, T>,
                   boardsMask_0: bigint,
                   board_0: Board): [T, boolean];
}

export type ImpureCircuits<T> = {
  postReportWithAttestation(context: __compactRuntime.CircuitContext<T>,
                            board_0: Board,
                            title_0: string,
                            shortDescription_0: string,
                            metadata_0: string,
                            domainHash_0: Uint8Array,
                            boardsMask_0: bigint,
                            expiryDays_0: bigint,
                            sigR8x_0: Uint8Array,
                            sigR8y_0: Uint8Array,
                            sigS_0: Uint8Array,
                            todayDays_0: bigint): __compactRuntime.CircuitResults<T, bigint>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  postReportWithAttestation(context: __compactRuntime.CircuitContext<T>,
                            board_0: Board,
                            title_0: string,
                            shortDescription_0: string,
                            metadata_0: string,
                            domainHash_0: Uint8Array,
                            boardsMask_0: bigint,
                            expiryDays_0: bigint,
                            sigR8x_0: Uint8Array,
                            sigR8y_0: Uint8Array,
                            sigS_0: Uint8Array,
                            todayDays_0: bigint): __compactRuntime.CircuitResults<T, bigint>;
}

export type Ledger = {
  readonly sequence: bigint;
  reportTitle: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
  reportBoard: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Board;
    [Symbol.iterator](): Iterator<[bigint, Board]>
  };
  reportShortDescription: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
  reportMetadata: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): string;
    [Symbol.iterator](): Iterator<[bigint, string]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
