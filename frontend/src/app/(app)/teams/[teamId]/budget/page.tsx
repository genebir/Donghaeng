import { auth } from "@/auth";
import type { BudgetCategorySummary, BudgetSummaryResponse, ExpenseCategory } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── 레이블 ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통",
  LODGING: "숙박",
  MEAL: "식사",
  MINISTRY: "사역",
  GIFT: "선물",
  SUPPLIES: "물품",
  MEDICAL: "의료",
  MISC: "기타",
};

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function formatKRW(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0원";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num);
}

function BudgetBar({
  planned,
  spentApproved,
  spentPending,
}: {
  planned: number;
  spentApproved: number;
  spentPending: number;
}) {
  if (planned <= 0) return null;
  const approvedPct = Math.min((spentApproved / planned) * 100, 100);
  const pendingPct = Math.min((spentPending / planned) * 100, 100 - approvedPct);
  const isOver = spentApproved + spentPending > planned;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-paper-deep">
      <div className="flex h-full">
        <div
          className={`h-full ${isOver ? "bg-rust" : "bg-sage"}`}
          style={{ width: `${approvedPct}%` }}
        />
        <div
          className="h-full bg-mustard/60"
          style={{ width: `${pendingPct}%` }}
        />
      </div>
    </div>
  );
}

function CategoryRow({ entry }: { entry: BudgetCategorySummary }) {
  const planned = parseFloat(entry.planned_amount);
  const approved = parseFloat(entry.spent_approved);
  const pending = parseFloat(entry.spent_pending);
  const remaining = parseFloat(entry.remaining);
  const isOver = remaining < 0;

  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-ink">
          {CATEGORY_LABEL[entry.category] ?? entry.category}
        </h3>
        <span className={`text-body-sm font-medium ${isOver ? "text-rust" : "text-ink"}`}>
          {isOver ? "초과 " : "잔여 "}
          {formatKRW(Math.abs(remaining))}
        </span>
      </div>

      <BudgetBar
        planned={planned}
        spentApproved={approved}
        spentPending={pending}
      />

      <div className="mt-2 flex flex-wrap gap-4 text-caption text-ink-mute">
        <span>예산 {formatKRW(planned)}</span>
        <span>승인 {formatKRW(approved)}</span>
        {pending > 0 && <span>대기 {formatKRW(pending)}</span>}
      </div>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function BudgetPage({ params }: Props) {
  const { teamId } = await params;
  const session = await auth();
  if (!session) return null;

  // budget 엔드포인트는 { data: [...], meta: {...} } 구조 — fetchApi 사용 안 함
  let summary: BudgetSummaryResponse = { data: [], meta: { total_planned: "0", total_spent_approved: "0", total_spent_pending: "0" } };
  try {
    const res = await fetch(`${API_BASE}/api/v1/teams/${teamId}/budget`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      summary = await res.json();
    }
  } catch {
    // 예산 없음
  }

  const { data: entries, meta } = summary;
  const totalPlanned = parseFloat(meta.total_planned);
  const totalApproved = parseFloat(meta.total_spent_approved);
  const totalPending = parseFloat(meta.total_spent_pending);
  const overallUsed = totalApproved + totalPending;
  const overallPct = totalPlanned > 0 ? Math.round((overallUsed / totalPlanned) * 100) : 0;

  return (
    <div className="mx-auto max-w-[720px]">
      <header className="mb-8">
        <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
        <h1 className="font-display mt-1 text-h1">예산</h1>
      </header>

      {/* 전체 요약 */}
      {totalPlanned > 0 && (
        <div className="mb-8 rounded-md border border-ink/10 bg-paper p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-body-sm text-ink-soft">전체 예산</span>
            <span className="font-medium text-ink">{formatKRW(totalPlanned)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-paper-deep">
            <div
              className={`h-full rounded-full ${overallPct > 90 ? "bg-rust" : "bg-sage"}`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-caption text-ink-mute">
            <span>사용 {formatKRW(overallUsed)} ({overallPct}%)</span>
            <span>승인됨 {formatKRW(totalApproved)}</span>
            {totalPending > 0 && <span>대기 {formatKRW(totalPending)}</span>}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-mute">등록된 예산이 없습니다.</p>
          <p className="mt-2 text-body-sm text-ink-mute">
            팀 관리자가 카테고리별 예산을 설정할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <CategoryRow key={entry.category} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
