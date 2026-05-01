export interface OrgPublic {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
}

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

export type TeamStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

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
