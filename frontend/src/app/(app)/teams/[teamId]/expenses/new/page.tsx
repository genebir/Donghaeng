"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── 상수 ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "TRANSPORT", label: "교통",   emoji: "🚌" },
  { value: "MEAL",      label: "식사",   emoji: "🍱" },
  { value: "MINISTRY",  label: "사역",   emoji: "✝️" },
  { value: "SUPPLIES",  label: "물품",   emoji: "📦" },
  { value: "LODGING",   label: "숙박",   emoji: "🏠" },
  { value: "GIFT",      label: "선물",   emoji: "🎁" },
  { value: "MEDICAL",   label: "의료",   emoji: "💊" },
  { value: "MISC",      label: "기타",   emoji: "📌" },
] as const;

const PAYMENT_METHODS = [
  { value: "PERSONAL_CASH", label: "개인 현금" },
  { value: "PERSONAL_CARD", label: "개인 카드" },
  { value: "CHURCH_CARD",   label: "교회 카드" },
  { value: "OTHER",         label: "기타" },
] as const;

// ── 유틸 ──────────────────────────────────────────────────────────────────

function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── 영수증 업로드 ─────────────────────────────────────────────────────────

type ReceiptState = "idle" | "uploading" | "done" | "error";

function ReceiptUpload({
  teamId,
  onUploaded,
}: {
  teamId: string;
  onUploaded: (mediaId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ReceiptState>("idle");
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    setState("uploading");

    try {
      const presignRes = await fetch(`/api/media/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type, byte_size: file.size }),
      });
      if (!presignRes.ok) throw new Error();
      const { data: presign } = await presignRes.json();

      const putRes = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error();

      const completeRes = await fetch(`/api/media-complete/${presign.media_id}`, { method: "POST" });
      if (!completeRes.ok) throw new Error();

      setState("done");
      onUploaded(presign.media_id);
    } catch {
      setState("error");
      setPreview(null);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (state === "done" && preview) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 flex-shrink-0">
          <img src={preview} alt="영수증" className="h-full w-full rounded-md object-cover border border-ink/15" />
          <button
            type="button"
            onClick={() => { setState("idle"); setPreview(null); }}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-paper hover:bg-rust"
          >
            ✕
          </button>
        </div>
        <p className="text-body-sm text-sage">✓ 영수증 업로드 완료</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { setState("idle"); setPreview(null); }}
          className="h-9 rounded-md border border-rust/40 px-4 text-body-sm text-rust hover:bg-rust/5">
          업로드 실패 — 다시 시도
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={state === "uploading"}
      className="flex items-center gap-2.5 rounded-md border border-dashed border-ink/25 px-4 py-2.5 text-body-sm text-ink-mute hover:border-ink/50 hover:text-ink-soft transition disabled:opacity-50"
    >
      {state === "uploading" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-mute border-t-transparent flex-shrink-0" />
          업로드 중…
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
            <rect x="1" y="2.5" width="14" height="11" rx="1.5" />
            <circle cx="5.5" cy="6.5" r="1.2" />
            <path d="M1.5 10.5l3.5-3 2.5 2.5 2-2 4 4" />
          </svg>
          영수증 사진 추가 (선택)
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
    </button>
  );
}

// ── 칩 선택기 ─────────────────────────────────────────────────────────────

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

// ── 메인 폼 ───────────────────────────────────────────────────────────────

export default function NewExpensePage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "MISC" as typeof CATEGORIES[number]["value"],
    payment_method: "PERSONAL_CASH" as typeof PAYMENT_METHODS[number]["value"],
    vendor: "",
    spent_at: localNow(),
    notes: "",
  });
  const [receiptMediaId, setReceiptMediaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const amountRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("금액을 입력해주세요.");
      amountRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/expenses/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category,
          payment_method: form.payment_method,
          vendor: form.vendor || null,
          spent_at: new Date(form.spent_at).toISOString(),
          notes: form.notes || null,
          currency: "KRW",
          ...(receiptMediaId ? { receipt_media_id: receiptMediaId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "등록에 실패했습니다.");
      }

      setForm({
        amount: "",
        description: "",
        category: "MISC" as typeof CATEGORIES[number]["value"],
        payment_method: "PERSONAL_CASH" as typeof PAYMENT_METHODS[number]["value"],
        vendor: "",
        spent_at: localNow(),
        notes: "",
      });
      setReceiptMediaId(null);
      setSuccessCount((n) => n + 1);
      amountRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <header className="mb-6">
        <Link href={`/teams/${teamId}/expenses`}
          className="mb-4 flex items-center gap-1.5 text-body-sm text-ink-mute hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 7H3M6 4L3 7l3 3" />
          </svg>
          지출 목록
        </Link>
        <h1 className="font-display text-h1">지출 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {successCount > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-sage/30 bg-sage/8 px-4 py-3">
            <p className="text-body-sm text-sage font-medium">
              {successCount}건 등록됐어요. 계속 입력하거나 목록으로 돌아가세요.
            </p>
            <Link
              href={`/teams/${teamId}/expenses`}
              className="flex-shrink-0 text-body-sm text-sage hover:underline"
            >
              목록 보기 →
            </Link>
          </div>
        )}
        {error && (
          <div className="rounded-md border border-rust/30 bg-rust/8 px-4 py-3 text-body-sm text-rust">
            {error}
          </div>
        )}

        {/* ① 금액 — 가장 크게, 가장 먼저 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount" className="text-body-sm font-medium text-ink-soft">금액 *</label>
          <div className="relative">
            <input
              ref={amountRef}
              id="amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value.replace(/[^0-9.]/g, ""))}
              required
              placeholder="0"
              autoFocus
              className="w-full rounded-md border border-ink/20 bg-paper py-3 pl-5 pr-14 text-h2 font-semibold text-ink placeholder:text-ink-mute/40 focus:border-ink focus:outline-none"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-sm font-medium text-ink-mute">원</span>
          </div>
        </div>

        {/* ② 내용 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-body-sm font-medium text-ink-soft">내용 *</label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
            placeholder="예: VBS 간식 구매"
            className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
          />
        </div>

        {/* ③ 카테고리 — 칩 */}
        <div className="flex flex-col gap-2">
          <p className="text-body-sm font-medium text-ink-soft">카테고리</p>
          <ChipGroup
            options={CATEGORIES}
            value={form.category}
            onChange={(v) => set("category", v)}
            columns={4}
          />
        </div>

        {/* ④ 결제 방법 — 칩 */}
        <div className="flex flex-col gap-2">
          <p className="text-body-sm font-medium text-ink-soft">결제 방법</p>
          <ChipGroup
            options={PAYMENT_METHODS}
            value={form.payment_method}
            onChange={(v) => set("payment_method", v)}
            columns={2}
          />
        </div>

        {/* ⑤ 상점/업체 (선택) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vendor" className="text-body-sm font-medium text-ink-soft">
            상점/업체 <span className="text-caption font-normal text-ink-mute">(선택)</span>
          </label>
          <input
            id="vendor"
            type="text"
            value={form.vendor}
            onChange={(e) => set("vendor", e.target.value)}
            placeholder="예: 이마트, 편의점"
            className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
          />
        </div>

        {/* ⑥ 지출 일시 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="spent_at" className="text-body-sm font-medium text-ink-soft">지출 일시 *</label>
            <button
              type="button"
              onClick={() => set("spent_at", localNow())}
              className="text-caption text-ocean hover:underline"
            >
              지금으로 설정
            </button>
          </div>
          <input
            id="spent_at"
            type="datetime-local"
            value={form.spent_at}
            onChange={(e) => set("spent_at", e.target.value)}
            required
            className="w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink focus:border-ink focus:outline-none"
          />
        </div>

        {/* ⑦ 영수증 사진 */}
        <div className="flex flex-col gap-2">
          <p className="text-body-sm font-medium text-ink-soft">영수증</p>
          <ReceiptUpload teamId={teamId} onUploaded={(id) => setReceiptMediaId(id)} />
        </div>

        {/* ⑧ 메모 (선택) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-body-sm font-medium text-ink-soft">
            메모 <span className="text-caption font-normal text-ink-mute">(선택)</span>
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="추가 설명"
            className="w-full resize-none rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
          />
        </div>

        {/* 제출 */}
        <div className="flex gap-3 pb-8 pt-2">
          <Link
            href={`/teams/${teamId}/expenses`}
            className="flex h-12 flex-1 items-center justify-center rounded-md border border-ink/20 text-body text-ink hover:bg-paper-deep"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 flex-1 items-center justify-center rounded-md bg-ink text-body font-medium text-paper hover:bg-ink/90 disabled:opacity-50"
          >
            {loading ? "등록 중…" : successCount > 0 ? "다음 지출 등록" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
