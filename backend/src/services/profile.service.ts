import { ApiError } from "../utils/ApiError.js";
import type { SocialPlatform } from "../../generated/prisma/index.js";
import {
  addUserSkill,
  findUserProfile,
  removeUserSkill,
  replaceSocialLinks,
  upsertUserProfile,
} from "../repositories/profile.repository.js";

const mapProfileResponse = (user: {
  id: number;
  email: string | null;
  username: string;
  profile: {
    name: string | null;
    profilePictureUrl: string | null;
    yearsOfExperience: number | null;
    currentLocation: string | null;
    socialLinks: Array<{ platform: string; url: string }>;
    skills: Array<{ skill: string }>;
  } | null;
}) => ({
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
  },
  profile: {
    name: user.profile?.name ?? null,
    profilePictureUrl: user.profile?.profilePictureUrl ?? null,
    yearsOfExperience: user.profile?.yearsOfExperience ?? null,
    currentLocation: user.profile?.currentLocation ?? null,
  },
  socialLinks:
    user.profile?.socialLinks.map((link) => ({
      platform: link.platform,
      url: link.url,
    })) ?? [],
  skills: user.profile?.skills.map((item) => item.skill) ?? [],
});

export const getProfile = async (userId: number) => {
  const user = await findUserProfile(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return mapProfileResponse(user);
};

export const updateProfile = async (
  userId: number,
  data: {
    name?: string;
    yearsOfExperience?: number;
    currentLocation?: string;
  },
) => {
  await upsertUserProfile(userId, data);

  return getProfile(userId);
};

export const updateSocialLinks = async (
  userId: number,
  links: Array<{ platform: SocialPlatform; url: string }>,
) => {
  await replaceSocialLinks(userId, links);

  return getProfile(userId);
};

export const addSkill = async (userId: number, skill: string) => {
  await addUserSkill(userId, skill.trim());

  return getProfile(userId);
};

export const removeSkill = async (userId: number, skill: string) => {
  await removeUserSkill(userId, skill.trim());

  return getProfile(userId);
};
