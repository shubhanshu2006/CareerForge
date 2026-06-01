import { prisma } from "../config/prisma.js";

export const createEmailVerificationToken = (
  userId: number,
  token: string,
  expiresAt: Date,
) =>
  prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

export const findEmailVerificationToken = (token: string) =>
  prisma.emailVerificationToken.findUnique({
    where: { token },
  });

export const deleteEmailVerificationToken = (token: string) =>
  prisma.emailVerificationToken.deleteMany({
    where: { token },
  });
