import { ApiError } from "../utils/ApiError.js";
import {
  findPreferencesByUserId,
  upsertPreferences,
} from "../repositories/preferences.repository.js";

const mapPreferences = (user: {
  jobPreferences: {
    emailEnabled: boolean;
    titles: Array<{ title: string }>;
    skills: Array<{ skill: string }>;
    roleTypes: Array<{ roleType: string }>;
  } | null;
  preferredCompanies: Array<{ companyName: string }>;
}) => ({
  emailEnabled: user.jobPreferences?.emailEnabled ?? true,
  titles: user.jobPreferences?.titles.map((item) => item.title) ?? [],
  skills: user.jobPreferences?.skills.map((item) => item.skill) ?? [],
  roles: user.jobPreferences?.roleTypes.map((item) => item.roleType) ?? [],
  companies: user.preferredCompanies.map((item) => item.companyName),
});

export const getPreferences = async (userId: number) => {
  const user = await findPreferencesByUserId(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return mapPreferences(user);
};

export const updatePreferences = async (input: {
  userId: number;
  emailEnabled?: boolean;
  roles?: string[];
  titles?: string[];
  skills?: string[];
  companies?: string[];
}) => {
  const user = await findPreferencesByUserId(input.userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await upsertPreferences(input);

  return getPreferences(input.userId);
};
