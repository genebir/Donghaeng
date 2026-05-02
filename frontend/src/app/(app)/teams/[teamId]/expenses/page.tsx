"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ExpenseCategory, ExpensePublic, ExpenseStatus } from "@/types/api";

// ── 레이블 / 스타일 ─────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; style: string }> = {
  pending: { label: "검토 대기", style: "bg-mustard/15 text-mustard" },
  approved: { label: "승인됨", style: "bg-sage/15 text-sage" },
  rejected: { label: "반려됨", style: "bg-rust/15 text-rust" },
  reimbursed: { label: "정산 완료", style: "bg-ink-mute/15 text-ink-mute" },
};

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatKRW(amount: string | number, currency = "KRW"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function dateKey(dt: string): string {
  return dt.slice(0, 10); // "YYYY-MM-DD"
}

function formatDateHeader(key: string): string {
  return new Date(key).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function groupByDate(expenses: ExpensePublic[]): { key: string; label: string; items: ExpensePublic[] }[] {
  const map = new Map<string, ExpensePublic[]>();
  for (const e of expenses) {
    const k = dateKey(e.spent_at);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({ key, label: formatDateHeader(key), items }));
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

function ExpenseRow({ expense, teamId, isMine }: { expense: ExpensePublic; teamId: string; isMine: boolean }) {
  const status = STATUS_CONFIG[expense.status];
  return (
    <li>
      <Link
        href={`/teams/${teamId}/expenses/${expense.id}`}
        className="flex items-start gap-4 rounded-md border border-ink/10 bg-paper p-4 hover:border-ink/30 hover:shadow-sm transition-all group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <span className="font-medium text-ink group-hover:text-coral transition-colors">{expense.description}</span>
            <span className="flex-shrink-0 rounded bg-paper-deep px-1.5 py-0.5 text-caption text-ink-soft">
              {CATEGORY_LABEL[expense.category]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-ink-mute">
            <span>{formatDate(expense.spent_at)}</span>
            {expense.vendor && <span>{expense.vendor}</span>}
            {!isMine && expense.purchaser_name && (
              <span className="text-ink-mute">{expense.purchaser_name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className="font-medium text-ink">{formatKRW(expense.amount, expense.currency)}</span>
          <span className={`rounded px-1.5 py-0.5 text-caption ${status.style}`}>{status.label}</span>
        </div>
      </Link>
    </li>
  );
}

function Summary({ expenses }: { expenses: ExpensePublic[] }) {
  const krwExpenses = expenses.filter((e) => e.currency === "KRW");
  const total = krwExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const pending = krwExpenses.filter((e) => e.status === "pending").reduce((s, e) => s + parseFloat(e.amount), 0);
  const approved = krwExpenses
    .filter((e) => e.status === "approved" || e.status === "reimbursed")
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      <KpiMini label="전체" value={formatKRW(total)} />
      <KpiMini label="검토 대기" value={formatKRW(pending)} />
      <KpiMini label="승인됨" value={formatKRW(approved)} />
    </div>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper px-4 py-3">
      <p className="text-caption text-ink-mute">{label}</p>
      <p className="mt-1 text-body-sm font-medium text-ink">{value}</p>
    </div>
  );
}

// ── 정산 현황 카드 ───────────────────────────────────────────────────────

type ReimbursementStatus = "draft" | "confirmed" | "completed";
interface MyReimbursement {
  id: string;
  status: ReimbursementStatus;
  total_amount: string;
  currency: string;
  created_at: string;
  completed_at: string | null;
}
interface MySummary {
  pending_amount: string;
  pending_expense_count: number;
  reimbursements: MyReimbursement[];
}

const REIMB_STATUS: Record<ReimbursementStatus, { label: string; style: string }> = {
  draft:     { label: "정산 대기", style: "bg-mustard/15 text-mustard" },
  confirmed: { label: "송금 예정", style: "bg-ocean/15 text-ocean" },
  completed: { label: "송금 완료", style: "bg-sage/15 text-sage" },
};

function MySettlementCard({ teamId }: { teamId: string }) {
  const [summary, setSummary] = useState<MySummary | null>(null);

  useEffect(() => {
    fetch(`/api/reimbursements/${teamId}/mine`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setSummary(j.data); })
      .catch(() => {});
  }, [teamId]);

  if (!summary) return null;

  const hasPending = parseFloat(summary.pending_amount) > 0;
  const activeReimbs = summary.reimbursements.filter((r) => r.status !== "completed");
  const completedReimbs = summary.reimbursements.filter((r) => r.status === "completed");

  if (!hasPending && summary.reimbursements.length === 0) return null;

  return (
    <div className="mb-5 rounded-md border border-ink/10 bg-paper px-4 py-4">
      <p className="text-caption font-medium uppercase tracking-wide text-ink-mute mb-3">나의 정산 현황</p>

      {hasPending && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-body-sm text-ink">
              미정산 승인 지출{" "}
              <span className="font-semibold text-coral">
                {formatKRW(summary.pending_amount)}
              </span>
            </p>
            <p className="mt-0.5 text-caption text-ink-mute">
              {summary.pending_expense_count}건 · 팀 회계가 정산을 생성하면 알려드려요
            </p>
          </div>
        </div>
      )}

      {activeReimbs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {activeReimbs.map((r) => {
            const cfg = REIMB_STATUS[r.status];
            return (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span className={`rounded px-1.5 py-0.5 text-caption ${cfg.style}`}>{cfg.label}</span>
                <span className="text-body-sm font-medium text-ink">{formatKRW(r.total_amount, r.currency)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {!hasPending && activeReimbs.length === 0 && completedReimbs.length > 0 && (
        <p className="text-body-sm text-ink-mute">
          모든 정산이 완료됐어요.{" "}
          <span className="text-ink">
            총 {formatKRW(
              completedReimbs.reduce((s, r) => s + parseFloat(r.total_amount), 0)
            )}
          </span>{" "}
          수령
        </p>
      )}
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

type Tab = "all" | "mine";
type StatusFilter = "all" | ExpenseStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all",        label: "전체" },
  { key: "pending",    label: "검토 대기" },
  { key: "approved",   label: "승인됨" },
  { key: "rejected",   label: "반려됨" },
  { key: "reimbursed", label: "정산 완료" },
];

export default function ExpensesPage() {
  const { teamId } = useParams<{ teamId: string }>();

  const [allExpenses, setAllExpenses] = useState<ExpensePublic[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [expRes, meRes] = await Promise.all([
          fetch(`/api/expenses/${teamId}`),
          fetch("/api/users/me"),
        ]);
        if (expRes.ok) {
          const json = await expRes.json();
          const raw: ExpensePublic[] = Array.isArray(json) ? json : (json.data ?? []);
          const sorted = [...raw].sort(
            (a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime()
          );
          setAllExpenses(sorted);
        }
        if (meRes.ok) {
          const me = (await meRes.json()).data;
          setMeId(me?.id ?? null);
        }
      } catch {
        showToast("불러오기에 실패했어요.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, showToast]);

  const tabFiltered = tab === "mine" && meId
    ? allExpenses.filter((e) => e.purchaser_user_id === meId)
    : allExpenses;

  const displayed = statusFilter === "all"
    ? tabFiltered
    : tabFiltered.filter((e) => e.status === statusFilter);

  const rejectedCount = tabFiltered.filter((e) => e.status === "rejected").length;

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className="fixed right-5 top-16 z-50 rounded-md border-l-2 border-l-rust bg-ink px-5 py-3 text-body-sm text-paper shadow-lg">
          {toast}
        </div>
      )}

      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">지출<span className="text-coral">.</span></h1>
        </div>
        <Link
          href={`/teams/${teamId}/expenses/new`}
          className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
        >
          + 등록
        </Link>
      </header>

      {/* 전체/내 지출 탭 */}
      <div className="mb-3 flex gap-1 rounded-md border border-ink/10 bg-paper-deep p-1">
        {(["all", "mine"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatusFilter("all"); }}
            className={`flex-1 rounded py-1.5 text-body-sm font-medium transition-colors ${
              tab === t ? "bg-paper text-ink shadow-sm" : "text-ink-mute hover:text-ink"
            }`}
          >
            {t === "all" ? "전체" : "내 지출"}
          </button>
        ))}
      </div>

      {/* 상태 필터 */}
      {!loading && (
        <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count = key === "all" ? tabFiltered.length : tabFiltered.filter((e) => e.status === key).length;
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                  statusFilter === key
                    ? "bg-ink text-paper"
                    : "bg-paper-deep text-ink-mute hover:bg-ink/10 hover:text-ink"
                }`}
              >
                {label}
                {key !== "all" && count > 0 && (
                  <span className={`ml-1 ${statusFilter === key ? "opacity-70" : "opacity-50"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 나의 정산 현황 */}
      {!loading && tab === "mine" && <MySettlementCard teamId={teamId} />}

      {/* 반려된 지출 알림 */}
      {!loading && tab === "mine" && rejectedCount > 0 && statusFilter !== "rejected" && (
        <button
          onClick={() => setStatusFilter("rejected")}
          className="mb-4 flex w-full items-center gap-3 rounded-md border border-rust/30 bg-rust/5 px-4 py-3 text-left hover:bg-rust/10 transition-colors"
        >
          <span className="text-rust">!</span>
          <span className="flex-1 text-body-sm text-rust font-medium">
            반려된 지출 {rejectedCount}건 — 수정 후 재제출이 필요해요
          </span>
          <span className="text-caption text-rust/70">확인하기 →</span>
        </button>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-paper-deep" />
          ))}
        </div>
      ) : (
        <>
          {displayed.length > 0 && <Summary expenses={displayed} />}

          {displayed.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body text-ink-mute">
                {statusFilter !== "all"
                  ? `${STATUS_CONFIG[statusFilter as ExpenseStatus]?.label ?? statusFilter} 지출이 없습니다.`
                  : tab === "mine" ? "등록한 지출이 없습니다." : "등록된 지출이 없습니다."}
              </p>
              {tab === "all" && statusFilter === "all" && (
                <Link
                  href={`/teams/${teamId}/expenses/new`}
                  className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
                >
                  첫 지출 등록하기
                </Link>
              )}
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="mt-3 text-body-sm text-ocean hover:underline"
                >
                  필터 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groupByDate(displayed).map(({ key, label, items }) => (
                <section key={key}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-caption font-medium text-ink-mute">{label}</span>
                    <span className="flex-1 h-px bg-ink/8" />
                    <span className="text-caption text-ink-mute">
                      {formatKRW(items.filter(e => e.currency === "KRW").reduce((s, e) => s + parseFloat(e.amount), 0))}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {items.map((e) => (
                      <ExpenseRow key={e.id} expense={e} teamId={teamId} isMine={tab === "mine" || e.purchaser_user_id === meId} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
