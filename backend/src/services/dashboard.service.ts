import type { ApplicationStatus } from "../../generated/prisma/index.js";
import {
  getApplicationStatusCounts,
  getRecentApplications,
} from "../repositories/dashboard.repository.js";

const getCount = (
  counts: Partial<Record<ApplicationStatus, number>>,
  status: ApplicationStatus,
) => counts[status] ?? 0;

export const getDashboardMetrics = async (userId: number) => {
  const [counts, recent] = await Promise.all([
    getApplicationStatusCounts(userId),
    getRecentApplications(userId, 10),
  ]);

  const savedJobs = getCount(counts, "SAVED");
  const totalApplications =
    Object.values(counts).reduce((sum, v) => sum + v, 0) - savedJobs;

  // Build statusBreakdown matching what the frontend uses
  const statusBreakdown: Record<string, number> = {};
  for (const [status, count] of Object.entries(counts)) {
    statusBreakdown[status] = count;
  }

  return {
    totalApplications,
    statusBreakdown,
    recentApplications: recent.map((app) => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      job: app.job
        ? { id: app.job.id, title: app.job.title, company: app.job.company }
        : undefined,
    })),
  };
};
