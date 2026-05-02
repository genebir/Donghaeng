"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function handleSlugChange(v: string) {
    setSlugEdited(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("교회 이름을 입력해주세요.");
    if (slug.length < 2) return setError("슬러그는 2자 이상이어야 합니다.");

    setLoading(true);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "교회 생성에 실패했습니다.");
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
        <Link
          href="/dashboard"
          className="text-body-sm text-ink-mute hover:text-ink"
        >
          ← 대시보드로
        </Link>
      </div>

      <h1 className="font-display text-h1 mb-2">
        교회 만들기<span className="text-coral">.</span>
      </h1>
      <p className="text-body text-ink-soft mb-10">
        교회를 만들면 아웃리치와 팀을 관리할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-soft">
            교회 이름 <span className="text-coral">*</span>
          </label>
          <input
            className={inputClass}
            placeholder="우리들교회"
            value={name}
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
          <div className="flex items-center gap-0 rounded-md border border-ink/20 bg-paper focus-within:border-ink overflow-hidden">
            <span className="px-3 text-body text-ink-mute select-none border-r border-ink/20 bg-ink/5 py-2.5">
              donghaeng.app/share/
            </span>
            <input
              className="flex-1 bg-transparent px-3 py-2.5 text-body text-ink placeholder:text-ink-mute focus:outline-none"
              placeholder="uri-deul-gyo-hoe"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              maxLength={64}
              required
            />
          </div>
          <p className="text-caption text-ink-mute">
            소문자·숫자·하이픈만 사용 가능. 공유 페이지 URL에 사용됩니다.
          </p>
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
          {loading ? "생성 중…" : "교회 만들기"}
        </button>
      </form>
    </div>
  );
}
