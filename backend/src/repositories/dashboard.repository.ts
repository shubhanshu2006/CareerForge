import { prisma } from "../config/prisma.js";
import type { ApplicationStatus } from "../../generated/prisma/index.js";

export const getApplicationStatusCounts = async (userId: number) => {
  const rows = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  return rows.reduce(
    (acc, row) => {
      acc[row.status] = row._count.status;
      return acc;
    },
    {} as Record<ApplicationStatus, number>,
  );
};
