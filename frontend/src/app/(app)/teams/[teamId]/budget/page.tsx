"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTeamRole } from "@/hooks/useTeamRole";

// ── 타입 ──────────────────────────────────────────────────────────────────

type ExpenseCategory = "TRANSPORT" | "LODGING" | "MEAL" | "MINISTRY" | "GIFT" | "SUPPLIES" | "MEDICAL" | "MISC";

interface BudgetEntry {
  category: ExpenseCategory;
  planned_amount: string;
  spent_approved: string;
  spent_pending: string;
  remaining: string;
  currency: string;
}

interface BudgetMeta {
  total_planned: string;
  total_spent_approved: string;
  total_spent_pending: string;
}

// ── 상수 ──────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통", LODGING: "숙박", MEAL: "식사", MINISTRY: "사역",
  GIFT: "선물", SUPPLIES: "물품", MEDICAL: "의료", MISC: "기타",
};

const ALL_CATEGORIES: ExpenseCategory[] = [
  "TRANSPORT", "LODGING", "MEAL", "MINISTRY", "GIFT", "SUPPLIES", "MEDICAL", "MISC",
];

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatKRW(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0원";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(num);
}

// ── 예산 바 ───────────────────────────────────────────────────────────────

function BudgetBar({ planned, approved, pending }: { planned: number; approved: number; pending: number }) {
  if (planned <= 0) return null;
  const total = approved + pending;
  const isOver = total > planned;
  const approvedPct = Math.min((approved / planned) * 100, 100);
  const pendingPct = Math.min((pending / planned) * 100, 100 - approvedPct);

  return (
    <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
      <div className="flex h-full">
        <div className={`h-full ${isOver ? "bg-rust" : "bg-sage"}`} style={{ width: `${approvedPct}%` }} />
        <div className="h-full bg-mustard/60" style={{ width: `${pendingPct}%` }} />
      </div>
    </div>
  );
}

// ── 카테고리 행 (일반 보기) ───────────────────────────────────────────────

function CategoryRow({ entry, isAdmin, onEdit }: { entry: BudgetEntry; isAdmin: boolean; onEdit: () => void }) {
  const planned = parseFloat(entry.planned_amount);
  const approved = parseFloat(entry.spent_approved);
  const pending = parseFloat(entry.spent_pending);
  const remaining = parseFloat(entry.remaining);
  const isOver = remaining < 0;

  return (
    <div className="group rounded-md border border-ink/10 bg-paper p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-ink">{CATEGORY_LABEL[entry.category]}</h3>
        <div className="flex items-center gap-3">
          <span className={`text-body-sm font-medium ${isOver ? "text-rust" : "text-ink"}`}>
            {isOver ? "초과 " : "잔여 "}{formatKRW(Math.abs(remaining))}
          </span>
          {isAdmin && (
            <button
              onClick={onEdit}
              className="text-caption text-ink-mute transition-opacity hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
            >
              편집
            </button>
          )}
        </div>
      </div>
      <BudgetBar planned={planned} approved={approved} pending={pending} />
      <div className="mt-2 flex flex-wrap gap-4 text-caption text-ink-mute">
        <span>예산 {formatKRW(planned)}</span>
        <span>승인 {formatKRW(approved)}</span>
        {pending > 0 && <span>대기 {formatKRW(pending)}</span>}
      </div>
    </div>
  );
}

// ── 편집 모달 ─────────────────────────────────────────────────────────────

interface EditState {
  amounts: Record<ExpenseCategory, string>;
  activeCategories: Set<ExpenseCategory>;
}

function BudgetEditModal({
  entries,
  onSave,
  onClose,
  saving,
}: {
  entries: BudgetEntry[];
  onSave: (data: { category: ExpenseCategory; planned_amount: number }[]) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const initAmounts: Record<string, string> = {};
  const initActive = new Set<ExpenseCategory>();
  for (const e of entries) {
    initAmounts[e.category] = parseFloat(e.planned_amount).toFixed(0);
    if (parseFloat(e.planned_amount) > 0) initActive.add(e.category);
  }

  const [amounts, setAmounts] = useState<Record<string, string>>(initAmounts);
  const [active, setActive] = useState<Set<ExpenseCategory>>(initActive);
  const inputRefs = useRef<Partial<Record<ExpenseCategory, HTMLInputElement | null>>>({});

  const handleSave = useCallback(() => {
    const result = ALL_CATEGORIES
      .filter((cat) => active.has(cat))
      .map((cat) => ({
        category: cat,
        planned_amount: parseFloat(amounts[cat] || "0"),
      }))
      .filter((e) => e.planned_amount > 0);
    onSave(result);
  }, [amounts, active, onSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !saving) handleSave();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, saving, handleSave]);

  function toggleCategory(cat: ExpenseCategory) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
        setAmounts((a) => ({ ...a, [cat]: "0" }));
      } else {
        next.add(cat);
        setTimeout(() => inputRefs.current[cat]?.focus(), 0);
      }
      return next;
    });
  }

  const liveTotal = ALL_CATEGORIES
    .filter((cat) => active.has(cat))
    .reduce((sum, cat) => sum + (parseFloat(amounts[cat] || "0") || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-ink/10 bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="text-h3 font-medium">예산 편집</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-mute hover:bg-paper-deep">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="flex flex-col gap-3">
            {ALL_CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-3">
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`h-5 w-5 flex-shrink-0 rounded border transition-colors ${active.has(cat) ? "border-ink bg-ink" : "border-ink/30 bg-paper"}`}
                >
                  {active.has(cat) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="mx-auto" aria-hidden>
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>
                <span className={`w-16 text-body-sm ${active.has(cat) ? "text-ink font-medium" : "text-ink-mute"}`}>
                  {CATEGORY_LABEL[cat]}
                </span>
                <div className="relative flex-1">
                  <input
                    ref={(el) => { inputRefs.current[cat] = el; }}
                    type="number"
                    value={active.has(cat) ? amounts[cat] ?? "" : ""}
                    onChange={(e) => setAmounts((a) => ({ ...a, [cat]: e.target.value }))}
                    onFocus={(e) => e.target.select()}
                    disabled={!active.has(cat)}
                    placeholder="0"
                    min="0"
                    className="w-full rounded-md border border-ink/20 bg-paper py-1.5 pl-3 pr-8 text-body-sm text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none disabled:opacity-40"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-caption text-ink-mute">원</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-ink/10 px-6 py-4">
          {liveTotal > 0 && (
            <p className="mb-3 flex items-center justify-between text-body-sm">
              <span className="text-ink-mute">합계</span>
              <span className="font-semibold text-ink">{formatKRW(liveTotal)}</span>
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="h-10 flex-1 rounded-md border border-ink/20 text-body-sm text-ink-soft hover:bg-paper-deep">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 flex-1 rounded-md bg-ink text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { isAdmin } = useTeamRole();

  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [meta, setMeta] = useState<BudgetMeta>({ total_planned: "0", total_spent_approved: "0", total_spent_pending: "0" });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/budget/${teamId}`);
        if (res.ok) {
          const json = await res.json();
          setEntries(json.data ?? []);
          setMeta(json.meta ?? { total_planned: "0", total_spent_approved: "0", total_spent_pending: "0" });
        }
      } catch {
        showToast("데이터를 불러오지 못했어요.", false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, showToast]);

  async function handleSaveBudget(data: { category: ExpenseCategory; planned_amount: number }[]) {
    if (data.length === 0) return showToast("예산을 1개 이상 입력해주세요.", false);
    setEditSaving(true);
    try {
      const res = await fetch(`/api/budget/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: data.map((e) => ({ ...e, currency: "KRW" })) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "저장 실패");
      // 다시 불러오기
      const refreshRes = await fetch(`/api/budget/${teamId}`);
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        setEntries(refreshJson.data ?? []);
        setMeta(refreshJson.meta ?? meta);
      }
      setEditOpen(false);
      showToast("예산이 저장됐어요.", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "오류가 발생했어요.", false);
    } finally {
      setEditSaving(false);
    }
  }

  const totalPlanned = parseFloat(meta.total_planned);
  const totalApproved = parseFloat(meta.total_spent_approved);
  const totalPending = parseFloat(meta.total_spent_pending);
  const overallUsed = totalApproved + totalPending;
  const overallPct = totalPlanned > 0 ? Math.round((overallUsed / totalPlanned) * 100) : 0;

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
          <h1 className="font-display mt-1 text-h1">예산<span className="text-coral">.</span></h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
          >
            예산 편집
          </button>
        )}
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
              className={`h-full rounded-full transition-all ${overallPct > 90 ? "bg-rust" : "bg-sage"}`}
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-md bg-paper-deep" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-body text-ink-mute">등록된 예산이 없습니다.</p>
          {isAdmin ? (
            <button
              onClick={() => setEditOpen(true)}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
            >
              예산 설정하기
            </button>
          ) : (
            <p className="mt-2 text-body-sm text-ink-mute">팀 관리자가 카테고리별 예산을 설정할 수 있습니다.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <CategoryRow
              key={entry.category}
              entry={entry}
              isAdmin={isAdmin}
              onEdit={() => setEditOpen(true)}
            />
          ))}
        </div>
      )}

      {editOpen && (
        <BudgetEditModal
          entries={entries}
          onSave={handleSaveBudget}
          onClose={() => setEditOpen(false)}
          saving={editSaving}
        />
      )}
    </div>
  );
}
