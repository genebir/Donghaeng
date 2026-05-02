"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { ReimbursementPublic, ReimbursementStatus, ExpenseCategory } from "@/types/api";
import { useTeamRole } from "@/hooks/useTeamRole";

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통", LODGING: "숙박", MEAL: "식사", MINISTRY: "사역",
  GIFT: "선물", SUPPLIES: "물품", MEDICAL: "의료", MISC: "기타",
};

const STATUS_LABEL: Record<ReimbursementStatus, string> = {
  draft: "초안", confirmed: "확정됨", completed: "송금완료",
};

const STATUS_CHIP: Record<ReimbursementStatus, string> = {
  draft: "border-mustard text-mustard",
  confirmed: "border-ocean text-ocean",
  completed: "border-sage text-sage",
};

function formatKRW(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? "0원" : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── 완료 모달 ─────────────────────────────────────────────────────────────────

const TRANSFER_METHODS = [
  { value: "카카오페이", label: "카카오페이" },
  { value: "토스", label: "토스" },
  { value: "계좌이체", label: "계좌이체" },
  { value: "현금", label: "현금" },
];

function CompleteModal({ onClose, onConfirm, busy, recipientBankName }: {
  onClose: () => void;
  onConfirm: (method: string, reference: string, notes: string) => void;
  busy: boolean;
  recipientBankName?: string | null;
}) {
  const defaultMethod = recipientBankName?.includes("카카오") ? "카카오페이"
    : recipientBankName?.includes("토스") ? "토스"
    : "계좌이체";
  const [method, setMethod] = useState(defaultMethod);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim() && !busy) onConfirm(method, reference, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-md border border-ink/15 bg-paper p-6">
        <h3 className="mb-4 text-h3">송금 완료 처리</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="text-caption font-semibold uppercase tracking-overline text-ink-soft">송금 방법</span>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TRANSFER_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`rounded-lg py-2.5 text-body-sm font-medium transition-colors ${
                    method === m.value ? "bg-ink text-paper" : "bg-paper-deep text-ink-soft hover:bg-ink/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-caption font-semibold uppercase tracking-overline text-ink-soft">송금 확인 메모 *</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)}
              autoFocus
              className="mt-2 block w-full border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body focus:border-ink focus:outline-none"
              placeholder="예: 7/30 14:23 이체완료" />
          </label>
          <label className="block">
            <span className="text-caption font-semibold uppercase tracking-overline text-ink-soft">메모 <span className="font-normal normal-case text-ink-mute">(선택)</span></span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="mt-2 block w-full border-b-2 border-ink/20 bg-transparent px-0 py-2 text-body focus:border-ink focus:outline-none"
              placeholder="추가 메모" />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={busy}
              className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep">
              취소
            </button>
            <button type="submit" disabled={!reference.trim() || busy}
              className="inline-flex h-9 items-center rounded-md bg-sage px-4 text-body-sm text-paper hover:bg-sage/90 disabled:opacity-40 disabled:pointer-events-none">
              {busy ? "처리 중…" : "완료 처리"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

export default function ReimbursementDetailPage() {
  const { teamId, reimbursementId } = useParams<{ teamId: string; reimbursementId: string }>();
  const { isAdmin, loaded: roleLoaded } = useTeamRole();

  const [data, setData] = useState<ReimbursementPublic | null>(null);
  const [fullAccountNumber, setFullAccountNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reimbursement/${reimbursementId}`);
        if (!res.ok) { showToast("불러오기에 실패했어요.", false); return; }
        const json = await res.json();
        const r: ReimbursementPublic = json.data;
        setData(r);
        // 전체 계좌번호는 복사 기능을 위해 별도 조회
        const bankRes = await fetch(`/api/users/${r.recipient_user_id}/bank`);
        if (bankRes.ok) {
          const bankJson = await bankRes.json();
          setFullAccountNumber(bankJson.data?.bank_account_number ?? null);
        }
      } catch { showToast("불러오기에 실패했어요.", false); }
      finally { setLoading(false); }
    };
    load();
  }, [reimbursementId, showToast]);

  const handleConfirm = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reimbursement/${data.id}/confirm`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "확정 실패", false); return; }
      setData((prev) => prev ? { ...prev, ...json.data } : json.data);
      showToast("정산이 확정됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleComplete = async (method: string, reference: string, notes: string) => {
    if (!data) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reimbursement/${data.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transfer_method: method, transfer_reference: reference, notes }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "완료 처리 실패", false); return; }
      setData((prev) => prev ? { ...prev, ...json.data } : json.data);
      setShowCompleteModal(false);
      showToast("송금 완료 처리됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleCopyBankInfo = () => {
    if (!data) return;
    const accountNum = fullAccountNumber ?? data.recipient_bank_account_number_masked ?? "";
    const text = [
      data.recipient_bank_name ?? "",
      accountNum,
      data.recipient_bank_account_holder ?? "",
      formatKRW(data.total_amount),
    ].filter(Boolean).join(" / ");
    navigator.clipboard.writeText(text).then(() => {
      showToast("복사됐어요. 뱅킹앱에 붙여넣기 하세요.", true);
    }).catch(() => showToast("복사에 실패했어요.", false));
  };

  // 카테고리별 합계
  const byCategory: Record<string, number> = {};
  data?.expenses.forEach((e) => {
    const cat = e.category;
    byCategory[cat] = (byCategory[cat] ?? 0) + parseFloat(e.amount);
  });

  if (roleLoaded && !isAdmin) {
    return (
      <div className="mx-auto max-w-[600px] py-20 text-center">
        <p className="text-body font-medium text-ink">접근 권한이 없어요</p>
        <p className="mt-2 text-body-sm text-ink-mute">이 페이지는 팀 관리자만 볼 수 있어요.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px]">
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-md bg-paper-deep" />)}</div>
      </div>
    );
  }

  if (!data) return null;

  const hasBankInfo = data?.recipient_bank_account_number_masked;

  return (
    <div className="mx-auto max-w-[600px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}
      {showCompleteModal && (
        <CompleteModal
          onClose={() => setShowCompleteModal(false)}
          onConfirm={handleComplete}
          busy={busy}
          recipientBankName={data?.recipient_bank_name}
        />
      )}

      {/* 뒤로 가기 */}
      <Link href={`/teams/${teamId}/reimbursements`}
        className="mb-6 flex items-center gap-1.5 text-body-sm text-ink-mute hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 7H3M6 4L3 7l3 3" />
        </svg>
        정산 목록
      </Link>

      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-overline uppercase tracking-overline text-ink-mute">정산</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-h1 font-semibold tabular-nums text-ink">
                {formatKRW(data.total_amount)}
              </span>
              <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-body-sm font-semibold uppercase tracking-wide ${STATUS_CHIP[data.status]}`}>
                {STATUS_LABEL[data.status]}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-ink-mute">생성 {formatDate(data.created_at)}</p>
          </div>
        </div>
      </header>

      <hr className="mb-6 border-ink/10" />

      {/* 수취인 계좌 */}
      <section className="mb-6">
        <h2 className="mb-3 text-h3 text-ink">수취인</h2>
        {hasBankInfo ? (
          <div className="rounded-md border border-ink/10 bg-paper-deep p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-body font-semibold text-ink">{data.recipient_name ?? "알 수 없음"}</p>
                <p className="mt-1 font-mono text-body-sm text-ink-soft">
                  {data.recipient_bank_name && <span className="mr-2">{data.recipient_bank_name}</span>}
                  {data.recipient_bank_account_number_masked}
                </p>
                {data.recipient_bank_account_holder && (
                  <p className="text-caption text-ink-mute">예금주: {data.recipient_bank_account_holder}</p>
                )}
              </div>
              {data.status !== "completed" && (
                <button onClick={handleCopyBankInfo}
                  className="inline-flex h-8 flex-shrink-0 items-center rounded-md border border-ink/20 px-3 text-body-sm text-ink hover:bg-paper active:translate-y-px transition">
                  송금정보 복사
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-ink/10 bg-paper-deep p-4">
            <p className="text-body-sm font-semibold text-ink">{data.recipient_name ?? "알 수 없음"}</p>
            <p className="mt-1 text-body-sm text-ink-mute">
              계좌 정보가 없어요. 수취인에게 설정 → 프로필에서 계좌를 등록해달라고 요청하세요.
            </p>
          </div>
        )}
      </section>

      {/* 카테고리별 합계 */}
      {Object.keys(byCategory).length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-h3 text-ink">카테고리별</h2>
          <div className="divide-y divide-ink/8 rounded-md border border-ink/10 bg-paper">
            {Object.entries(byCategory).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-body-sm text-ink-soft">{CATEGORY_LABEL[cat as ExpenseCategory] ?? cat}</span>
                <span className="font-mono text-body-sm tabular-nums text-ink">{formatKRW(amt)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-body-sm font-semibold text-ink">합계</span>
              <span className="font-mono text-body font-semibold tabular-nums text-coral">{formatKRW(data.total_amount)}</span>
            </div>
          </div>
        </section>
      )}

      {/* 지출 명세 */}
      <section className="mb-8">
        <h2 className="mb-3 text-h3 text-ink">지출 명세 ({data.expenses.length}건)</h2>
        {data.expenses.length === 0 ? (
          <p className="text-body-sm text-ink-mute">지출 내역이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {data.expenses.map((e) => (
              <Link key={e.id} href={`/teams/${teamId}/expenses/${e.id}`}
                className="flex items-center gap-3 rounded-md border border-ink/8 bg-paper px-4 py-2.5 hover:border-ink/25 hover:bg-paper-deep transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ink group-hover:underline">{e.description}</p>
                  <p className="text-caption text-ink-mute">
                    {CATEGORY_LABEL[e.category]} · {e.vendor && `${e.vendor} · `}{formatDateTime(e.spent_at)}
                  </p>
                </div>
                <span className="font-mono text-body-sm tabular-nums text-ink flex-shrink-0">{formatKRW(e.amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 송금 완료 정보 */}
      {data.status === "completed" && data.transfer_reference && (
        <section className="mb-8 rounded-md border border-sage/30 bg-sage/5 p-4">
          <p className="text-caption font-semibold uppercase tracking-wide text-sage">송금 완료</p>
          <p className="mt-1 text-body-sm text-ink">{data.transfer_reference}</p>
          {data.completed_at && <p className="mt-0.5 text-caption text-ink-mute">{formatDateTime(data.completed_at)}</p>}
        </section>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {data.status === "draft" && (
          <button onClick={handleConfirm} disabled={busy}
            className="inline-flex h-10 items-center rounded-md bg-ink px-6 text-body-sm font-medium text-paper hover:bg-ink/90 active:translate-y-px disabled:opacity-50 transition">
            {busy ? "처리 중…" : "정산 확정"}
          </button>
        )}
        {data.status === "confirmed" && (
          <>
            <button onClick={handleCopyBankInfo}
              disabled={!hasBankInfo}
              className="inline-flex h-10 items-center rounded-md border border-ink/20 px-5 text-body-sm text-ink hover:bg-paper-deep active:translate-y-px transition disabled:opacity-40 disabled:pointer-events-none">
              송금정보 복사
            </button>
            <button onClick={() => setShowCompleteModal(true)} disabled={busy}
              className="inline-flex h-10 items-center rounded-md bg-sage px-6 text-body-sm font-medium text-paper hover:bg-sage/90 active:translate-y-px disabled:opacity-50 transition">
              {busy ? "처리 중…" : "송금 완료 처리"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
