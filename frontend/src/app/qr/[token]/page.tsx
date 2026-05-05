"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── 픽셀 십자가 ────────────────────────────────────────────────────────────

function PixelCross({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="16" y="4" width="8" height="32" fill="var(--coral)" />
      <rect x="4" y="14" width="32" height="8" fill="var(--coral)" />
    </svg>
  );
}

// ── 타입 ─────────────────────────────────────────────────────────────────

interface QrPageData {
  team: { id: string; name: string; slug: string; description: string | null };
  token: { id: string; token: string; label: string | null };
}

type Kind = "prayer_request" | "testimony";

// ── 폼 상태 ──────────────────────────────────────────────────────────────

type FormState = "idle" | "submitting" | "success" | "notfound";

export default function QrFormPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<QrPageData | null>(null);
  const [state, setState] = useState<FormState>("idle");
  const [kind, setKind] = useState<Kind>("prayer_request");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/qr/${token}`)
      .then((r) => {
        if (r.status === 404) { setState("notfound"); return null; }
        return r.json();
      })
      .then((json) => { if (json?.data) setData(json.data); })
      .catch(() => setState("notfound"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError("내용을 입력해주세요."); return; }
    setError("");
    setState("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/v1/qr/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          content: content.trim(),
          submitted_name: name.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("제출에 실패했어요.");
      setState("success");
    } catch {
      setError("잠깐 문제가 있었어요. 다시 시도해주세요.");
      setState("idle");
    }
  };

  // ── 404 ───────────────────────────────────────────────────────────────

  if (state === "notfound") {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center px-5">
        <div className="text-center">
          <PixelCross />
          <p className="mt-6 text-body text-ci-gray">링크를 찾을 수 없어요.</p>
          <p className="mt-2 text-body-sm text-ci-gray/60">QR코드를 다시 스캔해주세요.</p>
        </div>
      </main>
    );
  }

  // ── 성공 ───────────────────────────────────────────────────────────────

  if (state === "success") {
    return (
      <main className="min-h-screen bg-midnight flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <PixelCross size={36} />
          <h1 className="font-display mt-6 text-h2 text-paper">감사합니다.</h1>
          <p className="mt-3 text-body text-ci-gray">
            {kind === "prayer_request"
              ? "기도제목이 팀에 전달됐어요. 팀이 함께 기도하겠습니다."
              : "간증이 팀에 전달됐어요. 함께 기뻐하겠습니다."}
          </p>
          <button
            onClick={() => {
              setState("idle");
              setContent("");
              setName("");
              setTimeout(() => textareaRef.current?.focus(), 80);
            }}
            className="mt-8 inline-flex h-10 items-center rounded-md border border-paper/20 px-5 text-body-sm text-paper/70 hover:border-paper/40 hover:text-paper transition"
          >
            하나 더 남기기
          </button>
        </div>
      </main>
    );
  }

  // ── 폼 ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* 헤더 */}
      <header className="bg-midnight px-5 py-8">
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-center gap-3">
            <PixelCross size={24} />
            <p className="text-body-sm text-ci-gray">동행 · 단기선교</p>
          </div>
          {data ? (
            <>
              <h1 className="font-display mt-4 text-h2 text-paper leading-tight">{data.team.name}</h1>
              {data.token.label && (
                <p className="mt-1 text-body-sm text-ci-gray">{data.token.label}</p>
              )}
            </>
          ) : (
            <div className="mt-4 h-8 w-48 animate-pulse rounded-sm bg-paper/10" />
          )}
        </div>
      </header>

      {/* 폼 본문 */}
      <main className="min-h-screen bg-paper px-5 py-8">
        <div className="mx-auto max-w-[480px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* 종류 선택 */}
            <fieldset>
              <legend className="text-caption font-semibold uppercase tracking-overline text-ink-soft">
                종류
              </legend>
              <div className="mt-3 flex gap-3">
                {([
                  { val: "prayer_request", label: "기도제목" },
                  { val: "testimony", label: "간증" },
                ] as { val: Kind; label: string }[]).map(({ val, label }) => (
                  <label
                    key={val}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border-2 py-3 text-body-sm font-medium transition-colors ${
                      kind === val
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/20 text-ink-soft hover:border-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={val}
                      checked={kind === val}
                      onChange={() => setKind(val)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* 내용 */}
            <label className="flex flex-col gap-2">
              <span className="text-caption font-semibold uppercase tracking-overline text-ink-soft">
                {kind === "prayer_request" ? "기도제목" : "간증"}
              </span>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  kind === "prayer_request"
                    ? "팀이 기도해드릴 내용을 적어주세요."
                    : "하나님이 행하신 일을 나눠주세요."
                }
                rows={6}
                maxLength={5000}
                autoFocus
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className="resize-none rounded-md border-2 border-ink/20 bg-transparent px-4 py-3 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
              />
              <p className={`text-right text-caption ${content.length > 4500 ? "font-medium text-rust" : "text-ink-mute"}`}>
                {content.length} / 5000
              </p>
            </label>

            {/* 이름 (선택) */}
            <label className="flex flex-col gap-2">
              <span className="text-caption font-semibold uppercase tracking-overline text-ink-soft">
                이름 <span className="font-normal normal-case text-ink-mute">(선택, 익명 가능)</span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름 또는 별명"
                maxLength={80}
                className="rounded-md border-2 border-ink/20 bg-transparent px-4 py-3 text-body text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none"
              />
            </label>

            {error && <p className="text-body-sm text-rust">{error}</p>}

            <button
              type="submit"
              disabled={state === "submitting" || !content.trim()}
              className="h-12 w-full rounded-md bg-ink text-body font-medium text-paper hover:bg-ink/90 disabled:opacity-40 disabled:pointer-events-none transition active:translate-y-px"
            >
              {state === "submitting" ? "전송 중…" : "전달하기"}
            </button>

            <p className="text-center text-caption text-ink-mute">
              익명으로 전달됩니다. 개인정보는 수집하지 않아요.
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
