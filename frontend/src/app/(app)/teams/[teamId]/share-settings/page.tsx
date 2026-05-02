"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function IconCopy() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="5" width="8" height="8" rx="1" />
      <path d="M10 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8" />
      <path d="M8 1h4v4M12 1L6 7" />
    </svg>
  );
}

interface TeamPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function ShareSettingsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamPublic | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json?.data) setTeam(json.data); })
      .catch(() => {});
  }, [teamId]);

  const shareUrl = team
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${team.slug}`
    : "";

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [shareUrl]);

  return (
    <div className="mx-auto max-w-[640px]">
      <header className="mb-8">
        <p className="text-overline uppercase tracking-overline text-ink-mute">본진 공유</p>
        <h1 className="font-display mt-1 text-h1">공유 설정<span className="text-coral">.</span></h1>
      </header>

      {/* 공개 URL 카드 */}
      <div className="rounded-md border border-ink/10 bg-paper p-6">
        <h2 className="text-h3 font-medium">본진 공유 링크</h2>
        <p className="mt-1 text-body-sm text-ink-soft">
          이 링크를 교회에 공유하면, 팀이 발행한 소식을 누구나 볼 수 있어요.
          로그인 없이 접근 가능한 공개 페이지입니다.
        </p>

        {team ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-paper-deep px-4 py-3">
              <p className="flex-1 truncate font-mono text-body-sm text-ink">{shareUrl}</p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-caption font-medium text-ink-soft transition hover:bg-ink/8 hover:text-ink"
              >
                <IconCopy />
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/share/${team.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-body-sm text-ocean hover:underline"
              >
                <IconExternalLink />
                페이지 미리보기
              </Link>
              <span className="text-ink-mute">·</span>
              <p className="text-body-sm text-ink-mute">
                슬러그: <code className="font-mono text-ink">{team.slug}</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 h-12 animate-pulse rounded-md bg-paper-deep" />
        )}
      </div>

      {/* 소식 관리 바로가기 */}
      <div className="mt-4 rounded-md border border-ink/10 bg-paper p-6">
        <h2 className="text-h3 font-medium">소식 게시</h2>
        <p className="mt-1 text-body-sm text-ink-soft">
          "본진 소식" 메뉴에서 글을 작성하고 발행하면 공유 페이지에 바로 표시돼요.
        </p>
        <Link
          href={`/teams/${teamId}/home-updates`}
          className="mt-4 inline-flex h-9 items-center rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep"
        >
          소식 작성하러 가기 →
        </Link>
      </div>

      {/* 안내 */}
      <div className="mt-4 rounded-md bg-paper-deep px-5 py-4">
        <p className="text-body-sm text-ink-soft">
          <span className="font-medium text-ink">참고 :</span>{" "}
          슬러그(URL의 <code className="font-mono">/share/</code> 뒤 부분)는 한 번 설정되면 변경할 수 없어요.
          공유 링크가 카카오톡 등에 퍼진 후에 바뀌면 링크가 깨지기 때문입니다.
        </p>
      </div>
    </div>
  );
}
