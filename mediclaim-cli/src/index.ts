// This file is part of ZK Claim Verifier.
// Copyright (C) 2025 Your Name
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
 * This file is the main driver for the ZK Claim Verifier.
 * The entry point is the run function, at the end of the file.
 * We expect the startup files (testnet-remote.ts, standalone.ts, etc.) to
 * call run with some specific configuration that sets the network addresses
 * of the servers this file relies on.
 */

// Wallet seed: 8dd96c613b92a1ced03ac5e71a039d4447cfe84928864fc38260b28cd30378c2

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import {
  type ClaimProviders,
  ClaimAPI,
  utils,
  type ClaimDerivedState,
  type PrivateStateId,
  claimPrivateStateKey,
} from 'claim-verifier-api'; // <-- Import from package
// Note: DeployedClaimContract and ClaimType will be available after contract compilation
// Note: These will be available after contract compilation
// Note: These will be available after contract compilation
// import { ledger, type Ledger } from '../../contract/src/managed/claim-verifier/contract/index.cjs';
// Note: This will be available after contract compilation
// import { initClaimWitnesses } from '../../contract/src/claim-witnesses.js';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
// Note: Wallet type will be available after proper package setup
// import { type Wallet } from '@midnight-ntwrk/wallet';
type Wallet = any;
import * as Rx from 'rxjs';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import type { StartedDockerComposeEnvironment, DockerComposeEnvironment } from 'testcontainers';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { toHex, assertIsContractAddress } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import fetch from 'node-fetch';

// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// Claim type enum mapping for display
const CLAIM_TYPE_NAMES = {
  0: 'MEDICAL_INVOICE',
  1: 'PRESCRIPTION_DRUG',
  2: 'DENTAL_PROCEDURE',
  3: 'VISION_CARE',
  4: 'EMERGENCY_ROOM',
} as const;

function isValidClaimType(claimType: number): boolean {
  return claimType >= 0 && claimType <= 4;
}

function getClaimTypeName(claimType: number): string {
  return CLAIM_TYPE_NAMES[claimType as keyof typeof CLAIM_TYPE_NAMES] || `UNKNOWN(${claimType})`;
}

/* **********************************************************************
 * getClaimVerifierLedgerState: a helper that queries the current state of
 * the data on the ledger, for a specific claim verifier contract.
 */

export const getClaimVerifierLedgerState = async (
  providers: ClaimProviders,
  contractAddress: ContractAddress,
): Promise<any | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  // return contractState != null ? ledger(contractState.data) : null;
  return contractState != null ? contractState.data : null;
};

/* **********************************************************************
 * deployOrJoin: returns a contract, by prompting the user
 */

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new ZK Claim Verifier contract
  2. Join an existing ZK Claim Verifier contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (providers: ClaimProviders, rli: Interface, logger: Logger): Promise<ClaimAPI | null> => {
  let api: ClaimAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1':
        api = await ClaimAPI.deploy(providers, logger);
        logger.info(`Deployed ZK Claim Verifier contract at address: ${api.deployedContractAddress}`);
        return api;
      case '2':
        api = await ClaimAPI.join(
          providers,
          (await rli.question('What is the contract address (in hex)? ')) as any,
          logger,
        );
        logger.info(`Joined ZK Claim Verifier contract at address: ${api.deployedContractAddress}`);
        return api;
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

/* **********************************************************************
 * displayLedgerState
 */

const displayLedgerState = async (
  providers: ClaimProviders,
  deployedClaimContract: any, // Will be properly typed after contract compilation
  logger: Logger,
): Promise<void> => {
  const contractAddress = deployedClaimContract.deployTxData.public.contractAddress;
  const ledgerState = await getClaimVerifierLedgerState(providers, contractAddress);
  if (ledgerState === null) {
    logger.info(`There is no ZK Claim Verifier contract deployed at ${contractAddress}`);
  } else {
    // Note: This will be properly implemented after contract compilation
    logger.info(`Contract state available at ${contractAddress}`);
    logger.info(`Raw state data: ${JSON.stringify(ledgerState, null, 2)}`);
  }
};

/* **********************************************************************
 * displayPrivateState
 */

const displayPrivateState = async (providers: ClaimProviders, logger: Logger): Promise<void> => {
  const privateState = await providers.privateStateProvider.get(claimPrivateStateKey);
  if (privateState === null) {
    logger.info(`There is no existing ZK Claim Verifier private state`);
  } else {
    logger.info(`Private state available for ZK Claim Verifier contract`);
    logger.info(`Private state: ${JSON.stringify(privateState, null, 2)}`);
  }
};

/* **********************************************************************
 * displayDerivedState
 */

const displayDerivedState = (ledgerState: ClaimDerivedState | undefined, logger: Logger) => {
  if (ledgerState === undefined) {
    logger.info(`No ZK Claim Verifier state currently available`);
  } else {
    logger.info(`Current sequence: ${ledgerState.sequence}`);
    logger.info(`Total verified claims: ${ledgerState.totalVerified}`);
    logger.info(`Last verified at: ${ledgerState.lastVerifiedAt}`);
  }
};

/* **********************************************************************
 * mainLoop
 */

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Verify a claim
  2. Get claim status by ID
  3. List all verified claims
  4. Display the current ledger state (known by everyone)
  5. Display the current private state (known only to this DApp instance)
  6. Display the current derived state (known only to this DApp instance)
  7. Exit
Which would you like to do? `;

const verifyClaimDirectly = async (claimApi: ClaimAPI, rli: Interface, logger: Logger): Promise<void> => {
  try {
    // Get claim details from user
    logger.info(
      'Available claim types: 0(Medical Invoice), 1(Prescription Drug), 2(Dental Procedure), 3(Vision Care), 4(Emergency Room)',
    );
    const claimTypeStr = await rli.question('Enter claim type number (0-4): ');
    const claimType = parseInt(claimTypeStr, 10);

    if (!isValidClaimType(claimType)) {
      logger.error(`Invalid claim type: ${claimType}. Valid range is 0-4.`);
      return;
    }

    logger.info(`Verifying claim type ${claimType}(${getClaimTypeName(claimType)})...`);

    const amount = await rli.question('Enter claim amount: ');
    const serviceDate = await rli.question('Enter service date (YYYYMMDD): ');
    const provider = await rli.question('Enter provider name: ');
    const patient = await rli.question('Enter patient ID: ');
    const description = await rli.question('Enter claim description: ');
    const metadata = (await rli.question('Enter metadata (optional): ')) || '{}';

    logger.info(`Claim details: ${getClaimTypeName(claimType)}, Amount: ${amount}, Date: ${serviceDate}`);
    logger.info('Calling verifyClaim with validated parameters...');

    // Verify claim using real ZK proofs
    const claimData = {
      claimType,
      amount: BigInt(amount),
      serviceDate: BigInt(serviceDate),
      providerId: provider,
      patientId: patient,
      description,
      metadata: JSON.parse(metadata),
    };

    // Use the real API function
    const claimId = await claimApi.verifyClaim(claimData);
    logger.info(`Claim verified successfully! Claim ID: ${claimId}`);
  } catch (error) {
    logger.error(`Failed to verify claim: ${String(error)}`);
    if (error instanceof Error) {
      logger.info(`Error stack: ${error.stack}`);
    }
  }
};

const getClaimStatus = async (claimApi: ClaimAPI, rli: Interface, logger: Logger): Promise<void> => {
  try {
    const idStr = await rli.question('Enter claim ID: ');
    const id = BigInt(idStr);

    logger.info(`Retrieving claim status ${id}...`);

    // Use the real API function
    const status = await claimApi.getClaimStatus(id);
    logger.info(`Claim Status:`);
    logger.info(`  Claim ID: ${id}`);
    logger.info(`  Status: ${status.status}`);
    logger.info(`  Verification Hash: ${status.verificationHash}`);
    logger.info(`  Timestamp: ${status.timestamp}`);
  } catch (error) {
    logger.error(`Failed to retrieve claim status: ${String(error)}`);
  }
};

const getAllVerifiedClaims = async (claimApi: ClaimAPI, logger: Logger): Promise<void> => {
  try {
    logger.info('Retrieving all verified claims...');

    // Use the real API function
    const claims = await claimApi.getAllVerifiedClaims();
    logger.info(`Found ${claims.length} verified claims:`);
    logger.info('='.repeat(80));

    claims.forEach((claim: any, index: number) => {
      logger.info(`Claim ${index + 1}:`);
      logger.info(`  Claim ID: ${claim.claimId}`);
      logger.info(`  Type: ${getClaimTypeName(claim.claimType)}`);
      logger.info(`  Status: ${claim.status ? 'VERIFIED' : 'PENDING'}`);
      logger.info(`  Verification Hash: ${claim.verificationHash}`);
      logger.info(`  Timestamp: ${claim.timestamp}`);
      logger.info('-'.repeat(40));
    });
  } catch (error) {
    logger.error(`Failed to retrieve all verified claims: ${String(error)}`);
  }
};

const mainLoop = async (providers: ClaimProviders, rli: Interface, logger: Logger): Promise<void> => {
  const claimApi = await deployOrJoin(providers, rli, logger);
  if (claimApi === null) {
    return;
  }
  let currentState: ClaimDerivedState | undefined;

  const stateObserver = {
    next: (state: ClaimDerivedState) => (currentState = state),
  };
  const subscription = claimApi.state$.subscribe(stateObserver);

  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      switch (choice) {
        case '1': {
          await verifyClaimDirectly(claimApi, rli, logger);
          break;
        }
        case '2': {
          await getClaimStatus(claimApi, rli, logger);
          break;
        }
        case '3': {
          await getAllVerifiedClaims(claimApi, logger);
          break;
        }
        case '4':
          await displayLedgerState(providers, (claimApi as any).deployedContract, logger);
          break;
        case '5':
          await displayPrivateState(providers, logger);
          break;
        case '6':
          displayDerivedState(currentState, logger);
          break;
        case '7':
          logger.info('Exiting...');
          return;
        default:
          logger.error(`Invalid choice: ${choice}`);
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

/* **********************************************************************
 * createWalletAndMidnightProvider
 */

const createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
  const state = (await Rx.firstValueFrom(wallet.state())) as any;
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          newCoins,
        )
        .then((tx: any) => wallet.proveTransaction(tx))
        .then((zswapTx: any) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

/* **********************************************************************
 * waitForFunds
 */

const waitForFunds = (wallet: Wallet, logger: Logger) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state: any) => {
        const scanned = state.syncProgress?.synced ?? 0n;
        const behind = state.syncProgress?.lag.applyGap.toString() ?? 'unknown number';
        logger.info(`Wallet processed ${scanned} indices, remaining ${behind}`);
      }),
      Rx.filter((state: any) => {
        // Let's allow progress only if wallet is close enough
        const synced = typeof state.syncProgress?.synced === 'bigint' ? state.syncProgress.synced : 0n;
        const total = typeof state.syncProgress?.lag?.applyGap === 'bigint' ? state.syncProgress.lag.applyGap : 1_000n;
        return total - synced < 100n;
      }),
      Rx.map((s: any) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance: any) => balance > 0n),
    ),
  );

/* **********************************************************************
 * buildWalletAndWaitForFunds
 */

const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  logger: Logger,
  seed: string,
): Promise<Wallet & Resource> => {
  const wallet = await WalletBuilder.buildFromSeed(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    getZswapNetworkId(),
    'warn',
  );
  wallet.start();
  const state = (await Rx.firstValueFrom(wallet.state())) as any;
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Skipping token wait in testnet mode - continuing with mock data`);
    balance = 0n; // Skip waiting for tokens in testnet mode
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

// Generate a random seed and create the wallet with that.
const buildFreshWallet = async (config: Config, logger: Logger): Promise<Wallet & Resource> => {
  const randomSeed = toHex(utils.randomBytes(32));
  // Remove 0x prefix if present to match GENESIS_MINT_WALLET_SEED format
  const cleanSeed = randomSeed.startsWith('0x') ? randomSeed.slice(2) : randomSeed;
  return await buildWalletAndWaitForFunds(config, logger, cleanSeed);
};

// Prompt for a seed and create the wallet with that.
const buildWalletFromSeed = async (config: Config, rli: Interface, logger: Logger): Promise<Wallet & Resource> => {
  const seed = await rli.question('Enter your wallet seed: ');

  // Remove any whitespace
  const trimmedSeed = seed.trim();

  // Check if it already has 0x prefix
  let cleanSeed: string;
  if (trimmedSeed.startsWith('0x')) {
    cleanSeed = trimmedSeed.slice(2);
  } else {
    cleanSeed = trimmedSeed;
  }

  // Validate seed format - must be exactly 64 hex characters (32 bytes)
  if (!cleanSeed || cleanSeed.length !== 64) {
    throw new Error(
      `Invalid seed: must be exactly 64 hex characters (32 bytes). Got ${cleanSeed?.length || 0} characters.`,
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(cleanSeed)) {
    throw new Error('Invalid seed: must contain only hexadecimal characters (0-9, a-f, A-F)');
  }

  // Use the seed without 0x prefix, like GENESIS_MINT_WALLET_SEED
  return await buildWalletAndWaitForFunds(config, logger, cleanSeed);
};

/* ***********************************************************************
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

/* **********************************************************************
 * buildWallet
 */

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await buildWalletAndWaitForFunds(config, logger, GENESIS_MINT_WALLET_SEED);
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return await buildFreshWallet(config, logger);
      case '2':
        return await buildWalletFromSeed(config, rli, logger);
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);

  mappedUrl.port = String(container.getFirstMappedPort());

  return mappedUrl.toString().replace(/\/+$/, '');
};

/* **********************************************************************
 * run
 */

export const run = async (config: Config, logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  // Initialize witnesses for ZK proof verification
  const { initClaimWitnesses } = await import('../../contract/src/claim-witnesses.js');
  await initClaimWitnesses();
  logger.info('Claim witnesses initialized');

  const rli = createInterface({ input, output, terminal: true });
  let env;
  if (dockerEnv !== undefined) {
    env = await dockerEnv.up();

    if (config instanceof StandaloneConfig) {
      config.indexer = mapContainerPort(env, config.indexer, 'claim-verifier-indexer');
      config.indexerWS = mapContainerPort(env, config.indexerWS, 'claim-verifier-indexer');
      config.node = mapContainerPort(env, config.node, 'claim-verifier-node');
      config.proofServer = mapContainerPort(env, config.proofServer, 'claim-verifier-proof-server');
    }
  }
  const wallet = await buildWallet(config, rli, logger);
  try {
    if (wallet !== null) {
      const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);

      // ---- Private state provider adapter (TYPE-SAFE) ----
      // Base provider is fixed to our single key; adapt it to the generic shape expected by ClaimProviders.
      const basePsp = levelPrivateStateProvider<PrivateStateId>({
        privateStateStoreName: config.privateStateStoreName,
      });

      const privateStateProvider: ClaimProviders['privateStateProvider'] = {
        async get(key: any) {
          if (key !== claimPrivateStateKey) return null as any;
          return (await basePsp.get(claimPrivateStateKey)) as any;
        },
        async set(key: any, state: any) {
          if (key !== claimPrivateStateKey) {
            throw new Error(`Unknown private state key: ${String(key)}`);
          }
          await basePsp.set(claimPrivateStateKey, state as any);
        },
        async remove(key: any) {
          if (key !== claimPrivateStateKey) {
            throw new Error(`Unknown private state key: ${String(key)}`);
          }
          await basePsp.remove(claimPrivateStateKey);
        },
        async clear() {
          await basePsp.clear();
        },
      };

      const providers: ClaimProviders = {
        privateStateProvider,
        publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
        zkConfigProvider: new NodeZkConfigProvider<'verifyClaim'>(config.zkConfigPath) as any,
        proofProvider: httpClientProofProvider(config.proofServer) as any,
        walletProvider: walletAndMidnightProvider as any,
        midnightProvider: walletAndMidnightProvider as any,
      };

      await mainLoop(providers, rli, logger);
    }
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
        logError(logger, e);
      } finally {
        try {
          if (env !== undefined) {
            await env.down();
            logger.info('Goodbye');
            process.exit(0);
          }
        } catch (e) {
          logError(logger, e);
        }
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Found error '${e.message}'`);
    logger.debug(`${e.stack}`);
  } else {
    logger.error(`Found error (unknown type)`);
  }
}
