"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ExpensePublic, ExpenseStatus, ExpenseCategory } from "@/types/api";

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통", LODGING: "숙박", MEAL: "식사", MINISTRY: "사역",
  GIFT: "선물", SUPPLIES: "물품", MEDICAL: "의료", MISC: "기타",
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  pending: "검토대기", approved: "승인됨", rejected: "반려", reimbursed: "정산완료",
};

const STATUS_CHIP: Record<ExpenseStatus, string> = {
  pending: "border-mustard text-mustard",
  approved: "border-sage text-sage",
  rejected: "border-rust text-rust",
  reimbursed: "border-ocean text-ocean",
};

const STATUS_BORDER_L: Record<ExpenseStatus, string> = {
  pending: "border-l-mustard",
  approved: "border-l-sage",
  rejected: "border-l-rust",
  reimbursed: "border-l-ocean",
};

function formatKRW(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? "0원" : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (r: string) => void }) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-md border border-ink/15 bg-paper p-6">
        <h3 className="mb-1 text-h3">반려 사유</h3>
        <p className="mb-4 text-body-sm text-ink-mute">등록자에게 표시됩니다.</p>
        <textarea
          className="w-full resize-none rounded-md border border-ink/20 bg-paper p-3 text-body focus:border-ink focus:outline-none"
          rows={3} placeholder="영수증 사진이 흐림. 재촬영 부탁드려요."
          value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && reason.trim()) {
              e.preventDefault();
              onConfirm(reason.trim());
            }
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep">취소</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason.trim())}
            className="inline-flex h-9 items-center rounded-md bg-rust px-4 text-body-sm text-paper hover:bg-rust/90 disabled:opacity-40 disabled:pointer-events-none">
            반려 처리
          </button>
        </div>
      </div>
    </div>
  );
}

type FilterTab = "all" | ExpenseStatus;
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "검토대기" },
  { key: "approved", label: "승인됨" },
  { key: "rejected", label: "반려" },
  { key: "reimbursed", label: "정산완료" },
];

export default function ExpenseReviewPage() {
  const { teamId } = useParams<{ teamId: string }>();

  const [expenses, setExpenses] = useState<ExpensePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/expenses/${teamId}`);
        if (res.ok) setExpenses((await res.json()).data ?? []);
        else showToast("지출 목록을 불러오지 못했어요.", false);
      } catch { showToast("불러오기에 실패했어요.", false); }
      finally { setLoading(false); }
    };
    load();
  }, [teamId, showToast]);

  const filtered = tab === "all" ? expenses : expenses.filter((e) => e.status === tab);
  const pendingFiltered = filtered.filter((e) => e.status === "pending");
  const selectedPendingCount = Array.from(selected).filter(
    (id) => expenses.find((e) => e.id === id)?.status === "pending"
  ).length;

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () => {
    const ids = pendingFiltered.map((e) => e.id);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => allOn ? n.delete(id) : n.add(id)); return n; });
  };

  const patchExpenses = (updated: ExpensePublic[]) => {
    const map = new Map(updated.map((e) => [e.id, e]));
    setExpenses((prev) => prev.map((e) => map.has(e.id) ? map.get(e.id)! : e));
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selected).filter((id) => expenses.find((e) => e.id === id)?.status === "pending");
    if (!ids.length) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${teamId}/bulk-approve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_ids: ids }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "일괄 승인 실패", false); return; }
      patchExpenses(json.data ?? []);
      setSelected(new Set());
      showToast(`${(json.data ?? []).length}건 승인됐어요.`, true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/expense/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "승인 실패", false); return; }
      patchExpenses([json.data]);
      showToast("승인됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleReject = async (id: string, reason: string) => {
    setRejectTarget(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/expense/${id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "반려 실패", false); return; }
      patchExpenses([json.data]);
      showToast("반려 처리됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-[800px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}
      {rejectTarget && (
        <RejectModal onClose={() => setRejectTarget(null)} onConfirm={(r) => handleReject(rejectTarget, r)} />
      )}

      <header className="mb-6">
        <p className="text-overline uppercase tracking-[0.12em] text-ink-mute">회계</p>
        <h1 className="font-display mt-1 text-h1">지출 검토</h1>
      </header>

      {/* 탭 */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const count = t.key === "all" ? expenses.length : expenses.filter((e) => e.status === t.key).length;
          return (
            <button key={t.key}
              onClick={() => { setTab(t.key); setSelected(new Set()); }}
              className={`flex-shrink-0 rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors ${tab === t.key ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-deep"}`}>
              {t.label}
              {count > 0 && <span className="ml-1.5 text-caption opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 일괄 승인 툴바 */}
      {pendingFiltered.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-ink/10 bg-paper-deep px-4 py-2.5">
          <input type="checkbox" className="h-4 w-4 cursor-pointer accent-ink"
            checked={pendingFiltered.every((e) => selected.has(e.id))}
            onChange={toggleSelectAll} />
          <span className="flex-1 text-body-sm text-ink-soft">
            {selectedPendingCount > 0 ? `${selectedPendingCount}건 선택됨` : `검토대기 ${pendingFiltered.length}건`}
          </span>
          {selectedPendingCount > 0 && (
            <button onClick={handleBulkApprove} disabled={busy}
              className="inline-flex h-8 items-center rounded-md bg-sage px-3 text-body-sm text-paper hover:bg-sage/90 disabled:opacity-50">
              일괄 승인
            </button>
          )}
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md bg-paper-deep" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center"><p className="text-body text-ink-mute">해당 상태의 지출이 없어요.</p></div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((expense) => {
            const canAct = expense.status === "pending" || expense.status === "rejected";
            return (
              <div key={expense.id}
                className={`flex items-start gap-3 rounded-md border border-l-4 border-ink/10 bg-paper p-4 ${STATUS_BORDER_L[expense.status]}`}>
                {expense.status === "pending" && (
                  <input type="checkbox" checked={selected.has(expense.id)} onChange={() => toggleSelect(expense.id)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-ink" />
                )}
                <Link href={`/teams/${teamId}/expenses/${expense.id}`} className="group min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-body font-semibold tabular-nums text-ink">{formatKRW(expense.amount)}</span>
                    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide ${STATUS_CHIP[expense.status]}`}>
                      {STATUS_LABEL[expense.status]}
                    </span>
                    <span className="inline-flex items-center rounded-sm border border-ink/20 px-1.5 py-0.5 text-caption uppercase tracking-wide text-ink-soft">
                      {CATEGORY_LABEL[expense.category]}
                    </span>
                  </div>
                  <p className="mt-1 text-body-sm font-medium text-ink group-hover:underline">{expense.description}</p>
                  <p className="mt-0.5 text-caption text-ink-mute">
                    {expense.purchaser_name && <span className="mr-2 font-medium text-ink-soft">{expense.purchaser_name}</span>}
                    {expense.vendor && <span className="mr-2">{expense.vendor}</span>}
                    {formatDate(expense.spent_at)}
                  </p>
                  {expense.rejection_reason && (
                    <p className="mt-1 text-caption text-rust">반려 사유: {expense.rejection_reason}</p>
                  )}
                </Link>
                {canAct && (
                  <div className="flex flex-shrink-0 gap-1.5">
                    <button onClick={() => handleApprove(expense.id)} disabled={busy}
                      className="inline-flex h-7 items-center rounded-md bg-sage px-2.5 text-caption text-paper hover:bg-sage/90 disabled:opacity-50">
                      승인
                    </button>
                    <button onClick={() => setRejectTarget(expense.id)} disabled={busy}
                      className="inline-flex h-7 items-center rounded-md border border-rust px-2.5 text-caption text-rust hover:bg-rust/10 disabled:opacity-50">
                      반려
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
