import { Avatar, Button, Card, Input, Tag } from "@/components/ui";

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

        {/* 토큰 시각 검증. 실제 랜딩은 다음 작업에서 부록 B대로 구현. */}
        <div className="space-y-section">
          <Section title="컬러">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
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
          </Section>

          <Section title="타이포">
            <div className="space-y-3">
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
          </Section>

          <Section title="버튼 (Button)">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">저장</Button>
              <Button variant="secondary">취소</Button>
              <Button variant="accent">송금하기</Button>
              <Button variant="ghost">자세히</Button>
              <Button variant="primary" disabled>
                비활성
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm">sm</Button>
              <Button size="md">md (기본)</Button>
              <Button size="lg">lg</Button>
            </div>
          </Section>

          <Section title="카드 (Card)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-overline tracking-overline uppercase text-ink-soft">
                  outlined
                </p>
                <p className="font-display mt-1 text-h2">우도교회팀</p>
                <p className="mt-2 text-body-sm text-ink-soft">
                  팀원 30명 · 일정 12개
                </p>
              </Card>
              <Card variant="surface">
                <p className="text-overline tracking-overline uppercase text-ink-soft">
                  surface
                </p>
                <p className="font-display mt-1 text-h2">예산 합계</p>
                <p className="mt-2 text-body-sm text-ink-soft">
                  배경 구역용 (paper-deep)
                </p>
              </Card>
              <Card variant="accent">
                <p className="text-overline tracking-overline uppercase">
                  accent
                </p>
                <p className="font-display mt-1 text-h2">히어로 카드</p>
                <p className="mt-2 text-body-sm opacity-90">
                  중요 강조용 (coral 배경)
                </p>
              </Card>
            </div>
          </Section>

          <Section title="인풋 (Input)">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="이름"
                placeholder="홍길동"
                hint="실명을 입력해주세요."
              />
              <Input
                label="이메일"
                type="email"
                placeholder="you@example.com"
                errorText="올바른 이메일 형식이 아니에요."
              />
              <Input
                variant="boxed"
                label="검색"
                placeholder="이름 / 이메일로 검색"
              />
              <Input label="계좌번호" placeholder="00-000000-00-000" />
            </div>
          </Section>

          <Section title="태그 (Tag)">
            <div className="flex flex-wrap gap-3">
              <Tag>기본</Tag>
              <Tag tone="in_progress">진행중</Tag>
              <Tag tone="done">완료</Tag>
              <Tag tone="danger">위험</Tag>
              <Tag tone="info">정보</Tag>
            </div>
          </Section>

          <Section title="아바타 (Avatar)">
            <div className="flex items-end gap-4">
              <Avatar name="이도연" size="sm" />
              <Avatar name="이도연" />
              <Avatar name="이도연" size="lg" />
              <Avatar name="John Doe" size="lg" />
              <Avatar name="" size="lg" />
            </div>
          </Section>
        </div>

        <footer className="mt-section border-t border-ink/15 pt-6 text-caption text-ink-mute">
          Phase 0 · 디자인 토큰 + 프리미티브 검증 화면. 실제 랜딩은 다음
          작업에서.
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="tracking-overline text-overline uppercase text-ink-soft">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
