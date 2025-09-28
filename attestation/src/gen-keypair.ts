import * as circomlibjs from "circomlibjs";
import crypto from "node:crypto";

function toHex32(bi: bigint): string {
  // 32-byte, 0x-prefixed
  return "0x" + bi.toString(16).padStart(64, "0");
}

(async () => {
  const eddsa = await circomlibjs.buildEddsa();
  const F = eddsa.babyJub.F;

  // Use provided SK or generate a new random 32-byte secret
  const envSkHex = process.env.ATTESTER_SK_HEX?.replace(/^0x/, "");
  const skBuf =
    envSkHex && envSkHex.length === 64
      ? Buffer.from(envSkHex, "hex")
      : crypto.randomBytes(32);

  // Public key (BabyJubJub point): [Ax, Ay] as field elements
  const pub = eddsa.prv2pub(skBuf);
  const Ax = F.toObject(pub[0]) as bigint;
  const Ay = F.toObject(pub[1]) as bigint;

  console.log("ATTESTER_SK_HEX=" + "0x" + skBuf.toString("hex"));
  console.log("ATT_PUB_X=" + toHex32(Ax));
  console.log("ATT_PUB_Y=" + toHex32(Ay));
})();
