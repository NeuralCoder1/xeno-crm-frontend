import type {
  ApiResponse,
  Campaign,
  CommunicationLog,
  CreateCampaignInput,
  CreateSegmentInput,
  Customer,
  DashboardSummary,
  GenerateMessageResponse,
  GenerateSegmentResponse,
  PaginatedData,
  RecommendChannelResponse,
  Segment,
} from "@/src/types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("xeno_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message ?? body?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

/* ── Auth ───────────────────────────────────────────────── */

export async function demoLogin(): Promise<string> {
  const res = await request<ApiResponse<{ token: string }>>("/api/auth/demo-login", { method: "POST" });
  return res.data.token;
}

/* ── Dashboard ──────────────────────────────────────────── */

export async function getDashboard(): Promise<DashboardSummary> {
  const res = await request<DashboardSummary>("/api/dashboard");
  return res;
}

/* ── Customers ──────────────────────────────────────────── */

export async function getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedData<Customer> | Customer[]> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  const qs = q.toString();
  const response = await request<ApiResponse<PaginatedData<Customer> | Customer[]>>(`/api/customers${qs ? `?${qs}` : ""}`);
  console.log("CUSTOMERS API RESPONSE", response);
  return response.data;
}

/* ── Segments ───────────────────────────────────────────── */

export async function getSegments(): Promise<Segment[] | PaginatedData<Segment>> {
  const res = await request<ApiResponse<Segment[] | PaginatedData<Segment>>>("/api/segments");
  return res.data;
}

export async function createSegment(input: CreateSegmentInput): Promise<Segment> {
  const res = await request<ApiResponse<Segment>>("/api/segments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

/* ── Campaigns ──────────────────────────────────────────── */

export async function getCampaigns(params?: { page?: number; limit?: number }): Promise<PaginatedData<Campaign> | Campaign[]> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  const res = await request<ApiResponse<PaginatedData<Campaign> | Campaign[]>>(`/api/campaigns${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const res = await request<ApiResponse<Campaign>>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function launchCampaign(id: string): Promise<unknown> {
  const res = await request<ApiResponse<unknown>>(`/api/campaigns/${id}/launch`, { method: "POST" });
  return res.data;
}

/* ── Communication Logs ─────────────────────────────────── */

export async function getCommunicationLogs(params?: {
  campaignId?: string;
  customerId?: string;
  status?: string;
  channel?: string;
  page?: number;
  limit?: number;
}): Promise<CommunicationLog[] | PaginatedData<CommunicationLog>> {
  const q = new URLSearchParams();
  if (params?.campaignId) q.set("campaignId", params.campaignId);
  if (params?.customerId) q.set("customerId", params.customerId);
  if (params?.status) q.set("status", params.status);
  if (params?.channel) q.set("channel", params.channel);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  const res = await request<ApiResponse<CommunicationLog[] | PaginatedData<CommunicationLog>>>(`/api/communication-logs${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function retryCommunication(id: string): Promise<unknown> {
  const res = await request<ApiResponse<unknown>>(`/api/communication-logs/${id}/retry`, { method: "POST" });
  return res.data;
}

/* ── AI ─────────────────────────────────────────────────── */

export async function aiGenerateSegment(prompt: string): Promise<GenerateSegmentResponse> {
  const res = await request<ApiResponse<GenerateSegmentResponse>>("/api/ai/generate-segment", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  return res.data;
}

export async function aiGenerateMessage(campaignType: string, objective: string): Promise<GenerateMessageResponse> {
  const res = await request<ApiResponse<GenerateMessageResponse>>("/api/ai/generate-message", {
    method: "POST",
    body: JSON.stringify({ campaignType, objective }),
  });
  return res.data;
}

export async function aiRecommendChannel(campaignType: string, audienceSize: number): Promise<RecommendChannelResponse> {
  const res = await request<ApiResponse<RecommendChannelResponse>>("/api/ai/recommend-channel", {
    method: "POST",
    body: JSON.stringify({ campaignType, audienceSize }),
  });
  return res.data;
}
