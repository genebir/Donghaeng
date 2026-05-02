import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { fetchApi, ApiError } from "@/lib/api";
import type { TeamStatus } from "@/types/api";

// ── API 응답 타입 ──────────────────────────────────────────────────────────

interface DestinationPublic {
  id: string;
  church_name: string;
  address: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  timezone: string;
  notes: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  slug: string;
  status: TeamStatus;
  starts_on: string | null;
  ends_on: string | null;
  description: string | null;
  destination: DestinationPublic | null;
}

interface ScheduleItem {
  id: string;
  starts_at: string;
  ends_at: string | null;
  title: string;
  kind: string | null;
  location: string | null;
}

interface ChecklistItem {
  id: string;
  status: string;
}

interface ExpenseItem {
  id: string;
  amount: string;
  currency: string;
  status: string;
  spent_at: string;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  planning: "기획 중",
  ongoing: "진행 중",
  finished: "완료",
  archived: "보관",
};

const STATUS_STYLE: Record<string, string> = {
  planning: "bg-mustard/15 text-mustard",
  ongoing: "bg-sage/15 text-sage",
  finished: "bg-ink-mute/15 text-ink-mute",
  archived: "bg-ink-mute/10 text-ink-mute",
};

function formatDateRange(starts_on: string | null, ends_on: string | null): string {
  if (!starts_on && !ends_on) return "";
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  const s = starts_on ? new Date(starts_on).toLocaleDateString("ko-KR", opts) : "";
  const e = ends_on ? new Date(ends_on).toLocaleDateString("ko-KR", opts) : "";
  if (s && e) return `${s} ~ ${e}`;
  return s || e;
}

function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKRW(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num);
}

// ── 섹션 카드 컴포넌트 ────────────────────────────────────────────────────

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
        <h2 className="text-h3 font-medium">{title}</h2>
        <Link href={href} className="text-body-sm text-ocean hover:underline">
          전체 보기 →
        </Link>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyItem({ message }: { message: string }) {
  return <p className="text-body-sm text-ink-mute">{message}</p>;
}

// ── 페이지 ──────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function TeamHomePage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  const token = session.accessToken;

  // 팀 상세 조회
  let team: TeamDetail;
  try {
    team = await fetchApi<TeamDetail>(`/teams/${teamId}`, token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  // 오늘 기준 앞으로 3개 일정
  const nowIso = new Date().toISOString();
  const [scheduleItems, checklistItems, expenseItems] = await Promise.allSettled([
    fetchApi<ScheduleItem[]>(`/teams/${teamId}/schedule?from=${encodeURIComponent(nowIso)}`, token),
    fetchApi<ChecklistItem[]>(`/teams/${teamId}/checklist`, token),
    fetchApi<ExpenseItem[]>(`/teams/${teamId}/expenses`, token),
  ]);

  const schedule = scheduleItems.status === "fulfilled" ? scheduleItems.value.slice(0, 4) : [];
  const checklist = checklistItems.status === "fulfilled" ? checklistItems.value : [];
  const expenses = expenseItems.status === "fulfilled" ? expenseItems.value : [];

  // 준비물 진행률
  const totalItems = checklist.length;
  const doneItems = checklist.filter((c) => c.status === "done").length;
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  // 최근 7일 지출 합계
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentExpenses = expenses.filter(
    (e) => e.currency === "KRW" && e.status !== "rejected" && new Date(e.spent_at) >= sevenDaysAgo
  );
  const weeklyTotal = recentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="mx-auto max-w-[860px]">
      {/* ── 팀 헤더 ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tracking-overline text-overline uppercase text-ink-mute">
              {team.destination?.church_name ?? "방문지 미설정"}
            </p>
            <h1 className="font-display mt-1 text-h1">
              {team.name}
              <span className="text-coral">.</span>
            </h1>
            {(team.starts_on || team.ends_on) && (
              <p className="mt-1 text-body-sm text-ink-soft">
                {formatDateRange(team.starts_on, team.ends_on)}
              </p>
            )}
          </div>

          <span
            className={`mt-1 rounded px-2.5 py-1 text-body-sm font-medium ${STATUS_STYLE[team.status] ?? ""}`}
          >
            {STATUS_LABEL[team.status] ?? team.status}
          </span>
        </div>

        {team.description && (
          <p className="mt-4 max-w-prose text-body text-ink-soft">{team.description}</p>
        )}
      </header>

      {/* ── 빠른 액션 ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={`/teams/${teamId}/expenses/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-coral px-5 text-body-sm font-medium text-paper hover:bg-coral/90 active:translate-y-px transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M7 1v12M1 7h12" />
          </svg>
          지출 등록
        </Link>
        <Link
          href={`/teams/${teamId}/home-updates`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/20 bg-paper px-5 text-body-sm font-medium text-ink hover:bg-paper-deep active:translate-y-px transition"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 2.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H5L2 12V2.5z" />
          </svg>
          소식 쓰기
        </Link>
      </div>

      {/* ── 요약 KPI ─────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard
          label="준비물 완료"
          value={`${doneItems} / ${totalItems}`}
          sub={totalItems > 0 ? `${progressPct}%` : "아직 없음"}
        />
        <KpiCard
          label="최근 7일 지출"
          value={weeklyTotal > 0 ? formatKRW(weeklyTotal.toString()) : "0원"}
          sub={recentExpenses.length > 0 ? `${recentExpenses.length}건` : `전체 ${expenses.length}건`}
        />
        {team.destination && (
          <KpiCard
            label="방문 교회"
            value={team.destination.church_name}
            sub={team.destination.address ?? "주소 미입력"}
          />
        )}
      </div>

      {/* ── 섹션 그리드 ──────────────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* 다음 일정 */}
        <SectionCard title="다음 일정" href={`/teams/${teamId}/schedule`}>
          {schedule.length === 0 ? (
            <EmptyItem message="예정된 일정이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-3">
              {schedule.map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium text-ink">{item.title}</span>
                  <span className="text-caption text-ink-mute">
                    {formatTime(item.starts_at)}
                    {item.location && ` · ${item.location}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* 준비물 현황 */}
        <SectionCard title="준비물 현황" href={`/teams/${teamId}/checklist`}>
          {totalItems === 0 ? (
            <EmptyItem message="등록된 준비물이 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {/* 프로그레스 바 */}
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink-soft">
                  {doneItems}개 완료 / {totalItems}개 전체
                </span>
                <span className="font-medium text-ink">{progressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-paper-deep">
                <div
                  className="h-full rounded-full bg-sage transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* 미완료 항목 미리보기 */}
              <ul className="mt-1 flex flex-col gap-1.5">
                {checklist
                  .filter((c) => c.status !== "done")
                  .slice(0, 3)
                  .map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-body-sm text-ink-soft">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink-mute" />
                      {(c as unknown as { title: string }).title}
                    </li>
                  ))}
                {checklist.filter((c) => c.status !== "done").length > 3 && (
                  <li className="text-caption text-ink-mute">
                    +{checklist.filter((c) => c.status !== "done").length - 3}개 더
                  </li>
                )}
              </ul>
            </div>
          )}
        </SectionCard>

        {/* 최근 지출 */}
        <SectionCard title="최근 지출" href={`/teams/${teamId}/expenses`}>
          {expenses.length === 0 ? (
            <EmptyItem message="등록된 지출이 없습니다." />
          ) : (
            <ul className="flex flex-col gap-3">
              {expenses.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-body-sm text-ink-soft">
                    {(e as unknown as { description: string }).description}
                  </span>
                  <span className="flex-shrink-0 text-body-sm font-medium text-ink">
                    {formatKRW(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* 방문지 정보 */}
        <SectionCard title="방문지 정보" href={`/teams/${teamId}/settings`}>
          {!team.destination ? (
            <EmptyItem message="방문지 정보가 없습니다." />
          ) : (
            <dl className="flex flex-col gap-2 text-body-sm">
              {team.destination.address && (
                <Row label="주소" value={team.destination.address} />
              )}
              {team.destination.coordinator_name && (
                <Row label="담당자" value={team.destination.coordinator_name} />
              )}
              {team.destination.coordinator_phone && (
                <Row label="연락처" value={team.destination.coordinator_phone} />
              )}
              {team.destination.timezone && team.destination.timezone !== "Asia/Seoul" && (
                <Row label="시간대" value={team.destination.timezone} />
              )}
              {team.destination.notes && (
                <div className="mt-1 text-ink-mute">{team.destination.notes}</div>
              )}
            </dl>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <p className="text-caption text-ink-mute">{label}</p>
      <p className="mt-1 text-h3 font-medium text-ink">{value}</p>
      <p className="mt-0.5 text-caption text-ink-mute">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 flex-shrink-0 text-ink-mute">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
