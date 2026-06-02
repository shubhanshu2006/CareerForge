import { ApiError } from "../utils/ApiError.js";
import {
  findJobById,
  findJobs,
  getJobTypeCounts,
  JobFilters,
  JobSort,
} from "../repositories/jobs.repository.js";

export const getJobs = async (input: {
  filters: JobFilters;
  sort: JobSort;
  page: number;
  limit: number;
}) => {
  const skip = (input.page - 1) * input.limit;
  const { total, items } = await findJobs({
    filters: input.filters,
    sort: input.sort,
    skip,
    take: input.limit,
  });

  return {
    total,
    page: input.page,
    limit: input.limit,
    items,
  };
};

export const getJobCounts = () => getJobTypeCounts();

export const getJobById = async (id: number) => {
  const job = await findJobById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }
  return job;
};
