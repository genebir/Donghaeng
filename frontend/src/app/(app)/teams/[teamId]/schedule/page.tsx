import Link from "next/link";
import { auth } from "@/auth";
import { fetchApi } from "@/lib/api";
import type { ScheduleItemPublic } from "@/types/api";

// ── 유틸 ──────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
  WORSHIP: "예배",
  VBS: "성경학교",
  MEAL: "식사",
  TRANSPORT: "이동",
  DEBRIEF: "디브리핑",
  FREE: "자유",
  OTHER: "기타",
};

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateKey(dt: string): string {
  return new Date(dt).toISOString().slice(0, 10);
}

function groupByDate(
  items: ScheduleItemPublic[],
): { dateLabel: string; items: ScheduleItemPublic[] }[] {
  const groups: Map<string, ScheduleItemPublic[]> = new Map();
  for (const item of items) {
    const key = dateKey(item.starts_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([, items]) => ({
    dateLabel: formatDate(items[0].starts_at),
    items,
  }));
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function ScheduleRow({ item }: { item: ScheduleItemPublic }) {
  return (
    <li className="flex gap-4 rounded-md border border-ink/10 bg-paper p-4">
      {/* 시간 */}
      <div className="w-20 flex-shrink-0 text-right text-body-sm text-ink-mute">
        <span className="block font-medium text-ink">{formatTime(item.starts_at)}</span>
        {item.ends_at && (
          <span className="text-caption">{formatTime(item.ends_at)}</span>
        )}
      </div>

      {/* 세로 선 */}
      <div className="flex flex-col items-center">
        <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-coral" />
        <div className="mt-1 flex-1 w-px bg-ink/10" />
      </div>

      {/* 내용 */}
      <div className="flex-1 pb-2">
        <div className="flex items-start gap-2">
          <p className="font-medium text-ink">{item.title}</p>
          {item.kind && (
            <span className="mt-0.5 flex-shrink-0 rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">
              {KIND_LABEL[item.kind] ?? item.kind}
            </span>
          )}
        </div>
        {item.location && (
          <p className="mt-1 text-body-sm text-ink-mute">📍 {item.location}</p>
        )}
        {item.description && (
          <p className="mt-1 text-body-sm text-ink-soft">{item.description}</p>
        )}
      </div>
    </li>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function SchedulePage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  const items = await fetchApi<ScheduleItemPublic[]>(
    `/teams/${teamId}/schedule`,
    session.accessToken,
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items
    .filter((i) => dateKey(i.starts_at) >= today)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = items
    .filter((i) => dateKey(i.starts_at) < today)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  const upcomingGroups = groupByDate(upcoming);
  const pastGroups = groupByDate(past);

  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">일정</h1>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="text-body text-ink-mute">등록된 일정이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {upcomingGroups.length > 0 && (
            <section>
              {upcomingGroups.map(({ dateLabel, items }) => (
                <div key={dateLabel} className="mb-8">
                  <h2 className="mb-3 font-medium text-ink">{dateLabel}</h2>
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                      <ScheduleRow key={item.id} item={item} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {pastGroups.length > 0 && (
            <section>
              <h2 className="mb-4 text-body-sm font-medium uppercase tracking-wide text-ink-mute">
                지난 일정
              </h2>
              {pastGroups.map(({ dateLabel, items }) => (
                <div key={dateLabel} className="mb-6 opacity-60">
                  <h3 className="mb-2 text-body-sm font-medium text-ink-soft">{dateLabel}</h3>
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                      <ScheduleRow key={item.id} item={item} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
