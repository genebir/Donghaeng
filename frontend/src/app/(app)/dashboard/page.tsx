import Link from "next/link";
import { auth } from "@/auth";
import { fetchApi, ApiError } from "@/lib/api";
import type { OrgPublic, OutreachWithTeams, TeamPublic } from "@/types/api";

const STATUS_LABEL: Record<string, string> = {
  planning: "기획 중",
  ongoing: "진행 중",
  finished: "완료",
  archived: "보관",
};

const STATUS_COLOR: Record<string, string> = {
  planning: "bg-mustard/15 text-mustard",
  ongoing: "bg-sage/15 text-sage",
  finished: "bg-ink-mute/15 text-ink-mute",
  archived: "bg-ink-mute/10 text-ink-mute",
};

function formatDateRange(starts_on: string | null, ends_on: string | null): string {
  if (!starts_on) return "";
  const s = new Date(starts_on).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  if (!ends_on) return s;
  const e = new Date(ends_on).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  return `${s} ~ ${e}`;
}

function TeamCard({ team }: { team: TeamPublic }) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group flex flex-col gap-2 rounded-md border border-ink/10 bg-paper p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-h3 font-medium text-ink group-hover:text-coral">{team.name}</h3>
        <span className={`flex-shrink-0 rounded px-2 py-0.5 text-caption font-medium ${STATUS_COLOR[team.status] ?? ""}`}>
          {STATUS_LABEL[team.status] ?? team.status}
        </span>
      </div>
      {(team.starts_on || team.ends_on) && (
        <p className="text-body-sm text-ink-mute">{formatDateRange(team.starts_on, team.ends_on)}</p>
      )}
      {team.description && (
        <p className="line-clamp-2 text-body-sm text-ink-soft">{team.description}</p>
      )}
      <span className="mt-1 text-body-sm text-ocean group-hover:underline">팀 홈으로 →</span>
    </Link>
  );
}

function OutreachSection({
  outreach,
  isAdmin,
  canManageTeams,
}: {
  outreach: OutreachWithTeams;
  isAdmin: boolean;
  canManageTeams: boolean;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-h2 font-display">{outreach.name}</h2>
          <span className="text-body-sm text-ink-mute">{outreach.year}년</span>
        </div>
        <div className="flex items-center gap-2">
          {canManageTeams && (
            <Link
              href={`/outreaches/${outreach.id}/teams/new`}
              className="text-body-sm text-ink-mute hover:text-ink border border-ink/15 rounded px-3 py-1 transition-colors hover:border-ink/30"
            >
              + 팀 만들기
            </Link>
          )}
          {isAdmin && (
            <Link
              href={`/outreaches/${outreach.id}/members`}
              className="text-body-sm text-ink-mute hover:text-ink border border-ink/15 rounded px-3 py-1 transition-colors hover:border-ink/30"
            >
              권한 관리
            </Link>
          )}
        </div>
      </div>

      {outreach.teams.length === 0 ? (
        <p className="text-body text-ink-mute">아직 팀이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outreach.teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="tracking-overline text-overline uppercase text-ink-mute">아직 소속된 교회가 없습니다</p>
      <h2 className="font-display mt-4 text-h2 text-ink">교회를 만들거나 초대를 기다려주세요</h2>
      <p className="mt-3 max-w-sm text-body text-ink-soft">
        관리자가 보낸 초대 링크로 참여하거나, 직접 교회를 만들어 시작하세요.
      </p>
      <Link
        href="/orgs/new"
        className="mt-8 inline-flex h-10 items-center rounded-md bg-ink px-5 text-body font-medium text-paper hover:bg-ink-soft"
      >
        교회 만들기
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  // 내 조직 목록 + 프로필(역할 확인용) 병렬 조회
  let orgs: OrgPublic[] = [];
  let orgRole: string | null = null;
  let directorOutreachIds: string[] = [];

  try {
    await Promise.all([
      fetchApi<OrgPublic[]>("/orgs", session.accessToken)
        .then((o) => { orgs = o; })
        .catch(() => {}),
      fetchApi<{ org_role: string | null; outreach_memberships: { outreach_id: string; role: string }[] }>(
        "/users/me",
        session.accessToken,
      )
        .then((p) => {
          orgRole = p.org_role;
          directorOutreachIds = (p.outreach_memberships ?? [])
            .filter((om) => om.role === "DIRECTOR")
            .map((om) => om.outreach_id);
        })
        .catch(() => {}),
    ]);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) { /* 무시 */ }
  }

  const isOrgAdmin = orgRole === "OWNER" || orgRole === "ADMIN";

  if (orgs.length === 0) return <EmptyState />;

  // 각 조직의 아웃리치 + 팀 목록
  const orgWithOutreaches = await Promise.all(
    orgs.map(async (org) => {
      let outreaches: OutreachWithTeams[] = [];
      try {
        const list = await fetchApi<{ id: string; name: string; year: number; starts_on: string | null; ends_on: string | null; description: string | null; created_at: string; organization_id: string }[]>(
          `/orgs/${org.id}/outreaches`,
          session.accessToken,
        );
        outreaches = await Promise.all(
          list.map(async (o) => {
            try {
              return await fetchApi<OutreachWithTeams>(`/outreaches/${o.id}`, session.accessToken);
            } catch {
              return { ...o, teams: [] };
            }
          }),
        );
      } catch { /* 아웃리치 없음 */ }
      return { org, outreaches };
    }),
  );

  const userName = session.user.name ?? "팀원";

  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display mt-2 text-h1">
            안녕하세요, {userName}님<span className="text-coral">.</span>
          </h1>
        </div>
        {isOrgAdmin && orgs.length > 0 && (
          <Link
            href={`/orgs/${orgs[0].id}/outreaches/new`}
            className="mt-2 inline-flex h-10 items-center rounded-md bg-ink px-4 text-body-sm font-medium text-paper hover:opacity-80"
          >
            + 아웃리치 만들기
          </Link>
        )}
      </header>

      <div className="flex flex-col gap-12">
        {orgWithOutreaches.map(({ org, outreaches }) => (
          <div key={org.id}>
            {orgs.length > 1 && (
              <p className="tracking-overline text-overline mb-6 uppercase text-ink-mute">{org.name}</p>
            )}
            {outreaches.length === 0 ? (
              <div className="rounded-md border border-ink/10 p-8 text-center">
                <p className="text-body text-ink-mute">아직 아웃리치가 없습니다.</p>
                {isOrgAdmin && (
                  <Link
                    href={`/orgs/${org.id}/outreaches/new`}
                    className="mt-4 inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-ink/5"
                  >
                    아웃리치 만들기
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {outreaches.map((outreach) => (
                  <OutreachSection
                    key={outreach.id}
                    outreach={outreach}
                    isAdmin={isOrgAdmin}
                    canManageTeams={isOrgAdmin || directorOutreachIds.includes(outreach.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
