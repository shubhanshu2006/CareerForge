import { prisma } from "../config/prisma.js";

export const createNotifications = (
  input: Array<{ userId: number; title: string; message: string }>,
) =>
  prisma.notification.createMany({
    data: input.map((item) => ({
      userId: item.userId,
      title: item.title,
      message: item.message,
      type: "JOB_ALERT",
    })),
  });

export const createJobAlerts = (
  input: Array<{ userId: number; jobId: number }>,
) =>
  prisma.jobAlert.createMany({
    data: input,
    skipDuplicates: true,
  });

export const findMatchingUsersForJob = async (input: {
  company: string;
  title: string;
}) =>
  prisma.user.findMany({
    where: {
      email: { not: null },
      accountEnabled: true,
      accountLocked: false,
      emailVerified: true,
      AND: [
        {
          OR: [
            {
              jobPreferences: {
                is: {
                  emailEnabled: true,
                },
              },
            },
            {
              jobPreferences: {
                is: null,
              },
            },
          ],
        },
        {
          OR: [
            {
              preferredCompanies: {
                some: {
                  companyName: {
                    equals: input.company,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              jobPreferences: {
                is: {
                  titles: {
                    some: {
                      title: {
                        equals: input.title,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    select: { id: true, email: true },
  });
