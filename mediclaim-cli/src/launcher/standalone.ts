// dawn-cli/src/launcher/standalone.ts
// This file is part of ZK Claim Verifier.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';
import { DockerComposeEnvironment, Wait } from 'testcontainers';

import { createLogger } from '../logger-utils.js';
import { run } from '../index.js';
import { currentDir, StandaloneConfig } from '../config.js';

/**
 * Resolve a docker-compose file from common locations so the path
 * keeps working both from src/ and dist/ after compilation.
 */
function resolveComposeFile(): { dir: string; file: string } {
  const cwd = process.cwd();
  const here = path.dirname(new URL(import.meta.url).pathname);

  const candidates = [
    // 1) repo root (when running from dawn-cli/)
    path.resolve(cwd, '../docker-compose.yml'),
    // 2) a local file next to the CLI (if you ever add one)
    path.resolve(cwd, 'claim-verifier-standalone.yml'),
    // 3) when running compiled JS from dist/ (walk up from compiled file)
    path.resolve(here, '../../../docker-compose.yml'),
    path.resolve(here, '../../claim-verifier-standalone.yml'),
    // 4) original code’s assumption (relative to currentDir)
    path.resolve(currentDir, '..', 'claim-verifier-standalone.yml'),
  ];

  for (const full of candidates) {
    if (fs.existsSync(full)) {
      return { dir: path.dirname(full), file: path.basename(full) };
    }
  }

  throw new Error('No compose file found. Looked for:\n' + candidates.map((p) => `  - ${p}`).join('\n'));
}

async function main() {
  // Build a default standalone config (your class sets sensible defaults)
  const config = new StandaloneConfig();
  config.setNetworkId();

  const logger = await createLogger(config.logDir);

  // Find the compose file (root docker-compose.yml preferred)
  const { dir, file } = resolveComposeFile();

  // Spin up the stack and wait for key services to be ready
  const dockerEnv = new DockerComposeEnvironment(dir, [file])
    .withWaitStrategy('claim-verifier-api', Wait.forLogMessage('ZK Claim Verifier API started', 1))
    .withWaitStrategy('attestation-service', Wait.forLogMessage('ZK Claim Verifier Attestation Service listening', 1));

  await run(config, logger, dockerEnv);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
