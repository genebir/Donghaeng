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
  amount: string;
  currency: string;
  spent_at: string;
  vendor: string | null;
  category: ExpenseCategory;
  description: string;
  payment_method: PaymentMethod | null;
  status: ExpenseStatus;
  approved_by_user_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reimbursement_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
