import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Policy tiers used by the ZK Claim Verifier.
 * IDs are stable and can be mirrored on-chain or in your circuit policy registry.
 */
export enum PolicyTier {
  BASIC_1000 = 1,   // policyMax = 1_000
  PLUS_2500 = 2,    // policyMax = 2_500
  PREMIUM_5000 = 3, // policyMax = 5_000
}

/** Map from tier to numeric policyMax used as circuit public input. */
export const POLICY_MAX: Record<PolicyTier, number> = {
  [PolicyTier.BASIC_1000]: 1000,
  [PolicyTier.PLUS_2500]: 2500,
  [PolicyTier.PREMIUM_5000]: 5000,
};

/** Optional model (Vercel AI SDK). Only initialized if OPENAI_API_KEY is present. */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = (process.env.LLM_MODEL ?? '').trim() || 'gpt-4.1-mini';

// Create provider lazily/conditionally to satisfy exactOptionalPropertyTypes
const openai = OPENAI_API_KEY ? createOpenAI({ apiKey: OPENAI_API_KEY }) : null;

/** Strict schema: array of policy IDs (1..3). */
const PoliciesSchema = z.object({
  policies: z.array(z.number().int().min(1).max(3)),
});

/** Build a compact classification prompt. */
function buildPrompt(email: string): string {
  return `
User email: "${email}"

Available policy tiers (choose all that apply, return their numeric IDs):
1. BASIC_1000   – small claims, invoiceAmount <= 1000
2. PLUS_2500    – medium claims, invoiceAmount <= 2500
3. PREMIUM_5000 – large claims, invoiceAmount <= 5000

Rules of thumb:
- Everyone gets BASIC_1000.
- If the domain suggests a hospital/provider network or insurer staff, include PLUS_2500.
- If the user is a senior adjuster, admin, or trusted domain (insurer HQ), include PREMIUM_5000.

Return strictly:
{ "policies": number[] }
`.trim();
}

/**
 * Classify policy tiers for a user/email. If the model/env isn’t configured,
 * we fall back to the minimal safe tier (BASIC_1000).
 */
export async function classifyPoliciesForEmail(email: string): Promise<PolicyTier[]> {
  if (!OPENAI_API_KEY || !openai) {
    return [PolicyTier.BASIC_1000];
  }

  const { object } = await generateObject({
    model: openai(MODEL),
    schema: PoliciesSchema,
    temperature: 0,
    maxOutputTokens: 128,
    prompt: buildPrompt(email),
    system: 'Return only valid JSON matching the schema. No prose.',
  });

  const unique = Array.from(new Set(object.policies)).filter((n: unknown): n is number => typeof n === 'number' && n >= 1 && n <= 3);
  const withDefault = unique.length ? unique : [PolicyTier.BASIC_1000];
  return withDefault as PolicyTier[];
}

/**
 * Create a bitmask from policy IDs (1-based).
 * Example: [1, 3] -> 0b101 = 5
 */
export function policiesMaskFromIds(ids: PolicyTier[]): number {
  return ids.reduce((m, id) => m | (1 << (id - 1)), 0) >>> 0;
}

/**
 * Given selected tiers, pick the highest policyMax to use
 * as the circuit public input for `invoiceAmount <= policyMax`.
 */
export function maxCoverageFromPolicies(ids: PolicyTier[]): number {
  const vals = ids.map((id) => POLICY_MAX[id]).filter((n) => Number.isFinite(n));
  return vals.length ? Math.max(...vals) : POLICY_MAX[PolicyTier.BASIC_1000];
}
