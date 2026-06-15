/* ── Enums ─────────────────────────────────────────────── */

export type CustomerStatus = "active" | "inactive" | "blocked" | "deleted";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
export type SegmentStatus = "draft" | "active" | "archived";
export type CampaignType = "promotional" | "transactional" | "winback" | "announcement";
export type Channel = "email" | "sms" | "whatsapp" | "push" | "rcs";
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled" | "failed";
export type CommunicationStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed" | "unsubscribed" | "converted";

/* ── Models ────────────────────────────────────────────── */

export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  externalId: string | null;
  status: CustomerStatus;
  attributes: Record<string, unknown> | null;
  lifetimeValue: number | string;
  orderCount: number;
  lastOrderAt: string | null;
  consentEmail: boolean;
  consentSms: boolean;
  consentWhatsapp: boolean;
  consentPush: boolean;
  consentRcs: boolean;
  consentUpdatedAt: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  status: SegmentStatus;
  rules: AudienceRuleGroup;
  estimatedAudienceSize: number | null;
  lastEvaluatedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  channel: Channel;
  status: CampaignStatus;
  segmentId: string;
  segmentVersion: number | null;
  templateId: string | null;
  content: Record<string, unknown>;
  scheduledAt: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  audienceSnapshot: Record<string, unknown> | null;
  metrics: Record<string, number>;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  segment?: Segment;
}

export interface CommunicationLog {
  id: string;
  campaignId: string;
  customerId: string;
  channel: Channel;
  recipient: string;
  status: CommunicationStatus;
  channelMessageId: string | null;
  idempotencyKey: string;
  events: unknown[];
  lastEventAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
  customer?: Customer;
}

/* ── Audience Rules ────────────────────────────────────── */

export interface AudienceRuleCondition {
  field: string;
  operator: string;
  value?: unknown;
}

export interface AudienceRuleGroup {
  operator: "and" | "or";
  conditions: (AudienceRuleCondition | AudienceRuleGroup)[];
}

/* ── API Response Wrappers ─────────────────────────────── */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardSummary {
  customers: number;
  orders: number;
  segments: number;
  campaigns: number;
  communicationLogs: number;
}

/* ── Request DTOs ──────────────────────────────────────── */

export interface CreateSegmentInput {
  name: string;
  description?: string;
  status?: SegmentStatus;
  rules: AudienceRuleGroup;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  channel: Channel;
  segmentId: string;
  templateId?: string;
  content: Record<string, unknown>;
  scheduledAt?: string | null;
}

/* ── AI DTOs ───────────────────────────────────────────── */

export interface GenerateSegmentResponse {
  rules: AudienceRuleGroup;
  session: { id: string };
}

export interface GenerateMessageResponse {
  message: { subject: string; body: string };
  session: { id: string };
}

export interface RecommendChannelResponse {
  channel: string;
  reason: string;
  session: { id: string };
}
