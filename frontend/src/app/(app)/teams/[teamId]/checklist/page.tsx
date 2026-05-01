import { auth } from "@/auth";
import { fetchApi } from "@/lib/api";
import type { ChecklistCategory, ChecklistItemPublic } from "@/types/api";

// ── 레이블 ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  TEAM_GEAR: "팀 장비",
  PERSONAL: "개인 준비",
  MINISTRY: "사역 준비",
  DOCS: "서류",
  MISC: "기타",
};

const STATUS_CONFIG = {
  todo: { label: "미완료", style: "bg-ink-mute/10 text-ink-mute", dot: "bg-ink-mute" },
  in_progress: { label: "진행 중", style: "bg-mustard/15 text-mustard", dot: "bg-mustard" },
  done: { label: "완료", style: "bg-sage/15 text-sage", dot: "bg-sage" },
} as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function ChecklistRow({ item }: { item: ChecklistItemPublic }) {
  const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.todo;
  return (
    <li className="flex items-start gap-3 rounded-md border border-ink/10 bg-paper p-4">
      {/* 상태 점 */}
      <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${st.dot}`} />

      <div className="flex-1">
        <div className="flex flex-wrap items-start gap-2">
          <span
            className={
              "font-medium text-ink" + (item.status === "done" ? " line-through opacity-50" : "")
            }
          >
            {item.title}
          </span>
          {item.quantity && (
            <span className="rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">
              {item.quantity}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-ink-mute">
          <span className={`rounded px-1.5 py-0.5 ${st.style}`}>{st.label}</span>
          {item.due_date && <span>마감 {item.due_date}</span>}
          {item.cost_amount && (
            <span>
              {new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: item.cost_currency,
                maximumFractionDigits: 0,
              }).format(parseFloat(item.cost_amount))}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="mt-1 text-body-sm text-ink-mute">{item.notes}</p>
        )}
      </div>
    </li>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep">
        <div
          className="h-full rounded-full bg-sage transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="flex-shrink-0 text-body-sm text-ink-mute">
        {done}/{total} ({pct}%)
      </span>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function ChecklistPage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  const items = await fetchApi<ChecklistItemPublic[]>(
    `/teams/${teamId}/checklist`,
    session.accessToken,
  );

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;

  // 카테고리별 그룹핑
  const categoryOrder: ChecklistCategory[] = [
    "DOCS",
    "TEAM_GEAR",
    "PERSONAL",
    "MINISTRY",
    "MISC",
  ];
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABEL[cat],
      items: items.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8">
        <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
        <h1 className="font-display mt-1 text-h1">준비물</h1>

        {total > 0 && (
          <div className="mt-4">
            <ProgressBar done={done} total={total} />
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <p className="text-body text-ink-mute">등록된 준비물이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(({ category, label, items: catItems }) => {
            const catDone = catItems.filter((i) => i.status === "done").length;
            return (
              <section key={category}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-body-sm font-medium uppercase tracking-wide text-ink-mute">
                    {label}
                  </h2>
                  <span className="text-caption text-ink-mute">
                    {catDone}/{catItems.length}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {catItems.map((item) => (
                    <ChecklistRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
