"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "TRANSPORT", label: "교통" },
  { value: "LODGING", label: "숙박" },
  { value: "MEAL", label: "식사" },
  { value: "MINISTRY", label: "사역" },
  { value: "GIFT", label: "선물" },
  { value: "SUPPLIES", label: "물품" },
  { value: "MEDICAL", label: "의료" },
  { value: "MISC", label: "기타" },
];

const PAYMENT_METHODS = [
  { value: "PERSONAL_CARD", label: "개인 카드" },
  { value: "PERSONAL_CASH", label: "개인 현금" },
  { value: "CHURCH_CARD", label: "교회 카드" },
  { value: "OTHER", label: "기타" },
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-body-sm font-medium text-ink-soft">{children}</label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

const inputClass =
  "w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

export default function NewExpensePage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [form, setForm] = useState({
    amount: "",
    description: "",
    category: "MISC",
    vendor: "",
    spent_at: new Date().toISOString().slice(0, 16),
    payment_method: "PERSONAL_CARD",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 토큰은 next-auth 세션에서 읽어야 하지만, 이 클라이언트 컴포넌트에서는
      // API route를 경유해서 호출하거나 세션에서 토큰을 가져와야 함.
      // 일단 세션 쿠키 기반으로 내부 API route를 만들어 우회.
      const res = await fetch(`/api/expenses/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          spent_at: new Date(form.spent_at).toISOString(),
          currency: "KRW",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "등록에 실패했습니다.");
      }

      router.push(`/teams/${teamId}/expenses`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <header className="mb-8">
        <Link
          href={`/teams/${teamId}/expenses`}
          className="text-body-sm text-ink-mute hover:text-ink"
        >
          ← 지출 목록
        </Link>
        <h1 className="font-display mt-3 text-h1">지출 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="rounded-md border border-rust/30 bg-rust/10 px-4 py-3 text-body-sm text-rust">
            {error}
          </div>
        )}

        <Field>
          <Label>금액 (원) *</Label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            min="1"
            placeholder="10000"
            className={inputClass}
          />
        </Field>

        <Field>
          <Label>내용 *</Label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder="예: VBS 간식 구매"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>카테고리</Label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <Label>결제 방법</Label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field>
          <Label>상점/업체</Label>
          <input
            type="text"
            name="vendor"
            value={form.vendor}
            onChange={handleChange}
            placeholder="예: 이마트"
            className={inputClass}
          />
        </Field>

        <Field>
          <Label>지출 일시 *</Label>
          <input
            type="datetime-local"
            name="spent_at"
            value={form.spent_at}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </Field>

        <Field>
          <Label>메모</Label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="추가 설명 (선택)"
            className={inputClass + " resize-none"}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/teams/${teamId}/expenses`}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-ink/20 text-body text-ink hover:bg-paper-deep"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-ink text-body font-medium text-paper hover:bg-ink-soft disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
