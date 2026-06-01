import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import {
  createEmailVerificationToken,
  deleteEmailVerificationToken,
  findEmailVerificationToken,
} from "../repositories/emailVerification.repository.js";
import { setEmailVerified } from "../repositories/auth.repository.js";

const EMAIL_VERIFICATION_EXPIRES_IN_HOURS = Number(
  process.env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS || "24",
);

export const issueEmailVerificationToken = async (userId: number) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(
    expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRES_IN_HOURS,
  );

  await createEmailVerificationToken(userId, token, expiresAt);

  return { token, expiresAt };
};

export const verifyEmailToken = async (token: string) => {
  const record = await findEmailVerificationToken(token);
  if (!record) {
    throw new ApiError(400, "Invalid or expired token");
  }

  if (record.expiresAt < new Date()) {
    await deleteEmailVerificationToken(token);
    throw new ApiError(400, "Verification token expired");
  }

  await setEmailVerified(record.userId);
  await deleteEmailVerificationToken(token);

  return { verified: true };
};
