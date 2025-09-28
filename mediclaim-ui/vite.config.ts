// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tailwindcss from '@tailwindcss/vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: './.vite',
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunk for WASM modules to avoid top-level await issues
          wasm: ['@midnight-ntwrk/onchain-runtime'],
        },
      },
    },
    commonjsOptions: {
      // Transform CommonJS to ESM more aggressively
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      // Needed for Node.js modules
      ignoreDynamicRequires: true,
      // Include the contract directory for transformation
      include: [/node_modules/, /contract\/src\/managed\/dawn\/contract/],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // Configure WASM plugin with more options
    wasm(),
    topLevelAwait({
      // Be more permissive with top-level await
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
    // Custom resolver for handling problematic modules
    {
      name: 'wasm-module-resolver',
      resolveId(source, importer) {
        // Special handling for the problematic module
        if (
          source === '@midnight-ntwrk/onchain-runtime' &&
          importer &&
          importer.includes('@midnight-ntwrk/compact-runtime')
        ) {
          // Force dynamic import for this case
          return {
            id: source,
            external: false,
            moduleSideEffects: true,
          };
        }
        return null;
      },
    },
    // Custom plugin to handle CommonJS contract files
    {
      name: 'contract-commonjs-transformer',
      transform(code, id) {
        // Transform CommonJS contract files to ESM
        if (id.includes('contract/src/managed/dawn/contract/index.cjs')) {
          // Create a proper ESM wrapper
          const esmCode = `
// Create a mock exports object
const exports = {};

${code.replace(/^'use strict';/, '').replace(/const __compactRuntime = require\('@midnight-ntwrk\/compact-runtime'\);/, "import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';")}

// Export the needed values
export { Contract, ledger, pureCircuits, contractReferenceLocations };
export { Board };
`;

          return {
            code: esmCode,
            map: null,
          };
        }
        return null;
      },
    },
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
      // Configure ESBuild to handle Node.js-style modules
      platform: 'browser',
      format: 'esm',
      loader: {
        '.wasm': 'binary',
      },
    },
    // Explicitly include these packages for pre-bundling, but force ESM
    include: [
      '@midnight-ntwrk/compact-runtime',
      // Include contract files for proper CommonJS transformation
      '../contract/src/managed/dawn/contract/index.cjs',
      '@tiptap/pm/state',
      '@tiptap/pm/view',
      '@tiptap/pm/model',
      '@tiptap/pm/commands',
      '@tiptap/pm/transform',
      '@tiptap/pm/schema-list',
      '@tiptap/pm/dropcursor',
      '@tiptap/pm/gapcursor',
    ],
    // Exclude WASM files and modules with top-level await from optimization
    exclude: [
      '@midnight-ntwrk/onchain-runtime',
      '@midnight-ntwrk/onchain-runtime/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime/midnight_onchain_runtime_wasm.js',
    ],
  },
  define: {},
  // Add specific import configuration for more control
  resolve: {
    // Ensure WASM files are loaded properly
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@': '/src',
    },
    dedupe: ['react', 'react-dom'],
  },
});
