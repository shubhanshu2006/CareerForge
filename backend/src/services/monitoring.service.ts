/**
 * Monitoring Service.
 *
 * Business logic for pipeline metrics and health reporting.
 * Wraps the monitoring repository and provides formatted response shapes.
 */

import {
  findIngestionRuns,
  findLatestRunPerSource,
  getIngestionAggregates,
  findIngestionRunByRunId,
} from "../repositories/monitoring.repository.js";

/**
 * Get the pipeline health summary — last run per source + 24h aggregates.
 */
export const getPipelineHealth = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [latestRuns, aggregates24h] = await Promise.all([
    findLatestRunPerSource(),
    getIngestionAggregates({ fromDate: last24h }),
  ]);

  return {
    latestRuns,
    last24Hours: aggregates24h,
  };
};

/**
 * Get paginated run history with optional filtering.
 */
export const getIngestionHistory = (options?: {
  source?: string;
  days?: number;
  limit?: number;
}) => {
  const fromDate = options?.days
    ? new Date(Date.now() - options.days * 24 * 60 * 60 * 1000)
    : undefined;

  return findIngestionRuns({
    source: options?.source,
    fromDate,
    limit: options?.limit ?? 50,
  });
};

/**
 * Get detailed metrics for a single run.
 */
export const getRunDetails = (runId: string) => findIngestionRunByRunId(runId);

/**
 * Get aggregate metrics for a specific time range and source.
 */
export const getAggregateMetrics = (options?: {
  source?: string;
  fromDate?: Date;
  toDate?: Date;
}) => getIngestionAggregates(options ?? {});
