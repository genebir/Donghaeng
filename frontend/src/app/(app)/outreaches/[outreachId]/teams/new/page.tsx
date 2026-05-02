"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-md border border-ink/20 bg-paper px-4 py-2.5 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/[가-힣\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export default function NewTeamPage() {
  const router = useRouter();
  const { outreachId } = useParams<{ outreachId: string }>();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    starts_on: "",
    ends_on: "",
    description: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setForm((prev) => ({ ...prev, name: v, ...(slugEdited ? {} : { slug: toSlug(v) }) }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === "slug") {
      setSlugEdited(true);
      setForm((prev) => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("팀 이름을 입력해주세요.");
    if (form.slug.length < 2) return setError("슬러그는 2자 이상이어야 합니다.");

    const body: Record<string, unknown> = { name: form.name.trim(), slug: form.slug };
    if (form.starts_on) body.starts_on = form.starts_on;
    if (form.ends_on) body.ends_on = form.ends_on;
    if (form.description.trim()) body.description = form.description.trim();

    setLoading(true);
    try {
      const res = await fetch(`/api/outreaches/${outreachId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "팀 생성에 실패했습니다.");
      // 생성된 팀 홈으로 이동
      const teamId = data.data?.id;
      router.push(teamId ? `/teams/${teamId}/members` : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-body-sm text-ink-mute hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 7H3M6 4L3 7l3 3" />
        </svg>
        대시보드
      </Link>

      <header className="mb-10">
        <p className="tracking-overline text-overline uppercase text-ink-mute">팀</p>
        <h1 className="font-display mt-1 text-h1">
          팀 만들기<span className="text-coral">.</span>
        </h1>
        <p className="mt-2 text-body text-ink-soft">
          팀을 만들고 팀장과 팀원을 추가하세요.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">
            팀 이름 <span className="text-coral">*</span>
          </label>
          <input
            className={inputClass}
            placeholder="우도교회 팀"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={120}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">
            슬러그 <span className="text-coral">*</span>
          </label>
          <input
            name="slug"
            className={inputClass}
            placeholder="udo-church"
            value={form.slug}
            onChange={handleChange}
            maxLength={64}
            required
          />
          <p className="text-caption text-ink-mute">소문자·숫자·하이픈만. 공유 URL에 사용됩니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">출발일</label>
            <input name="starts_on" type="date" className={inputClass} value={form.starts_on} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-soft">귀국일</label>
            <input name="ends_on" type="date" className={inputClass} value={form.ends_on} onChange={handleChange} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">설명</label>
          <textarea
            name="description"
            className={`${inputClass} h-20 resize-none`}
            placeholder="팀에 대한 간단한 설명"
            value={form.description}
            onChange={handleChange}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
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
          {loading ? "생성 중…" : "팀 만들기"}
        </button>
      </form>
    </div>
  );
}
