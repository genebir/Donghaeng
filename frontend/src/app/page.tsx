import Link from "next/link";

import { PixelDivider, PixelHero, Wordmark } from "@/components/brand";
import { Card, buttonClasses } from "@/components/ui";

export default function Home() {
  return (
    <main>
      {/* ── 레이어 2: midnight 히어로 ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-midnight text-paper">
        {/* 픽셀 sparse 배경 — 우상단으로 빠지게 배치 */}
        <PixelHero
          className="absolute right-[-3rem] top-[-3rem] hidden h-[36rem] w-[36rem] md:block"
        />

        <div className="relative mx-auto flex max-w-[1280px] flex-col px-5 md:px-12">
          {/* 헤더 */}
          <header className="flex items-center justify-between py-6">
            <Wordmark size="md" />
            <Link
              href="/login"
              className="tracking-overline text-overline uppercase text-ci-gray underline-offset-8 hover:text-paper hover:underline"
            >
              로그인
            </Link>
          </header>

          {/* 히어로 — 작은 PixelHero를 모바일에서 본문 위에 인라인으로 보여줌 */}
          <PixelHero className="mt-4 h-48 w-48 md:hidden" />

          <div className="max-w-[36rem] py-section md:max-w-[44rem] md:py-section-lg">
            <p className="tracking-overline text-overline uppercase text-ci-gray">
              우리들교회 단기선교
            </p>
            <h1 className="font-display display-stamp mt-4 text-display-lg text-paper md:text-display-xl">
              함께 걷는 여름<span className="text-coral">.</span>
            </h1>
            <p className="mt-6 max-w-[28rem] text-body-lg text-ci-gray">
              매년 다시 시작하지 않게.
              <br />
              올해도 한 페이지에서 함께.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className={buttonClasses({ variant: "accent", size: "lg" })}
              >
                시작하기
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center gap-2 px-2 text-body-lg text-paper underline-offset-8 hover:text-coral hover:underline"
              >
                기능 살펴보기 <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* 픽셀 디바이더 */}
          <div className="text-ci-gray pb-section-sm md:pb-section">
            <PixelDivider />
          </div>
        </div>
      </section>

      {/* ── 레이어 1: paper 본문 (기능 미리보기) ─────────────────────────── */}
      <section
        id="features"
        className="bg-paper text-ink"
      >
        <div className="mx-auto max-w-[1080px] px-5 py-section md:px-12 md:py-section-lg">
          <header className="max-w-prose">
            <p className="tracking-overline text-overline uppercase text-ink-soft">
              한 곳에서 모든 흐름을
            </p>
            <h2 className="font-display mt-3 text-display-md">
              단톡방·드라이브에서 흩어지지 않게.
            </h2>
            <p className="mt-4 text-body-lg text-ink-soft">
              기획부터 회고까지, 우리 팀이 매년 처음부터 다시 만들지 않아도
              되는 자리.
            </p>
            <hr className="mt-8 border-ink/15" />
          </header>

          <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-6">
            <FeatureCard
              overline="기획"
              title="일정 · 준비물 · 멤버"
              body="비상연락망부터 VBS 큐시트까지. 우리 팀의 기본기가 한 화면에."
            />
            <FeatureCard
              overline="현장"
              title="미디어 허브"
              body="단톡방의 화질 깨짐 없이. 일자별로 모이는 사진을 회고와 결산까지 그대로."
            />
            <FeatureCard
              overline="현장"
              title="본진 공유"
              body="매일의 업데이트를 본진 성도가 공개 페이지로 받아봅니다. 카카오톡 한 줄로 충분."
            />
            <FeatureCard
              overline="회계"
              title="영수증 → 정산"
              body="모바일로 찍으면 등록, 회계는 한 번에 검토하고 인별로 묶어 송금. 복잡함 없이."
            />
          </div>
        </div>
      </section>

      {/* ── 레이어 2: midnight 푸터 ──────────────────────────────────────── */}
      <footer className="bg-midnight text-paper">
        <div className="mx-auto max-w-[1280px] px-5 py-section-sm md:px-12">
          <div className="text-ci-gray">
            <PixelDivider />
          </div>
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Wordmark size="sm" />
              <p className="mt-2 text-caption text-ci-gray">
                우리들교회 단기선교팀이 직접 만들고 운영합니다.
              </p>
            </div>
            <p className="text-caption text-ci-gray">
              © {new Date().getFullYear()} Donghaeng — 함께 걷는다.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  overline,
  title,
  body,
}: {
  overline: string;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-8">
      <p className="tracking-overline text-overline uppercase text-ink-soft">
        {overline}
      </p>
      <p className="font-display mt-2 text-h2">{title}</p>
      <p className="mt-3 max-w-prose text-body text-ink-soft">{body}</p>
    </Card>
  );
}
