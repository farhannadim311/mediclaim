import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "127.0.0.1";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 1025); // MailHog default
const SMTP_FROM =
  process.env.SMTP_FROM ?? "noreply@claimverifier.midnightodawn.tech";

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

export async function sendChallengeMail(opts: { to: string; code: string }) {
  const { to, code } = opts;
  const text =
    `Your ZK Claim Verifier verification code is: ${code}\n\n` +
    `Enter this code in the claim verification portal to prove you control this inbox and authorize claim verification attestations.`;
  const html =
    `<p>Your ZK Claim Verifier verification code is: <b>${code}</b></p>` +
    `<p>Enter this code in the claim verification portal to prove you control this inbox and authorize claim verification attestations.</p>`;
  await mailer.sendMail({
    from: SMTP_FROM,
    to,
    subject: "ZK Claim Verifier - Verification Code",
    text,
    html,
  });
}
