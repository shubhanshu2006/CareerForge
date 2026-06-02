import { describe, expect, it, vi } from "vitest";

import { toggleNoteOvercome, updateStatus } from "../services/applications.service.js";

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
    findNoteById: vi.fn(),
    updateNoteOvercome: vi.fn(),
    listAllNotesForUser: vi.fn(),
    getWeaknessStats: vi.fn(),
  };
});

const repository =
  (await import("../repositories/applications.repository.js")) as unknown as {
    findApplicationById: ReturnType<typeof vi.fn>;
    updateApplicationStatus: ReturnType<typeof vi.fn>;
    findNoteById: ReturnType<typeof vi.fn>;
    updateNoteOvercome: ReturnType<typeof vi.fn>;
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

describe("applications.service toggleNoteOvercome", () => {
  it("rejects when note does not exist", async () => {
    repository.findNoteById.mockResolvedValue(null);

    await expect(
      toggleNoteOvercome({ userId: 10, noteId: 99, overcome: true }),
    ).rejects.toThrow("Note not found");
  });

  it("rejects when note belongs to a different user", async () => {
    repository.findNoteById.mockResolvedValue({
      id: 5,
      application: { userId: 999 },
    });

    await expect(
      toggleNoteOvercome({ userId: 10, noteId: 5, overcome: true }),
    ).rejects.toThrow("Forbidden");
  });

  it("updates overcome when user owns the note", async () => {
    repository.findNoteById.mockResolvedValue({
      id: 5,
      application: { userId: 10 },
    });
    repository.updateNoteOvercome.mockResolvedValue({ id: 5, overcome: true });

    const result = await toggleNoteOvercome({
      userId: 10,
      noteId: 5,
      overcome: true,
    });

    expect(result).toEqual({ id: 5, overcome: true });
  });
});
