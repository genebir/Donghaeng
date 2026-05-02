// ── 공통 ──────────────────────────────────────────────────────────────────

export interface OrgPublic {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
}

// ── 아웃리치 / 팀 ──────────────────────────────────────────────────────────

export interface OutreachPublic {
  id: string;
  organization_id: string;
  name: string;
  year: number;
  starts_on: string | null;
  ends_on: string | null;
  description: string | null;
  created_at: string;
}

export type TeamStatus = "planning" | "ongoing" | "finished" | "archived";

export interface TeamPublic {
  id: string;
  outreach_id: string;
  name: string;
  slug: string;
  status: TeamStatus;
  starts_on: string | null;
  ends_on: string | null;
  description: string | null;
  created_at: string;
}

export interface OutreachWithTeams extends OutreachPublic {
  teams: TeamPublic[];
}

// ── 멤버 ────────────────────────────────────────────────────────────────────

export type TeamRole = "LEADER" | "MEMBER";
export type TeamPart =
  | "MEDIA"
  | "WORSHIP"
  | "TEACHER"
  | "FINANCE"
  | "MEDICAL"
  | "GENERAL";

export interface TeamMemberPublic {
  id: string;
  team_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_image_url: string | null;
  };
  role: TeamRole;
  part: TeamPart | null;
  is_part_lead: boolean;
  emergency_info: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  joined_at: string;
}

// ── 일정 ────────────────────────────────────────────────────────────────────

export type ScheduleKind =
  | "WORSHIP"
  | "VBS"
  | "MEAL"
  | "TRANSPORT"
  | "DEBRIEF"
  | "FREE"
  | "OTHER";

export interface ScheduleItemPublic {
  id: string;
  team_id: string;
  starts_at: string;
  ends_at: string | null;
  title: string;
  kind: ScheduleKind | null;
  location: string | null;
  description: string | null;
  owner_member_id: string | null;
  created_at: string;
}

// ── 준비물 ──────────────────────────────────────────────────────────────────

export type ChecklistCategory =
  | "TEAM_GEAR"
  | "PERSONAL"
  | "MINISTRY"
  | "DOCS"
  | "MISC";
export type ChecklistStatus = "todo" | "in_progress" | "done";

export interface ChecklistItemPublic {
  id: string;
  team_id: string;
  category: ChecklistCategory;
  title: string;
  quantity: string | null;
  owner_member_id: string | null;
  due_date: string | null;
  status: ChecklistStatus;
  cost_amount: string | null;
  cost_currency: string;
  notes: string | null;
  created_at: string;
}

// ── 지출 / 회계 ─────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "TRANSPORT"
  | "LODGING"
  | "MEAL"
  | "MINISTRY"
  | "GIFT"
  | "SUPPLIES"
  | "MEDICAL"
  | "MISC";
export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";
export type PaymentMethod =
  | "PERSONAL_CARD"
  | "PERSONAL_CASH"
  | "CHURCH_CARD"
  | "OTHER";

export interface ExpensePublic {
  id: string;
  team_id: string;
  purchaser_user_id: string;
  purchaser_name: string | null;
  amount: string;
  currency: string;
  spent_at: string;
  vendor: string | null;
  category: ExpenseCategory;
  description: string;
  payment_method: PaymentMethod | null;
  receipt_media_id: string | null;
  status: ExpenseStatus;
  approved_by_user_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reimbursement_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── 본진 공유 ──────────────────────────────────────────────────────────────────

export type HomeUpdateStatus = "draft" | "published";

export interface HomeUpdatePublic {
  id: string;
  team_id: string;
  author_user_id: string;
  status: HomeUpdateStatus;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharePageData {
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    starts_on: string | null;
    ends_on: string | null;
  };
  updates: HomeUpdatePublic[];
  testimonies: {
    id: string;
    kind: "testimony" | "prayer_request";
    content: string;
    submitted_name: string | null;
    created_at: string;
  }[];
}

// ── 정산 ─────────────────────────────────────────────────────────────────────

export type ReimbursementStatus = "draft" | "confirmed" | "completed";

export interface ReimbursementPublic {
  id: string;
  team_id: string;
  recipient_user_id: string;
  created_by_user_id: string;
  status: ReimbursementStatus;
  total_amount: string;
  currency: string;
  transfer_method: string | null;
  transfer_reference: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  expenses: ExpensePublic[];
  recipient_name: string | null;
  recipient_bank_name: string | null;
  recipient_bank_account_holder: string | null;
  recipient_bank_account_number_masked: string | null;
}

export interface ReimbursementPreviewItem {
  recipient_user_id: string;
  recipient_name: string | null;
  total_amount: string;
  by_category: Record<string, string>;
  expense_count: number;
}

export interface UserBankInfo {
  user_id: string;
  name: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}

// ── 예산 ────────────────────────────────────────────────────────────────────

export interface BudgetCategorySummary {
  category: ExpenseCategory;
  planned_amount: string;
  spent_approved: string;
  spent_pending: string;
  remaining: string;
  currency: string;
}

export interface BudgetSummaryMeta {
  total_planned: string;
  total_spent_approved: string;
  total_spent_pending: string;
}

export interface BudgetSummaryResponse {
  data: BudgetCategorySummary[];
  meta: BudgetSummaryMeta;
}

// ── 미디어 ──────────────────────────────────────────────────────────────────

export type MediaKind = "photo" | "video" | "document";
export type MediaStatus = "pending" | "ready" | "failed";
export type MediaVisibility = "team" | "public";

export interface MediaAssetPublic {
  id: string;
  team_id: string;
  uploader_user_id: string;
  status: MediaStatus;
  kind: MediaKind;
  filename: string;
  content_type: string;
  byte_size: number | null;
  visibility: MediaVisibility;
  is_selected: boolean;
  notes: string | null;
  view_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaPresignOut {
  media_id: string;
  upload_url: string;
  method: string;
  expires_in: number;
}
