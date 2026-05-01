import { auth } from "@/auth";
import { fetchApi } from "@/lib/api";
import type { TeamMemberPublic, TeamPart, TeamRole } from "@/types/api";
import { cn } from "@/lib/cn";

// ── 레이블 ────────────────────────────────────────────────────────────────

const PART_LABEL: Record<TeamPart, string> = {
  MEDIA: "미디어",
  WORSHIP: "찬양",
  TEACHER: "교사",
  FINANCE: "회계",
  MEDICAL: "의료",
  GENERAL: "일반",
};

const ROLE_STYLE: Record<TeamRole, string> = {
  LEADER: "bg-coral/10 text-coral",
  MEMBER: "bg-ink-mute/10 text-ink-mute",
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink text-body-sm font-medium text-paper">
      {name.charAt(0)}
    </div>
  );
}

function MemberRow({ member }: { member: TeamMemberPublic }) {
  return (
    <li className="flex items-center gap-4 rounded-md border border-ink/10 bg-paper p-4">
      <Avatar name={member.user.name} imageUrl={member.user.profile_image_url} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{member.user.name}</span>
          {member.is_part_lead && (
            <span className="rounded bg-ocean/10 px-1.5 py-0.5 text-caption font-medium text-ocean">
              파트장
            </span>
          )}
        </div>
        <span className="truncate text-body-sm text-ink-mute">{member.user.email}</span>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-caption font-medium",
            ROLE_STYLE[member.role],
          )}
        >
          {member.role === "LEADER" ? "팀장" : "팀원"}
        </span>
        {member.part && (
          <span className="text-caption text-ink-mute">{PART_LABEL[member.part]}</span>
        )}
      </div>
    </li>
  );
}

// ── 파트별 그룹핑 ─────────────────────────────────────────────────────────

function groupByPart(
  members: TeamMemberPublic[],
): { label: string; items: TeamMemberPublic[] }[] {
  const leaders = members.filter((m) => m.role === "LEADER");
  const partGroups: Record<string, TeamMemberPublic[]> = {};

  for (const m of members.filter((m) => m.role !== "LEADER")) {
    const key = m.part ?? "GENERAL";
    if (!partGroups[key]) partGroups[key] = [];
    partGroups[key].push(m);
  }

  const result = [];
  if (leaders.length) result.push({ label: "팀장", items: leaders });
  for (const [part, items] of Object.entries(partGroups)) {
    result.push({
      label: PART_LABEL[part as TeamPart] ?? part,
      items,
    });
  }
  return result;
}

// ── 페이지 ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function MembersPage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  const members = await fetchApi<TeamMemberPublic[]>(
    `/teams/${teamId}/members`,
    session.accessToken,
  );

  const groups = groupByPart(members);

  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">
            멤버 <span className="text-ink-mute text-h2">({members.length}명)</span>
          </h1>
        </div>
      </header>

      {members.length === 0 ? (
        <p className="text-body text-ink-mute">아직 팀원이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ label, items }) => (
            <section key={label}>
              <h2 className="mb-3 text-body-sm font-medium uppercase tracking-wide text-ink-mute">
                {label} · {items.length}명
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((m) => (
                  <MemberRow key={m.id} member={m} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
