export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[1080px] px-5 py-12 md:px-8 md:py-20">
        <header className="mb-12">
          <p className="tracking-overline text-overline uppercase text-ink-soft">
            우리들교회 · 2026 여름
          </p>
          <h1 className="font-display mt-2 text-display-md">
            동행<span className="text-coral">.</span>
          </h1>
          <p className="mt-3 max-w-prose text-body-lg text-ink-soft">
            교회 단기선교 / 아웃리치 팀이 기획부터 회고까지
            <br />한 곳에서 함께 걷는 플랫폼.
          </p>
          <hr className="mt-8 border-ink/15" />
        </header>

        {/*
         * 토큰 시각 검증 영역. 실제 랜딩은 다음 작업에서 DESIGN.md 부록 B
         * (midnight 헤더 + 픽셀 십자가 + paper 본문)대로 만든다.
         */}
        <section aria-label="디자인 토큰 미리보기" className="space-y-10">
          <div>
            <p className="tracking-overline text-overline uppercase text-ink-soft">
              컬러
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
              {[
                ["paper", "bg-paper"],
                ["paper-deep", "bg-paper-deep"],
                ["ink", "bg-ink"],
                ["ink-soft", "bg-ink-soft"],
                ["midnight", "bg-midnight"],
                ["coral", "bg-coral"],
                ["ocean", "bg-ocean"],
                ["mustard", "bg-mustard"],
                ["sage", "bg-sage"],
                ["rust", "bg-rust"],
                ["ci-gray", "bg-ci-gray"],
              ].map(([label, cls]) => (
                <li
                  key={label}
                  className="flex flex-col gap-2 rounded-md border border-ink/15 p-3"
                >
                  <span className={`block h-12 rounded-sm ${cls}`} />
                  <span className="text-caption text-ink-soft">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="tracking-overline text-overline uppercase text-ink-soft">
              타이포
            </p>
            <div className="mt-3 space-y-3">
              <p className="font-display text-display-md">
                함께 걷는 여름<span className="text-coral">.</span>
              </p>
              <p className="text-h2">섹션 헤딩 (h2)</p>
              <p className="text-body-lg text-ink-soft">
                본문 강조. 종이 위의 진심을 담아 단기선교 팀의 모든 흐름을
                기록합니다.
              </p>
              <p className="text-body">
                기본 본문. 단톡방·엑셀·드라이브에 흩어졌던 정보를 한 곳에 모은
                인하우스 도구.
              </p>
              <p className="text-body-sm text-ink-soft">보조 본문 (body-sm)</p>
              <p className="text-caption text-ink-mute">
                캡션 / 라벨 (caption)
              </p>
            </div>
          </div>

          <div>
            <p className="tracking-overline text-overline uppercase text-ink-soft">
              상태
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-caption">
              <span className="inline-flex items-center rounded-sm border border-ink px-2 py-0.5 font-semibold uppercase tracking-wide">
                기본
              </span>
              <span className="inline-flex items-center rounded-sm border border-mustard px-2 py-0.5 font-semibold uppercase tracking-wide text-mustard">
                진행중
              </span>
              <span className="inline-flex items-center rounded-sm border border-sage px-2 py-0.5 font-semibold uppercase tracking-wide text-sage">
                완료
              </span>
              <span className="inline-flex items-center rounded-sm border border-rust px-2 py-0.5 font-semibold uppercase tracking-wide text-rust">
                위험
              </span>
            </div>
          </div>
        </section>

        <footer className="mt-section border-t border-ink/15 pt-6 text-caption text-ink-mute">
          Phase 0 · 디자인 토큰 검증 화면. 실제 랜딩은 다음 작업에서 작업.
        </footer>
      </div>
    </main>
  );
}
