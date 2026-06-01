import { prisma } from "../config/prisma.js";

export const findPreferencesByUserId = (userId: number) =>
  prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobPreferences: {
        include: {
          titles: true,
          skills: true,
          roleTypes: true,
        },
      },
      preferredCompanies: true,
    },
  });

export const upsertPreferences = async (input: {
  userId: number;
  emailEnabled?: boolean;
  roles?: string[];
  titles?: string[];
  skills?: string[];
  companies?: string[];
}) => {
  const preference = await prisma.userJobPreferences.upsert({
    where: { userId: input.userId },
    update: {
      emailEnabled: input.emailEnabled,
    },
    create: {
      userId: input.userId,
      emailEnabled: input.emailEnabled ?? true,
    },
  });

  const transactions = [
    prisma.userJobPreferenceRoleType.deleteMany({
      where: { preferenceId: preference.id },
    }),
    prisma.userJobPreferenceTitle.deleteMany({
      where: { preferenceId: preference.id },
    }),
    prisma.userJobPreferenceSkill.deleteMany({
      where: { preferenceId: preference.id },
    }),
    prisma.userPreferredCompany.deleteMany({
      where: { userId: input.userId },
    }),
  ];

  if (input.roles && input.roles.length > 0) {
    transactions.push(
      prisma.userJobPreferenceRoleType.createMany({
        data: input.roles.map((roleType) => ({
          preferenceId: preference.id,
          roleType,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.titles && input.titles.length > 0) {
    transactions.push(
      prisma.userJobPreferenceTitle.createMany({
        data: input.titles.map((title) => ({
          preferenceId: preference.id,
          title,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.skills && input.skills.length > 0) {
    transactions.push(
      prisma.userJobPreferenceSkill.createMany({
        data: input.skills.map((skill) => ({
          preferenceId: preference.id,
          skill,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (input.companies && input.companies.length > 0) {
    transactions.push(
      prisma.userPreferredCompany.createMany({
        data: input.companies.map((companyName) => ({
          userId: input.userId,
          companyName,
        })),
        skipDuplicates: true,
      }),
    );
  }

  await prisma.$transaction(transactions);

  return preference;
};
