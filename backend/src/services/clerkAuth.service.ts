import { clerkClient, verifyToken } from "@clerk/clerk-sdk-node";
import type { User } from "@clerk/clerk-sdk-node";

import { ApiError } from "../utils/ApiError.js";
import {
  createOAuthAccount,
  createUserWithProfile,
  findOAuthAccountByProviderUserId,
  findUserByEmail,
  findUserByUsername,
  updateUserLoginMetadata,
} from "../repositories/auth.repository.js";

const getClerkSecretKey = () => {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new ApiError(500, "Clerk secret key not configured");
  }
  return secret;
};

const ensureAccountActive = (user: {
  accountEnabled: boolean;
  accountLocked: boolean;
}) => {
  if (!user.accountEnabled) {
    throw new ApiError(403, "Account is disabled");
  }
  if (user.accountLocked) {
    throw new ApiError(403, "Account is locked");
  }
};

const generateUsername = async (seed: string) => {
  const base = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 20);

  const fallback = base.length >= 3 ? base : "user";
  let candidate = fallback;
  let counter = 0;

  while (await findUserByUsername(candidate)) {
    counter += 1;
    candidate = `${fallback}_${counter}`;
  }

  return candidate;
};

const getPrimaryEmail = (user: User) => {
  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    if (primary) {
      return primary.emailAddress;
    }
  }

  return user.emailAddresses[0]?.emailAddress ?? null;
};

const resolveDisplayName = (user: User) => {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || null;
};

const resolveProfilePicture = (user: User) => user.imageUrl || null;

const getOrCreateUserFromClerk = async (user: User) => {
  const providerUserId = user.id;

  const existingAccount = await findOAuthAccountByProviderUserId({
    provider: "CLERK",
    providerUserId,
  });

  if (existingAccount?.user) {
    ensureAccountActive(existingAccount.user);

    await updateUserLoginMetadata(existingAccount.user.id, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    });

    return existingAccount.user;
  }

  const email = getPrimaryEmail(user);
  const profileName = resolveDisplayName(user);
  const profilePictureUrl = resolveProfilePicture(user);

  let dbUser = email ? await findUserByEmail(email) : null;

  if (!dbUser) {
    const seed = user.username || email || `user_${providerUserId}`;
    const username = await generateUsername(seed);

    dbUser = await createUserWithProfile({
      email,
      username,
      passwordHash: null,
      authProvider: "CLERK",
      name: profileName,
      profilePictureUrl,
      emailVerified: Boolean(email),
    });
  }

  ensureAccountActive(dbUser);

  await createOAuthAccount({
    userId: dbUser.id,
    provider: "CLERK",
    providerUserId,
  });

  await updateUserLoginMetadata(dbUser.id, {
    lastLoginAt: new Date(),
    failedLoginAttempts: 0,
  });

  return dbUser;
};

export const authenticateClerkToken = async (token: string) => {
  const payload = await verifyToken(token, {
    secretKey: getClerkSecretKey(),
  });

  if (!payload.sub) {
    throw new ApiError(401, "Invalid Clerk token");
  }

  const clerkUser = await clerkClient.users.getUser(payload.sub);
  const user = await getOrCreateUserFromClerk(clerkUser);

  return {
    userId: user.id,
    role: user.role,
  };
};
