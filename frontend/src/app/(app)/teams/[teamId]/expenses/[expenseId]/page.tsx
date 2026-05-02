"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ExpenseCategory, ExpensePublic, ExpenseStatus, PaymentMethod } from "@/types/api";

// ── 상수 ──────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통", LODGING: "숙박", MEAL: "식사", MINISTRY: "사역",
  GIFT: "선물", SUPPLIES: "물품", MEDICAL: "의료", MISC: "기타",
};

const PAYMENT_LABEL: Record<string, string> = {
  PERSONAL_CARD: "개인 카드", PERSONAL_CASH: "개인 현금",
  CHURCH_CARD: "교회 카드", OTHER: "기타",
};

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "TRANSPORT", label: "교통",  emoji: "🚌" }, { value: "LODGING",  label: "숙박", emoji: "🏠" },
  { value: "MEAL",      label: "식사",  emoji: "🍱" }, { value: "MINISTRY", label: "사역", emoji: "✝️" },
  { value: "GIFT",      label: "선물",  emoji: "🎁" }, { value: "SUPPLIES", label: "물품", emoji: "📦" },
  { value: "MEDICAL",   label: "의료",  emoji: "💊" }, { value: "MISC",     label: "기타", emoji: "📌" },
];
const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "PERSONAL_CASH", label: "개인 현금" }, { value: "PERSONAL_CARD", label: "개인 카드" },
  { value: "CHURCH_CARD",   label: "교회 카드" }, { value: "OTHER",         label: "기타" },
];

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; banner: string; chip: string }> = {
  pending:    { label: "검토 대기", banner: "border-mustard/40 bg-mustard/8 text-mustard",   chip: "bg-mustard/15 text-mustard" },
  approved:   { label: "승인됨",   banner: "border-sage/40 bg-sage/8 text-sage",             chip: "bg-sage/15 text-sage" },
  rejected:   { label: "반려됨",   banner: "border-rust/40 bg-rust/10 text-rust",             chip: "bg-rust/15 text-rust" },
  reimbursed: { label: "정산 완료", banner: "border-ocean/30 bg-ocean/8 text-ocean",         chip: "bg-ocean/15 text-ocean" },
};

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatKRW(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(n) ? "0원" : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalDatetimeStr(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── ChipGroup ─────────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
}: {
  options: readonly { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  const gridClass = columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center gap-1 rounded-xl py-3 px-1 text-center transition-colors ${
            value === opt.value
              ? "bg-ink text-paper"
              : "bg-paper-deep text-ink-soft hover:bg-ink/10 hover:text-ink"
          }`}
        >
          {opt.emoji && <span className="text-lg leading-none">{opt.emoji}</span>}
          <span className="text-caption font-medium leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── 편집 폼 ───────────────────────────────────────────────────────────────

interface EditFormProps {
  expense: ExpensePublic;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

function EditForm({ expense, onSave, onCancel }: EditFormProps) {
  const [form, setForm] = useState({
    amount: parseFloat(expense.amount).toString(),
    description: expense.description,
    category: expense.category,
    vendor: expense.vendor ?? "",
    spent_at: toLocalDatetimeStr(expense.spent_at),
    payment_method: expense.payment_method ?? "PERSONAL_CARD",
    notes: expense.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const inputClass = "w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
      vendor: form.vendor || null,
      spent_at: new Date(form.spent_at).toISOString(),
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-ink-soft">금액 (원) *</label>
        <input type="number" name="amount" value={form.amount} onChange={handleChange}
          onFocus={(e) => e.target.select()}
          required min="1" placeholder="10000" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-ink-soft">내용 *</label>
        <input type="text" name="description" value={form.description} onChange={handleChange}
          required placeholder="VBS 간식 구매" className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-body-sm font-medium text-ink-soft">카테고리</p>
        <ChipGroup
          options={CATEGORIES}
          value={form.category as ExpenseCategory}
          onChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          columns={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-body-sm font-medium text-ink-soft">결제 방법</p>
        <ChipGroup
          options={PAYMENT_METHODS}
          value={form.payment_method}
          onChange={(v) => setForm((prev) => ({ ...prev, payment_method: v as PaymentMethod }))}
          columns={2}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-ink-soft">상점/업체</label>
        <input type="text" name="vendor" value={form.vendor} onChange={handleChange}
          placeholder="이마트" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-ink-soft">지출 일시 *</label>
        <input type="datetime-local" name="spent_at" value={form.spent_at} onChange={handleChange}
          required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-ink-soft">메모</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
          placeholder="추가 설명 (선택)" className={inputClass + " resize-none"}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !saving) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="h-10 flex-1 rounded-md border border-ink/20 text-body-sm text-ink hover:bg-paper-deep">
          취소
        </button>
        <button type="submit" disabled={saving}
          className="h-10 flex-1 rounded-md bg-ink text-body-sm font-medium text-paper hover:opacity-80 disabled:opacity-50">
          {saving ? "저장 중…" : "수정 저장"}
        </button>
      </div>
    </form>
  );
}

// ── Detail Row ────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-ink/8 last:border-0">
      <dt className="w-24 flex-shrink-0 text-body-sm text-ink-mute">{label}</dt>
      <dd className="text-body-sm text-ink">{value}</dd>
    </div>
  );
}

// ── RejectModal ───────────────────────────────────────────────────────────

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
        <textarea className="w-full resize-none rounded-md border border-ink/20 bg-paper p-3 text-body focus:border-ink focus:outline-none"
          rows={3} placeholder="영수증 사진이 흐림. 재촬영 부탁드려요."
          value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && reason.trim()) {
              e.preventDefault();
              onConfirm(reason.trim());
            }
          }} />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep">취소</button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason.trim())}
            className="inline-flex h-9 items-center rounded-md bg-rust px-4 text-body-sm text-paper hover:bg-rust/90 disabled:opacity-40 disabled:pointer-events-none">
            반려 처리
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 영수증 라이트박스 ─────────────────────────────────────────────────────

function ReceiptLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative max-h-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="영수증" className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-xl" />
        <button onClick={onClose}
          className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-ink/80">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const { teamId, expenseId } = useParams<{ teamId: string; expenseId: string }>();
  const router = useRouter();

  const [expense, setExpense] = useState<ExpensePublic | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [expRes, meRes] = await Promise.all([
          fetch(`/api/expense/${expenseId}`),
          fetch("/api/users/me"),
        ]);
        if (expRes.ok) {
          const expData: ExpensePublic = (await expRes.json()).data;
          setExpense(expData);
          if (expData.receipt_media_id) {
            const mediaRes = await fetch(`/api/media-asset/${expData.receipt_media_id}`);
            if (mediaRes.ok) {
              const mediaData = (await mediaRes.json()).data;
              setReceiptUrl(mediaData?.view_url ?? null);
            }
          }
        } else {
          showToast("지출 내역을 불러오지 못했어요.", false);
        }
        if (meRes.ok) {
          const me = (await meRes.json()).data;
          setMeId(me?.id ?? null);
          const orgRole = me?.org_role;
          const isOrgAdmin = orgRole === "OWNER" || orgRole === "ADMIN";
          const isDirector = (me?.outreach_memberships ?? []).some((om: { role: string }) => om.role === "DIRECTOR");
          const isStaff = (me?.outreach_memberships ?? []).some(
            (om: { role: string; team_id: string | null }) => om.role === "STAFF" && om.team_id === teamId
          );
          const isLeader = (me?.team_memberships ?? []).some(
            (tm: { team_id: string; role: string }) => tm.team_id === teamId && tm.role === "LEADER"
          );
          setIsAdmin(isOrgAdmin || isDirector || isStaff || isLeader);
        }
      } catch {
        showToast("불러오기에 실패했어요.", false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [expenseId, teamId, showToast]);

  const isSelf = expense?.purchaser_user_id === meId;
  const canEdit = (isSelf || isAdmin) && (expense?.status === "pending" || expense?.status === "rejected");
  const canDelete = (isSelf || isAdmin) && (expense?.status === "pending" || expense?.status === "rejected");
  const canApprove = isAdmin && expense?.status === "pending";
  const canReject = isAdmin && (expense?.status === "pending");

  const handleSaveEdit = async (patch: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/expense/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "수정 실패", false); return; }
      setExpense(json.data);
      setEditing(false);
      showToast("수정됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/expense/${expenseId}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "승인 실패", false); return; }
      setExpense(json.data);
      showToast("승인됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleReject = async (reason: string) => {
    setShowRejectModal(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/expense/${expenseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "반려 실패", false); return; }
      setExpense(json.data);
      showToast("반려 처리됐어요.", true);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/expense/${expenseId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        showToast("삭제됐어요.", true);
        setTimeout(() => router.push(`/teams/${teamId}/expenses`), 800);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message ?? "삭제 실패", false);
      }
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setBusy(false); setConfirmDelete(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px]">
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-paper-deep" />)}</div>
      </div>
    );
  }

  if (!expense) return (
    <div className="mx-auto max-w-[600px] py-16 text-center">
      <p className="text-body text-ink-mute">지출 내역을 찾을 수 없어요.</p>
      <button onClick={() => router.back()} className="mt-4 text-body-sm text-ocean hover:underline">← 돌아가기</button>
    </div>
  );

  const sc = STATUS_CONFIG[expense.status];

  return (
    <div className="mx-auto max-w-[600px]">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}
      {showRejectModal && (
        <RejectModal onClose={() => setShowRejectModal(false)} onConfirm={handleReject} />
      )}
      {receiptOpen && receiptUrl && (
        <ReceiptLightbox url={receiptUrl} onClose={() => setReceiptOpen(false)} />
      )}

      {/* 뒤로 가기 */}
      <button onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-body-sm text-ink-mute hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 7H3M6 4L3 7l3 3" />
        </svg>
        뒤로
      </button>

      {/* 상태 배너 */}
      <div className={`mb-6 rounded-md border px-5 py-4 ${sc.banner}`}>
        <div className="flex items-center gap-3">
          <span className={`rounded px-2 py-0.5 text-body-sm font-semibold ${sc.chip}`}>{sc.label}</span>
          <span className="font-mono text-h3 font-bold text-ink">{formatKRW(expense.amount)}</span>
        </div>
        {expense.status === "rejected" && expense.rejection_reason && (
          <div className="mt-3 border-t border-rust/20 pt-3">
            <p className="text-body-sm font-semibold text-rust">반려 사유</p>
            <p className="mt-1 text-body-sm text-ink">{expense.rejection_reason}</p>
            {canEdit && (
              <button onClick={() => setEditing(true)}
                className="mt-3 inline-flex h-8 items-center rounded-md bg-rust px-4 text-body-sm font-medium text-paper hover:bg-rust/90">
                수정하여 재제출
              </button>
            )}
          </div>
        )}
        {expense.status === "approved" && (
          <p className="mt-1 text-body-sm opacity-80">
            {expense.approved_at && `${formatDateTime(expense.approved_at)} 승인`}
          </p>
        )}
      </div>

      {/* 편집 폼 or 상세 */}
      {editing ? (
        <div className="rounded-md border border-ink/10 bg-paper p-5">
          <h2 className="mb-4 text-h3 font-medium">지출 수정</h2>
          <EditForm expense={expense} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <>
          <dl className="rounded-md border border-ink/10 bg-paper px-5 py-1 mb-4">
            <DetailRow label="내용" value={expense.description} />
            <DetailRow label="카테고리" value={CATEGORY_LABEL[expense.category]} />
            <DetailRow label="금액" value={<span className="font-mono font-semibold">{formatKRW(expense.amount)}</span>} />
            <DetailRow label="지출 일시" value={formatDateTime(expense.spent_at)} />
            {expense.vendor && <DetailRow label="상점/업체" value={expense.vendor} />}
            {expense.payment_method && <DetailRow label="결제 방법" value={PAYMENT_LABEL[expense.payment_method] ?? expense.payment_method} />}
            {expense.purchaser_name && <DetailRow label="등록자" value={expense.purchaser_name} />}
            {expense.notes && <DetailRow label="메모" value={expense.notes} />}
            {expense.receipt_media_id && (
              <DetailRow label="영수증" value={
                receiptUrl ? (
                  <button onClick={() => setReceiptOpen(true)}
                    className="group relative block overflow-hidden rounded-md border border-ink/10 hover:border-ink/30 transition-colors">
                    <img src={receiptUrl} alt="영수증" className="h-32 w-auto max-w-[200px] object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/20 transition-colors">
                      <span className="rounded bg-ink/70 px-2 py-0.5 text-caption text-paper opacity-0 group-hover:opacity-100 transition-opacity">크게 보기</span>
                    </div>
                  </button>
                ) : (
                  <span className="text-sage">첨부됨</span>
                )
              } />
            )}
            <DetailRow label="등록 일시" value={formatDateTime(expense.created_at)} />
          </dl>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2">
            {canEdit && expense.status !== "rejected" && (
              <button onClick={() => setEditing(true)} disabled={busy}
                className="inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep disabled:opacity-50">
                수정
              </button>
            )}
            {canApprove && (
              <button onClick={handleApprove} disabled={busy}
                className="inline-flex h-9 items-center rounded-md bg-sage px-4 text-body-sm font-medium text-paper hover:bg-sage/90 disabled:opacity-50">
                {busy ? "처리 중…" : "승인"}
              </button>
            )}
            {canReject && (
              <button onClick={() => setShowRejectModal(true)} disabled={busy}
                className="inline-flex h-9 items-center rounded-md border border-rust px-4 text-body-sm text-rust hover:bg-rust/10 disabled:opacity-50">
                반려
              </button>
            )}
            {canDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 rounded-md border border-rust/30 bg-rust/5 px-4 py-1.5">
                  <span className="text-body-sm text-rust">정말 삭제할까요?</span>
                  <button onClick={handleDelete} disabled={busy}
                    className="text-body-sm font-medium text-rust hover:underline disabled:opacity-50">
                    {busy ? "…" : "삭제"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-body-sm text-ink-mute hover:text-ink">취소</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-9 items-center rounded-md px-4 text-body-sm text-ink-mute hover:text-rust">
                  삭제
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
