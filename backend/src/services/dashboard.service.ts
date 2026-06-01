import type { ApplicationStatus } from "../../generated/prisma/index.js";
import { getApplicationStatusCounts } from "../repositories/dashboard.repository.js";

const getCount = (
  counts: Partial<Record<ApplicationStatus, number>>,
  status: ApplicationStatus,
) => counts[status] ?? 0;

export const getDashboardMetrics = async (userId: number) => {
  const counts = await getApplicationStatusCounts(userId);

  const savedJobs = getCount(counts, "SAVED");
  const offers = getCount(counts, "OFFER");
  const rejections = getCount(counts, "REJECTED");
  const interviews =
    getCount(counts, "INTERVIEW") + getCount(counts, "FINAL_ROUND");
  const applications =
    Object.values(counts).reduce((sum, value) => sum + value, 0) - savedJobs;

  return {
    savedJobs,
    applications,
    offers,
    rejections,
    interviews,
  };
};
