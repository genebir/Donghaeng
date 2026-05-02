"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

const CURRENT_YEAR = new Date().getFullYear();

export default function NewOutreachPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();

  const [form, setForm] = useState({
    name: "",
    year: String(CURRENT_YEAR),
    starts_on: "",
    ends_on: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("아웃리치 이름을 입력해주세요.");

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      year: Number(form.year),
    };
    if (form.starts_on) body.starts_on = form.starts_on;
    if (form.ends_on) body.ends_on = form.ends_on;
    if (form.description.trim()) body.description = form.description.trim();

    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/outreaches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "아웃리치 생성에 실패했습니다.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-12 px-4">
      <div className="mb-8">
        <Link href="/dashboard" className="text-body-sm text-ink-mute hover:text-ink">
          ← 대시보드로
        </Link>
      </div>

      <h1 className="font-display text-h1 mb-2">
        아웃리치 만들기<span className="text-coral">.</span>
      </h1>
      <p className="text-body text-ink-soft mb-10">
        아웃리치를 만들고 팀과 멤버를 구성하세요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">
            아웃리치 이름 <span className="text-coral">*</span>
          </label>
          <input
            name="name"
            className={inputClass}
            placeholder="2026 여름 단기선교"
            value={form.name}
            onChange={handleChange}
            maxLength={120}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">
            연도 <span className="text-coral">*</span>
          </label>
          <input
            name="year"
            type="number"
            className={inputClass}
            value={form.year}
            onChange={handleChange}
            min={2020}
            max={2100}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">출발일</label>
            <input
              name="starts_on"
              type="date"
              className={inputClass}
              value={form.starts_on}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">귀국일</label>
            <input
              name="ends_on"
              type="date"
              className={inputClass}
              value={form.ends_on}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">설명</label>
          <textarea
            name="description"
            className={`${inputClass} h-24 resize-none`}
            placeholder="아웃리치에 대한 간단한 설명"
            value={form.description}
            onChange={handleChange}
            maxLength={2000}
          />
        </div>

        {error && (
          <div className="rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-body-sm text-rust">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-md bg-ink px-6 text-body font-medium text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "생성 중…" : "아웃리치 만들기"}
        </button>
      </form>
    </div>
  );
}
