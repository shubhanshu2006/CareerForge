import { prisma } from "../config/prisma.js";

export type IngestionRunFilter = {
  source?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
};

export const findIngestionRuns = (filter: IngestionRunFilter = {}) =>
  prisma.ingestionRun.findMany({
    where: {
      ...(filter.source ? { source: filter.source } : {}),
      ...(filter.fromDate || filter.toDate
        ? {
            startedAt: {
              ...(filter.fromDate ? { gte: filter.fromDate } : {}),
              ...(filter.toDate ? { lte: filter.toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { startedAt: "desc" },
    take: filter.limit ?? 50,
    select: {
      id: true,
      runId: true,
      source: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      totalFetched: true,
      totalInserted: true,
      totalSkipped: true,
      totalFailed: true,
      alertsGenerated: true,
      emailsEnqueued: true,
      createdAt: true,
    },
  });

export const findLatestRunPerSource = () =>
  prisma.ingestionRun.findMany({
    distinct: ["source"],
    orderBy: { startedAt: "desc" },
    select: {
      runId: true,
      source: true,
      startedAt: true,
      completedAt: true,
      durationMs: true,
      totalFetched: true,
      totalInserted: true,
      totalSkipped: true,
      totalFailed: true,
    },
  });

export const getIngestionAggregates = async (filter: {
  fromDate?: Date;
  toDate?: Date;
  source?: string;
}) => {
  const where = {
    ...(filter.source ? { source: filter.source } : {}),
    ...(filter.fromDate || filter.toDate
      ? {
          startedAt: {
            ...(filter.fromDate ? { gte: filter.fromDate } : {}),
            ...(filter.toDate ? { lte: filter.toDate } : {}),
          },
        }
      : {}),
  };

  const [totals, runCount] = await Promise.all([
    prisma.ingestionRun.aggregate({
      where,
      _sum: {
        totalFetched: true,
        totalInserted: true,
        totalSkipped: true,
        totalFailed: true,
        alertsGenerated: true,
        emailsEnqueued: true,
      },
      _avg: {
        durationMs: true,
      },
    }),
    prisma.ingestionRun.count({ where }),
  ]);

  return {
    runCount,
    totalFetched: totals._sum.totalFetched ?? 0,
    totalInserted: totals._sum.totalInserted ?? 0,
    totalSkipped: totals._sum.totalSkipped ?? 0,
    totalFailed: totals._sum.totalFailed ?? 0,
    totalAlerts: totals._sum.alertsGenerated ?? 0,
    totalEmails: totals._sum.emailsEnqueued ?? 0,
    avgDurationMs: Math.round(totals._avg.durationMs ?? 0),
  };
};

export const findIngestionRunByRunId = (runId: string) =>
  prisma.ingestionRun.findUnique({
    where: { runId },
  });
