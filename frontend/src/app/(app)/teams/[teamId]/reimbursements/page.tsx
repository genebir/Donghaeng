"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReimbursementPublic, ReimbursementPreviewItem, ReimbursementStatus, ExpenseCategory } from "@/types/api";

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
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ReimbursementsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();

  const [preview, setPreview] = useState<ReimbursementPreviewItem[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null); // user_id being created
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [previewRes, listRes] = await Promise.all([
          fetch(`/api/reimbursements/${teamId}/preview`, { method: "POST" }),
          fetch(`/api/reimbursements/${teamId}`),
        ]);
        if (previewRes.ok) setPreview((await previewRes.json()).data ?? []);
        if (listRes.ok) setReimbursements((await listRes.json()).data ?? []);
      } catch { showToast("불러오기에 실패했어요.", false); }
      finally { setLoading(false); }
    };
    load();
  }, [teamId, showToast]);

  const handleCreate = async (recipientUserId: string) => {
    setCreating(recipientUserId);
    try {
      const res = await fetch(`/api/reimbursements/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_user_id: recipientUserId }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.message ?? "정산 생성 실패", false); return; }
      router.push(`/teams/${teamId}/reimbursements/${json.data.id}`);
    } catch { showToast("잠깐 문제가 있었어요.", false); }
    finally { setCreating(null); }
  };

  // 이미 draft/confirmed 상태인 수취인은 preview에서 제외
  const inProgressUserIds = new Set(
    reimbursements.filter((r) => r.status !== "completed").map((r) => r.recipient_user_id)
  );
  const pendingPreview = preview.filter((p) => !inProgressUserIds.has(p.recipient_user_id));

  return (
    <div className="mx-auto max-w-[720px]">
      {toast && (
        <div className={`fixed right-5 top-16 z-50 rounded-md border-l-2 bg-ink px-5 py-3 text-body-sm text-paper shadow-lg ${toast.ok ? "border-l-sage" : "border-l-rust"}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8">
        <p className="text-overline uppercase tracking-overline text-ink-mute">회계</p>
        <h1 className="font-display mt-1 text-h1">정산<span className="text-coral">.</span></h1>
      </header>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-md bg-paper-deep" />)}</div>
      ) : (
        <>
          {/* 정산 대기 섹션 */}
          {pendingPreview.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-h3 text-ink">정산 대기 중</h2>
              <p className="mb-4 text-body-sm text-ink-mute">승인된 지출 중 아직 정산되지 않은 항목입니다.</p>
              <div className="flex flex-col gap-3">
                {pendingPreview.map((item) => (
                  <div key={item.recipient_user_id}
                    className="flex items-center gap-4 rounded-md border border-ink/10 bg-paper p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold text-ink">
                        {item.recipient_name ?? "알 수 없음"}
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="font-mono text-h3 font-semibold tabular-nums text-ink">
                          {formatKRW(item.total_amount)}
                        </span>
                        <span className="text-body-sm text-ink-mute">{item.expense_count}건</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-caption text-ink-mute">
                        {Object.entries(item.by_category).map(([cat, amt]) => (
                          <span key={cat}>
                            {CATEGORY_LABEL[cat as ExpenseCategory] ?? cat} {formatKRW(amt)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreate(item.recipient_user_id)}
                      disabled={creating === item.recipient_user_id}
                      className="inline-flex h-9 flex-shrink-0 items-center rounded-md bg-ink px-4 text-body-sm text-paper hover:bg-ink/90 active:translate-y-px disabled:opacity-50">
                      {creating === item.recipient_user_id ? "생성 중…" : "정산 만들기"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 기존 정산 목록 */}
          <section>
            {reimbursements.length > 0 && (
              <>
                <h2 className="mb-3 text-h3 text-ink">정산 내역</h2>
                <div className="flex flex-col gap-2">
                  {reimbursements.map((r) => (
                    <Link key={r.id}
                      href={`/teams/${teamId}/reimbursements/${r.id}`}
                      className="flex items-center gap-4 rounded-md border border-ink/10 bg-paper p-4 hover:border-ink/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-semibold text-ink">
                            {r.recipient_name ?? "알 수 없음"}
                          </span>
                          <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide ${STATUS_CHIP[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-2">
                          <span className="font-mono text-body font-semibold tabular-nums text-ink">
                            {formatKRW(r.total_amount)}
                          </span>
                          <span className="text-caption text-ink-mute">{formatDate(r.created_at)}</span>
                        </div>
                        {r.completed_at && (
                          <p className="mt-0.5 text-caption text-ink-mute">
                            송금 {formatDate(r.completed_at)}
                            {r.transfer_reference && ` · ${r.transfer_reference}`}
                          </p>
                        )}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-ink-mute" aria-hidden>
                        <path d="M6 3l5 5-5 5" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {pendingPreview.length === 0 && reimbursements.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-body text-ink-mute">아직 정산할 내역이 없어요.</p>
                <p className="mt-2 text-body-sm text-ink-mute">지출을 승인하면 여기에 표시돼요.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
