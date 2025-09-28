import express, { Request, Response } from "express";
import cors from 'cors';

import {
  loadAttesterKeys, // loads/generates BabyJub SK, prints Ax/Ay if generated
  domainHashFromEmail, // email -> poseidon(lowercase(domain)) as bigint
  signClaimVerification, // signs Poseidon(["claim:v1:verification", domainHash, policyMask, expiryDays])
} from "./crypto.js";

import { sendChallengeMail } from "./email.js";
import { putChallenge, verifyChallenge } from "./store.js";
import {
  PolicyTier,
  classifyPoliciesForEmail,
  policiesMaskFromIds,
} from "./categories.js";

const app = express();

app.use(cors())
app.use(express.json());

// -------- utils -------------------------------------------------

/** 6-digit numeric OTP */
function genCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** YYYYMMDD in local time */
function todayYYYYMMDD(): number {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return Number(`${y}${m}${day}`);
}

/** add N days to YYYYMMDD (naive; fine for MVP) */
function addDaysYYYYMMDD(yyyymmdd: number, add: number): number {
  const s = String(yyyymmdd);
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  const dt = new Date(y, m, d);
  dt.setDate(dt.getDate() + add);
  const y2 = dt.getFullYear();
  const m2 = String(dt.getMonth() + 1).padStart(2, "0");
  const d2 = String(dt.getDate()).padStart(2, "0");
  return Number(`${y2}${m2}${d2}`);
}

/** bigint -> 0x-prefixed 32-byte hex */
function toHex32(bi: bigint): string {
  return "0x" + bi.toString(16).padStart(64, "0");
}

// -------- routes ------------------------------------------------

/**
 * POST /verify
 * body: { email: string }
 * Sends a one-time code via MailHog for claim verification attestation.
 */
app.post("/verify", async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "email required" });
    }
    const code = genCode();
    await sendChallengeMail({ to: email, code });
    putChallenge(email, code);
    return res.json({ status: "sent" });
  } catch (e: any) {
    console.error("verify error:", e);
    return res
      .status(500)
      .json({ error: "internal_error", detail: String(e?.message ?? e) });
  }
});

/**
 * POST /attestate
 * body: { email: string, proof: { code: string } }
 *
 * Steps:
 *  1) verify OTP
 *  2) classify policy tiers with LLM
 *  3) build policyMask + domainHash
 *  4) sign claim verification grants (BabyJub/EdDSA over Poseidon)
 *
 * returns:
 * {
 *   domainHash,          // 0x-hex32
 *   policyMask,          // uint32
 *   expiryDays,          // YYYYMMDD
 *   sigR8x, sigR8y, sigS // 0x-hex32 parts
 *   policiesGranted      // number[] (optional, for UI)
 * }
 */
app.post("/attestate", async (req: Request, res: Response) => {
  try {
    const { email, proof } = req.body ?? {};
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "email required" });
    }
    if (!proof || typeof proof.code !== "string") {
      return res.status(400).json({ error: "proof.code required" });
    }

    // 1) verify OTP
    if (!verifyChallenge(email, proof.code)) {
      return res.status(401).json({ error: "invalid_or_expired_code" });
    }

    // 2) classify policy tiers (LLM-only, no fallback)
    const policyIds: PolicyTier[] = await classifyPoliciesForEmail(email);

    // 3) inputs for claim verification grants
    const policyMask = policiesMaskFromIds(policyIds);
    const domainHash = await domainHashFromEmail(email); // bigint (field)
    const today = todayYYYYMMDD();
    const expiryDays = addDaysYYYYMMDD(today, 7); // 7-day grant for claims

    // 4) sign with BabyJub (matches Compact EdDSA.verify)
    const { sk } = await loadAttesterKeys();
    const sig = await signClaimVerification({ domainHash, policyMask, expiryDays }, sk);

    // 5) respond
    return res.json({
      domainHash: toHex32(domainHash),
      policyMask,
      expiryDays,
      sigR8x: sig.R8x,
      sigR8y: sig.R8y,
      sigS: sig.S,
      policiesGranted: policyIds,
    });
  } catch (e: any) {
    console.error("attestate error:", e);
    return res
      .status(500)
      .json({ error: "internal_error", detail: String(e?.message ?? e) });
  }
});

// -------- health & boot ----------------------------------------

app.get("/healthz", (_: Request, res: Response) => res.send("ok"));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8788;
app.listen(PORT, async () => {
  // Load once to print key info if a new key was generated
  await loadAttesterKeys();
  console.log(`ZK Claim Verifier Attestation Service listening on :${PORT}`);
  console.log(
    "SMTP:",
    process.env.SMTP_HOST ?? "127.0.0.1",
    process.env.SMTP_PORT ?? "1025",
  );
});
