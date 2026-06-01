import crypto from "crypto";

/**
 * Generates a deterministic SHA-256 dedupe key for a job.
 *
 * The same job posted on two different sources must always produce the same
 * key so we never surface it twice to users. This is why applyUrl is
 * intentionally excluded — the same role can appear on Greenhouse AND the
 * company's own site with completely different apply URLs.
 *
 * Formula: SHA-256( company | title | location ) — all lower-cased and
 * whitespace-normalised before hashing.
 *
 * This formula is mirrored exactly in the backend's buildDedupeKey function
 * (backend/src/services/jobIngestion.service.ts) so that keys written by the
 * scripts layer and keys computed by the backend are always identical.
 */
export const generateDedupeKey = (input: {
  company: string;
  title: string;
  location?: string | null;
}): string => {
  const normalize = (v: string | null | undefined): string =>
    (v ?? "").toLowerCase().replace(/\s+/g, " ").trim();

  const raw = [
    normalize(input.company),
    normalize(input.title),
    normalize(input.location),
  ].join("|");

  return crypto.createHash("sha256").update(raw).digest("hex");
};
