import { prisma } from "../config/prisma.js";

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
  });

export const findUserByUsername = (username: string) =>
  prisma.user.findUnique({
    where: { username },
  });

export const createUserWithProfile = async (input: {
  email: string | null;
  username: string;
  passwordHash: string | null;
  authProvider: "LOCAL" | "GOOGLE" | "CLERK";
  name?: string | null;
  profilePictureUrl?: string | null;
  emailVerified?: boolean;
}) =>
  prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      password: input.passwordHash,
      authProvider: input.authProvider,
      emailVerified: input.emailVerified ?? false,
      profile: {
        create: {
          name: input.name ?? null,
          profilePictureUrl: input.profilePictureUrl ?? null,
        },
      },
    },
  });

export const updateUserLoginMetadata = (
  userId: number,
  data: {
    failedLoginAttempts?: number;
    accountLocked?: boolean;
    lastLoginAt?: Date;
  },
) =>
  prisma.user.update({
    where: { id: userId },
    data,
  });

export const setEmailVerified = (userId: number) =>
  prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
    },
  });

export const createRefreshToken = (
  userId: number,
  token: string,
  expiryDate: Date,
) =>
  prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiryDate,
    },
  });

export const findRefreshToken = (token: string) =>
  prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

export const deleteRefreshToken = (token: string) =>
  prisma.refreshToken.deleteMany({
    where: { token },
  });

export const findOAuthAccount = (input: {
  userId: number;
  provider: "LOCAL" | "GOOGLE" | "CLERK";
}) =>
  prisma.oAuthAccount.findFirst({
    where: {
      userId: input.userId,
      provider: input.provider,
    },
  });

export const createOAuthAccount = (input: {
  userId: number;
  provider: "LOCAL" | "GOOGLE" | "CLERK";
  providerUserId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
}) =>
  prisma.oAuthAccount.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      providerUserId: input.providerUserId ?? null,
      accessToken: input.accessToken ?? null,
      refreshToken: input.refreshToken ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
    },
  });

export const updateOAuthAccount = (
  id: number,
  data: {
    providerUserId?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenExpiresAt?: Date | null;
  },
) =>
  prisma.oAuthAccount.update({
    where: { id },
    data,
  });

export const findOAuthAccountByProviderUserId = (input: {
  provider: "LOCAL" | "GOOGLE" | "CLERK";
  providerUserId: string;
}) =>
  prisma.oAuthAccount.findFirst({
    where: {
      provider: input.provider,
      providerUserId: input.providerUserId,
    },
    include: { user: true },
  });
