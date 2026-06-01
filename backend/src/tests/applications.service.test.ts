import { describe, expect, it, vi } from "vitest";

import { updateStatus } from "../services/applications.service.js";

vi.mock("../repositories/applications.repository.js", () => {
  return {
    findApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
    countApplications: vi.fn(),
    listApplications: vi.fn(),
    createApplicationNote: vi.fn(),
    listApplicationNotes: vi.fn(),
    upsertSavedApplication: vi.fn(),
    findJobById: vi.fn(),
  };
});

const repository =
  (await import("../repositories/applications.repository.js")) as unknown as {
    findApplicationById: ReturnType<typeof vi.fn>;
    updateApplicationStatus: ReturnType<typeof vi.fn>;
  };

describe("applications.service updateStatus", () => {
  it("rejects invalid status transitions", async () => {
    repository.findApplicationById.mockResolvedValue({
      id: 1,
      userId: 10,
      status: "REJECTED",
    });

    await expect(
      updateStatus({
        userId: 10,
        applicationId: 1,
        status: "OFFER",
      }),
    ).rejects.toThrow("Invalid status transition");
  });

  it("updates when transition is valid", async () => {
    repository.findApplicationById.mockResolvedValue({
      id: 1,
      userId: 10,
      status: "SAVED",
    });
    repository.updateApplicationStatus.mockResolvedValue({
      id: 1,
      status: "APPLIED",
    });

    const result = await updateStatus({
      userId: 10,
      applicationId: 1,
      status: "APPLIED",
    });

    expect(result).toEqual({ id: 1, status: "APPLIED" });
  });
});
