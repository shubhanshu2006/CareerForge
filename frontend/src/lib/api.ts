/**
 * CareerForge API Client
 * Uses Clerk's getToken() for Bearer auth on all protected routes.
 * Base URL: process.env.NEXT_PUBLIC_API_BASE_URL
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ─── Core request function ───────────────────────────────────────────────────

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  getToken?: () => Promise<string | null>
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  return res;
}

// ─── API factory that binds getToken ────────────────────────────────────────

export function createApi(getToken: () => Promise<string | null>) {
  const req = (endpoint: string, opts: RequestInit = {}) =>
    apiRequest(endpoint, opts, getToken);

  return {
    // ── Jobs (public, no auth required) ─────────────────────────────────────
    listJobs: (params?: Record<string, string | number | boolean | undefined>) => {
      const q = params ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        )
      ).toString() : "";
      return req(`/api/v1/jobs${q ? `?${q}` : ""}`, { method: "GET" });
    },

    searchJobs: (params?: Record<string, string | number | boolean | undefined>) => {
      const q = params ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        )
      ).toString() : "";
      return req(`/api/v1/jobs/search${q ? `?${q}` : ""}`, { method: "GET" });
    },

    getJobCounts: () => req("/api/v1/jobs/counts", { method: "GET" }),

    getJob: (id: number | string) =>
      req(`/api/v1/jobs/${id}`, { method: "GET" }),

    // ── Applications (auth required) ─────────────────────────────────────────
    createApplication: (jobId: number) =>
      req("/api/v1/applications", {
        method: "POST",
        body: JSON.stringify({ jobId }),
      }),

    listApplications: (params?: { page?: number; limit?: number }) => {
      const q = params ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString() : "";
      return req(`/api/v1/applications${q ? `?${q}` : ""}`, { method: "GET" });
    },

    getApplication: (id: number | string) =>
      req(`/api/v1/applications/${id}`, { method: "GET" }),

    updateApplicationStatus: (id: number | string, status: string) =>
      req(`/api/v1/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    createNote: (
      applicationId: number | string,
      payload: { round?: string; notes?: string; feedback?: string; category?: string; overcome?: boolean }
    ) =>
      req(`/api/v1/applications/${applicationId}/notes`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    listNotes: (applicationId: number | string) =>
      req(`/api/v1/applications/${applicationId}/notes`, { method: "GET" }),

    updateNoteOvercome: (noteId: number | string, overcome: boolean) =>
      req(`/api/v1/applications/notes/${noteId}/overcome`, {
        method: "PATCH",
        body: JSON.stringify({ overcome }),
      }),

    listAllNotes: () =>
      req("/api/v1/applications/notes", { method: "GET" }),

    // ── Dashboard ─────────────────────────────────────────────────────────────
    getDashboard: () =>
      req("/api/v1/dashboard", { method: "GET" }),

    // ── Profile ───────────────────────────────────────────────────────────────
    getProfile: () =>
      req("/api/v1/profile", { method: "GET" }),

    updateProfile: (data: Record<string, unknown>) =>
      req("/api/v1/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    updateSocialLinks: (payload: { links: Array<{ platform: string; url: string }> }) =>
      req("/api/v1/profile/social-links", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    addSkill: (skill: string) =>
      req("/api/v1/profile/skills", {
        method: "POST",
        body: JSON.stringify({ skill }),
      }),

    removeSkill: (skill: string) =>
      req(`/api/v1/profile/skills/${encodeURIComponent(skill)}`, {
        method: "DELETE",
      }),

    // ── Notifications ─────────────────────────────────────────────────────────
    getNotifications: () =>
      req("/api/v1/notifications", { method: "GET" }),

    markAllNotificationsRead: () =>
      req("/api/v1/notifications/read-all", { method: "PATCH" }),

    markNotificationRead: (id: number) =>
      req(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),

    // ── Preferences ───────────────────────────────────────────────────────────
    getPreferences: () =>
      req("/api/v1/preferences", { method: "GET" }),

    updatePreferences: (data: Record<string, unknown>) =>
      req("/api/v1/preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    // ── Chat / AI Search — removed
    // ── Monitoring (public) ───────────────────────────────────────────────────
    monitoringHealth: () =>
      apiRequest("/api/v1/monitoring/health", { method: "GET" }),

    monitoringRuns: () =>
      apiRequest("/api/v1/monitoring/runs", { method: "GET" }),

    monitoringRun: (runId: string) =>
      apiRequest(`/api/v1/monitoring/runs/${runId}`, { method: "GET" }),

    monitoringAggregates: () =>
      apiRequest("/api/v1/monitoring/aggregates", { method: "GET" }),
  };
}

// ─── Helper to unwrap JSON response ──────────────────────────────────────────

export async function unwrap<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const json = await res.json();
  // Backend wraps responses in { statusCode, data, message }
  return (json?.data ?? json) as T;
}

/** Paginated list payloads from the Express API use `items`, not `jobs` / `applications`. */
export type PaginatedPayload<T> = {
  items?: T[];
  jobs?: T[];
  applications?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export function extractItems<T>(
  data: PaginatedPayload<T> | T[] | null | undefined
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.jobs ?? data.applications ?? [];
}
