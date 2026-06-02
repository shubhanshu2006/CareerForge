import { describe, expect, it, vi } from "vitest";

import { ingestJobs } from "../services/jobIngestion.service.js";

// ─── Mock the repository layer ────────────────────────────────────────────────

vi.mock("../repositories/jobIngestion.repository.js", () => ({
  findJobByDedupe: vi.fn(),
  createJob: vi.fn(),
}));

// ─── Mock the matching service (actual dependency of jobIngestion.service.ts) ─
// jobIngestion.service.ts calls matchJobToUsers from job-matching.service.ts,
// NOT createAlertsForJob from jobAlerts.service.ts.

vi.mock("../services/job-matching.service.js", () => ({
  matchJobToUsers: vi.fn().mockResolvedValue({ notified: 0 }),
}));

// ─── Mock the BullMQ queues to prevent Redis connections in tests ─────────────

vi.mock("../queues/index.js", () => ({
  emailQueue: { add: vi.fn() },
  jobIngestionQueue: { add: vi.fn() },
}));

// ─── Typed references to mocks ────────────────────────────────────────────────

const ingestionRepo =
  (await import("../repositories/jobIngestion.repository.js")) as unknown as {
    findJobByDedupe: ReturnType<typeof vi.fn>;
    createJob: ReturnType<typeof vi.fn>;
  };

const matchingService =
  (await import("../services/job-matching.service.js")) as unknown as {
    matchJobToUsers: ReturnType<typeof vi.fn>;
  };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("jobIngestion.service ingestJobs", () => {
  it("skips duplicates based on dedupe key", async () => {
    ingestionRepo.findJobByDedupe.mockResolvedValue({ id: 99 });

    const result = await ingestJobs([
      {
        source: "GREENHOUSE",
        company: "Acme",
        title: "Backend Engineer",
        applyUrl: "https://jobs.acme.com/1",
      },
    ]);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    // matchJobToUsers must NOT be called for skipped jobs
    expect(matchingService.matchJobToUsers).not.toHaveBeenCalled();
  });

  it("creates job and calls matchJobToUsers for new jobs", async () => {
    ingestionRepo.findJobByDedupe.mockResolvedValue(null);
    ingestionRepo.createJob.mockResolvedValue({
      id: 10,
      company: "Acme",
      title: "Backend Engineer",
      location: null,
      isRemote: false,
      description: null,
    });
    matchingService.matchJobToUsers.mockResolvedValue({ notified: 2 });

    const result = await ingestJobs([
      {
        source: "GREENHOUSE",
        company: "Acme",
        title: "Backend Engineer",
        applyUrl: "https://jobs.acme.com/1",
      },
    ]);

    expect(result.created).toBe(1);
    expect(result.alertsGenerated).toBe(2);
    expect(result.emailsEnqueued).toBe(2);

    expect(matchingService.matchJobToUsers).toHaveBeenCalledWith({
      jobId: 10,
      company: "Acme",
      title: "Backend Engineer",
      location: null,
      isRemote: false,
      description: null,
    });
  });

  it("handles P2002 unique constraint violation as a skip", async () => {
    ingestionRepo.findJobByDedupe.mockResolvedValue(null);
    const p2002Error = Object.assign(new Error("Unique constraint"), {
      code: "P2002",
    });
    ingestionRepo.createJob.mockRejectedValue(p2002Error);

    const result = await ingestJobs([
      {
        source: "GREENHOUSE",
        company: "Acme",
        title: "Backend Engineer",
        applyUrl: "https://jobs.acme.com/1",
      },
    ]);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it("records error when createJob throws a non-P2002 error", async () => {
    ingestionRepo.findJobByDedupe.mockResolvedValue(null);
    ingestionRepo.createJob.mockRejectedValue(new Error("DB connection lost"));

    const result = await ingestJobs([
      {
        source: "GREENHOUSE",
        company: "Acme",
        title: "Backend Engineer",
        applyUrl: "https://jobs.acme.com/1",
      },
    ]);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toBe("DB connection lost");
  });

  it("drops jobs with missing required fields", async () => {
    ingestionRepo.findJobByDedupe.mockResolvedValue(null);

    const result = await ingestJobs([
      {
        source: "GREENHOUSE",
        company: "", // empty company → normalizeJob throws
        title: "Engineer",
        applyUrl: "https://jobs.acme.com/1",
      },
    ]);

    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});
