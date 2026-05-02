import type { Metadata } from "next";
import type { SharePageData } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getShareData(slug: string): Promise<SharePageData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/share/${slug}`, {
      next: { revalidate: 60 }, // 1분 캐시
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ── OG 메타 ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShareData(slug);
  if (!data) return { title: "동행" };
  return {
    title: `${data.team.name} — 동행`,
    description: data.team.description ?? `${data.team.name}의 아웃리치 소식을 전합니다.`,
    openGraph: {
      title: `${data.team.name} 아웃리치 소식`,
      description: data.team.description ?? `${data.team.name}의 본진 공유 페이지입니다.`,
    },
  };
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ── 픽셀 십자가 SVG ──────────────────────────────────────────────────────────

function PixelCross() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="16" y="4" width="8" height="32" fill="var(--coral)" />
      <rect x="4" y="14" width="32" height="8" fill="var(--coral)" />
    </svg>
  );
}

function PixelDots() {
  const dots: { x: number; y: number }[] = [
    { x: 0, y: 0 }, { x: 16, y: 0 }, { x: 32, y: 8 }, { x: 8, y: 16 },
    { x: 40, y: 16 }, { x: 0, y: 24 }, { x: 24, y: 24 }, { x: 16, y: 32 },
    { x: 40, y: 32 }, { x: 8, y: 40 }, { x: 32, y: 40 },
  ];
  return (
    <svg viewBox="0 0 48 48" width="120" height="120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="opacity-20">
      {dots.map(({ x, y }, i) => (
        <rect key={i} x={x} y={y} width="6" height="6" fill="var(--ci-gray)" />
      ))}
    </svg>
  );
}

// ── 페이지 ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const data = await getShareData(slug);

  if (!data) {
    return (
      <main className="min-h-screen bg-midnight text-paper flex items-center justify-center px-5">
        <div className="text-center">
          <PixelCross />
          <p className="mt-6 text-body text-ci-gray">페이지를 찾을 수 없어요.</p>
          <p className="mt-2 text-body-sm text-ci-gray/60">링크를 다시 확인해 주세요.</p>
        </div>
      </main>
    );
  }

  const { team, updates } = data;

  return (
    <>
      {/* ── 헤더 (midnight) ─────────────────────────────────────────── */}
      <header className="bg-midnight px-5 py-10 md:py-16">
        <div className="mx-auto max-w-[720px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-overline uppercase tracking-[0.12em] text-ci-gray">동행 · 단기선교</p>
              <h1 className="font-display mt-2 text-h1 text-paper leading-tight">
                {team.name}
              </h1>
              {team.description && (
                <p className="mt-3 max-w-prose text-body text-ci-gray">{team.description}</p>
              )}
            </div>
            <div className="flex-shrink-0 hidden sm:block">
              <PixelDots />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <PixelCross />
            <p className="text-body-sm text-ci-gray/80">
              이 팀을 위해 기도해주세요.
            </p>
          </div>
        </div>
      </header>

      {/* ── 픽셀 디바이더 ────────────────────────────────────────────── */}
      <div className="bg-midnight px-5 pb-3">
        <div className="mx-auto max-w-[720px]">
          <div className="flex gap-1.5">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-none bg-ci-gray/30" />
            ))}
          </div>
        </div>
      </div>

      {/* ── 본문 (paper) ─────────────────────────────────────────────── */}
      <main className="min-h-screen bg-paper px-5 py-10 md:py-16">
        <div className="mx-auto max-w-[720px]">

          {updates.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body text-ink-mute">아직 공유된 소식이 없어요.</p>
              <p className="mt-2 text-body-sm text-ink-mute">팀이 소식을 올리면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {updates.map((update, i) => (
                <article key={update.id}>
                  {/* 날짜 overline */}
                  {update.published_at && (
                    <p className="text-overline uppercase tracking-[0.12em] text-ink-mute mb-3">
                      {formatDate(update.published_at)}
                    </p>
                  )}

                  <h2 className="font-display text-h2 text-ink leading-snug">
                    {update.title}
                  </h2>

                  <p className="mt-4 text-body text-ink-soft whitespace-pre-wrap leading-relaxed max-w-prose">
                    {update.content}
                  </p>

                  {/* 픽셀 구분선 (마지막 제외) */}
                  {i < updates.length - 1 && (
                    <div className="mt-10 flex gap-1.5">
                      {[...Array(12)].map((_, j) => (
                        <div key={j} className="h-1 w-1 bg-ink/15" />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── 푸터 (midnight) ──────────────────────────────────────────── */}
      <footer className="bg-midnight px-5 py-8">
        <div className="mx-auto max-w-[720px]">
          <div className="flex items-center gap-4">
            <PixelCross />
            <div>
              <p className="text-body-sm text-ci-gray">동행. · 우리들교회 단기선교 플랫폼</p>
              <p className="mt-0.5 text-caption text-ci-gray/50">
                이 페이지는 팀원들이 본진에 전하는 공식 소식입니다.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
