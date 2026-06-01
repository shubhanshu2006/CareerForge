import { prisma } from "../config/prisma.js";
import type { SocialPlatform } from "../../generated/prisma/index.js";

export const findUserProfile = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          socialLinks: true,
          skills: true,
        },
      },
    },
  });

export const upsertUserProfile = (
  userId: number,
  data: {
    name?: string;
    yearsOfExperience?: number;
    currentLocation?: string;
  },
) =>
  prisma.userProfile.upsert({
    where: { id: userId },
    update: {
      name: data.name,
      yearsOfExperience: data.yearsOfExperience,
      currentLocation: data.currentLocation,
    },
    create: {
      id: userId,
      name: data.name ?? null,
      yearsOfExperience: data.yearsOfExperience ?? null,
      currentLocation: data.currentLocation ?? null,
    },
  });

export const replaceSocialLinks = (
  userId: number,
  links: Array<{
    platform: SocialPlatform;
    url: string;
  }>,
) => {
  const deleteLinks = prisma.userSocialLink.deleteMany({
    where: { userId },
  });

  if (links.length === 0) {
    return prisma.$transaction([deleteLinks]);
  }

  const createLinks = prisma.userSocialLink.createMany({
    data: links.map((link) => ({
      userId,
      platform: link.platform,
      url: link.url,
    })),
    skipDuplicates: true,
  });

  return prisma.$transaction([deleteLinks, createLinks]);
};

export const addUserSkill = (userId: number, skill: string) =>
  prisma.userSkill.upsert({
    where: {
      userId_skill: {
        userId,
        skill,
      },
    },
    update: {},
    create: {
      userId,
      skill,
    },
  });

export const removeUserSkill = (userId: number, skill: string) =>
  prisma.userSkill.deleteMany({
    where: {
      userId,
      skill,
    },
  });
