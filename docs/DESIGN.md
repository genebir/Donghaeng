# DESIGN.md — 디자인 시스템

> **🎨 모든 UI 작업 전 이 문서를 먼저 읽는다.**
> 새 컴포넌트가 필요하면 이 문서에 먼저 추가하고, 그 다음 코드에 반영한다.

---

## 디자인 철학

### 한 줄 요약
> **종이 위의 진심.** 리소그래프(Risograph) 인쇄소처럼 한정된 색과 따뜻한 질감으로, 신실하고 정직한 무드를 만든다. 우리들교회의 픽셀-십자가 CI를 시그니처로 품는다.

### 영감
- **Dopple Press** (dopplepress.com) — 영국 브라이튼의 리소그래프 인쇄소.
- 핵심 차용 요소:
  - 한정된 색 팔레트 (2~3색 + 종이 배경)
  - 미세한 종이 그레인 텍스처
  - 절제된 에디토리얼 레이아웃
  - 손으로 만진 듯한, 그러나 정확한 타이포
  - 솔리드 컬러 블록을 강조 요소로
- **우리들교회 CI** — 픽셀 한글 + 빨간 십자가 + 블랙 배경.
  - 픽셀/블록의 모듈성을 장식 모티프로 차용.
  - CI 빨강을 시스템 메인 액센트로.

### 두 레이어 (Two-Layer Approach)
- **레이어 1: 작업 화면 (paper)** — 평소 쓰는 모든 화면. 따뜻한 종이 배경, 코럴 액센트 절제.
  - 일정, 준비물, 미디어 허브, 지출 등록, 정산 등 일상 업무.
- **레이어 2: 브랜드 모멘트 (midnight)** — CI 정체성을 강하게 드러내는 순간.
  - 랜딩 페이지 히어로, 본진 공유 페이지 헤더/푸터, 로그인, 결산 PDF 표지, 이메일 헤더.
  - midnight 배경 + 픽셀 모티프 + CI 빨강 십자가 또는 액센트.

이 두 레이어가 **같은 무드를 공유**한다. 단, 레이어 2는 더 직접적으로 "우리들교회의 도구"임을 드러낸다.

### 우리 맥락에서의 변형
- 너무 장난스럽거나 힙스터스럽지 않게.
- 교회 / 공동체 / 진심을 담는 공간임을 잊지 않는다.
- 그렇다고 클리셰(스테인드글라스, 비둘기 일러)는 쓰지 않는다. 우리들교회의 픽셀-십자가가 우리 정체성.
- 정직함은 **장식의 부재**에서 나온다. 글래스모피즘, 과한 그라디언트, 네온 그림자 금지.

### 무드 키워드
정직한 / 단단한 / 손맛 / 따뜻한 / 절제된 / 진솔한 / 종이의 / **픽셀의**

---

## 1. 컬러 토큰

### 기본 팔레트

종이 배경 + 잉크 + **CI 빨강 (십자가)** + 보조색.

| 토큰 | HEX | 설명 |
|---|---|---|
| `--paper` | `#F4EFE6` | 메인 배경. 따뜻한 미색 종이. |
| `--paper-deep` | `#EAE3D4` | 카드/구역 구분용 살짝 진한 종이. |
| `--ink` | `#1B1B1B` | 본문 텍스트. 순흑 대신 부드러운 잉크 검정. |
| `--ink-soft` | `#3D3A35` | 보조 텍스트, 라벨. |
| `--ink-mute` | `#7A7468` | placeholder, 비활성. |
| `--midnight` | `#0A0A0A` | **CI 블랙. 브랜드 모멘트(랜딩/공유 페이지 헤더/푸터)에서 풀폭 배경으로.** |
| `--coral` | `#DC241F` | **메인 액센트 = 우리들교회 CI 십자가 빨강.** CTA, 강조, 액티브 상태. |
| `--coral-deep` | `#A81812` | hover 등 |
| `--ocean` | `#2D4A8A` | 보조 액센트. 리소 블루. 링크, 정보성 강조. |
| `--ocean-deep` | `#1F3666` | hover |
| `--mustard` | `#D9A441` | 노란 강조. 알림, 진행중 상태. |
| `--sage` | `#7A9579` | 성공, 완료. |
| `--rust` | `#A04B2B` | 경고, 위험. (코럴과 구분) |
| `--ci-gray` | `#9A9A9A` | **CI 픽셀 타입 회색.** midnight 위에서만 사용. |

### 사용 규칙

- **한 화면에 액센트 색은 코럴 1개를 메인으로**, 오션은 정보성 영역만.
- 머스타드/세이지는 상태 표시(완료/진행중) 외엔 자제.
- 절대로 그라디언트 사용 금지. **솔리드 컬러만.**
- 텍스트 위에 컬러 블록을 깔 땐 `--paper` / `--ink` / `--midnight` 위에서.
- **midnight + coral 조합은 CI 정체성**. 일반 UI에서 남용하지 말고 브랜드 모멘트에만.

### 의미별 매핑

| 의미 | 토큰 |
|---|---|
| 페이지 배경 (작업 화면) | `--paper` |
| 페이지 배경 (브랜드 모멘트) | `--midnight` |
| 카드 배경 | `--paper-deep` 또는 `--paper` + 1px border |
| 본문 (light) | `--ink` |
| 본문 (dark) | `--paper` |
| 라벨 / 캡션 | `--ink-soft` (light) / `--ci-gray` (dark) |
| 1차 CTA (light bg) | bg `--ink`, text `--paper` |
| 1차 CTA (dark bg) | bg `--coral`, text `--paper` |
| 2차 CTA | bg `--coral`, text `--paper` |
| 링크 | `--ocean`, underline always-on |
| 진행중 | `--mustard` |
| 완료 / 성공 | `--sage` |
| 위험 / 경고 | `--rust` |
| 그레인 오버레이 | `rgba(27, 27, 27, 0.06)` (light) / `rgba(255, 255, 255, 0.04)` (dark) |

### Tailwind 매핑 (`tailwind.config.ts`)

```ts
extend: {
  colors: {
    paper: {
      DEFAULT: 'var(--paper)',
      deep: 'var(--paper-deep)',
    },
    ink: {
      DEFAULT: 'var(--ink)',
      soft: 'var(--ink-soft)',
      mute: 'var(--ink-mute)',
    },
    midnight: 'var(--midnight)',
    coral: {
      DEFAULT: 'var(--coral)',
      deep: 'var(--coral-deep)',
    },
    ocean: {
      DEFAULT: 'var(--ocean)',
      deep: 'var(--ocean-deep)',
    },
    mustard: 'var(--mustard)',
    sage: 'var(--sage)',
    rust: 'var(--rust)',
    'ci-gray': 'var(--ci-gray)',
  },
}
```

---

## 2. 타이포그래피

### 폰트

| 역할 | 폰트 | 비고 |
|---|---|---|
| Display (한국어) | **Gowun Batang** | 고운 바탕, 따뜻한 명조. 무료. |
| Body (한국어) | **Pretendard Variable** | 가독성 + 모던. 무료. |
| Display (영문) | **Fraunces** | 살짝 디스플레이 세리프. 무료. |
| Body (영문) | **Inter Variable** | 무료. |
| Mono (필요 시) | **JetBrains Mono** | |

> 자가 호스팅. `frontend/public/fonts/`에 두고 `next/font/local`로 로드.

### 스케일 (rem 기준, root = 16px)

| 토큰 | size / line-height | weight | 용도 |
|---|---|---|---|
| `display-xl` | 4.5rem / 1.05 | 600 | 랜딩 히어로 |
| `display-lg` | 3.25rem / 1.1 | 600 | 섹션 헤로 |
| `display-md` | 2.25rem / 1.15 | 600 | 페이지 타이틀 |
| `h1` | 1.875rem / 1.25 | 600 | |
| `h2` | 1.5rem / 1.3 | 600 | |
| `h3` | 1.25rem / 1.35 | 600 | |
| `body-lg` | 1.125rem / 1.7 | 400 | 본문 강조 |
| `body` | 1rem / 1.7 | 400 | 기본 본문 |
| `body-sm` | 0.875rem / 1.6 | 400 | 보조 |
| `caption` | 0.75rem / 1.5 | 500 | 라벨, 메타 |
| `overline` | 0.6875rem / 1.4 | 600 | UPPERCASE, 라벨 위 |

### 규칙

- 디스플레이/제목엔 **Gowun Batang (한국어) + Fraunces (영문)** — 디스플레이 세리프 페어링.
- 본문엔 **Pretendard + Inter** 페어링.
- 한 화면에서 폰트 패밀리는 최대 2종.
- **한국어 본문은 letter-spacing -0.01em** (Pretendard 권장).
- **영문 caps의 Overline은 letter-spacing 0.12em** (강조).
- 본문 측정 너비는 65~75자 (max-w-prose 활용).
- 줄바꿈은 의미 단위로 — `<br>` 남용 금지, `text-balance` / `text-pretty` 활용.

### CSS 토큰 (globals.css)

```css
:root {
  --font-display: 'Fraunces', 'Gowun Batang', serif;
  --font-body: 'Inter', 'Pretendard Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
html { font-family: var(--font-body); color: var(--ink); background: var(--paper); }
.font-display { font-family: var(--font-display); font-feature-settings: 'ss01', 'ss02'; }
```

---

## 3. 공간 / 레이아웃

### 스페이싱 스케일

Tailwind 기본 (4px 단위) 사용. 단, 화면 단위 큰 여백은 다음 토큰을 표준화:

| 토큰 | px | 용도 |
|---|---|---|
| `space-section-sm` | 48 | 모바일 섹션 간 |
| `space-section` | 80 | 데스크탑 섹션 간 |
| `space-section-lg` | 128 | 랜딩 같은 큰 섹션 |

### 컨테이너

| 폭 | px | 용도 |
|---|---|---|
| `container-sm` | 720 | 본문 중심 페이지 |
| `container` | 1080 | 일반 앱 페이지 |
| `container-lg` | 1280 | 미디어 그리드 |
| `container-xl` | 1440 | 풀폭 대시보드 |

좌우 패딩: 모바일 20px / 태블릿 32px / 데스크탑 48px.

### 그리드

- 12 컬럼 그리드, 24px gutter (데스크탑).
- 미디어 그리드는 폭에 따라 2/3/4/5 컬럼 자동.
- 에디토리얼 레이아웃 환영: 대시보드도 똑같이 격자만 쓰지 말고 비대칭 OK.

### 보더 / 라운딩

- `border-width: 1px`, color `var(--ink)` (불투명도 100%) 또는 `var(--ink-soft)`.
- **그림자 사용 자제**. 인쇄물처럼 보더로 구획. 필요한 경우만:
  - `shadow-paper`: `0 1px 0 0 rgba(27,27,27,0.08)` (탭/탭바 하단선 정도)
- **라운딩 보수적**: 기본 `rounded-md = 6px`. 카드 8px. 둥근 버튼 / pill은 특수 용도로만.
- **버튼 형태는 사각에 가까운 모서리**. 캐주얼 앱 같은 큰 라운딩 ❌.

---

## 4. 텍스처 / 디테일

### 그레인 (필수 요소)

배경 전체에 미세한 노이즈 PNG를 깔아 종이 질감을 만든다.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/grain.png');
  opacity: 0.4;
  mix-blend-mode: multiply;
  pointer-events: none;
  z-index: 100;
}
```

`public/grain.png`은 256x256 noise tile. 회색 노이즈, 70% 투명. SVG로도 OK:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <filter id="n"><feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>
  <rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/>
</svg>
```

### 리소 미스레지스트레이션 (제한적 사용)

리소 인쇄의 색판 어긋남(misregistration) 효과 — 헤더/히어로 등 강조 요소에만 사용.

- 큰 글자에 코럴 글자가 1~2px 어긋난 듯한 느낌:
  ```css
  .display-stamp {
    color: var(--ink);
    text-shadow: 2px 2px 0 var(--coral);
  }
  ```
- 남발 금지. 화면당 최대 1곳.

### 라인 디바이더

페이지 구역 나눌 때 그림자 대신 1px 잉크 라인.
```html
<hr class="border-ink/20" />
```

### 이미지 프레임

사진은 1px 잉크 보더로 감싼다. "사진을 종이에 인쇄해 붙인" 느낌.

---

## 4-B. 브랜드 통합 (CI Integration) ⭐

### 우리들교회 CI

CI는 **픽셀 한글 "우리들" + 중앙의 빨간 십자가 + 블랙 배경**.
- 십자가는 픽셀 한글 사이에 자연스럽게 박혀있음.
- 모든 요소가 8픽셀 그리드 위에 정렬된 모듈러 디자인.
- 강한 대비 (블랙 / 빨강 / 회색).

### 로고 사용 규칙

1. **CI는 절대 재제작하지 않는다.** 공식 PNG / SVG 자산만 사용.
   - 자산 보관: `frontend/public/brand/`
   - 파일: `woori-ci-on-dark.svg`, `woori-ci-on-light.svg`
2. **최소 크기**: 모바일 헤더 24px, 데스크탑 32px (높이 기준).
3. **여백**: 로고 높이의 50% 이상 여백 확보.
4. **변형 금지**: 색 변경 X, 회전 X, 비율 왜곡 X, 효과 추가 X.
5. **컬러 환경별**:
   - midnight 배경 → `woori-ci-on-dark.svg` (원본 그대로)
   - paper 배경 → `woori-ci-on-light.svg` (회색→ink로 매핑된 버전)
   - 빨간 십자가는 두 환경 모두 그대로.

### 동행 로고 (워드마크)

"동행"은 별도의 워드마크가 필요. CI와 충돌하지 않게 단순하게.

- 폰트: **Gowun Batang Bold**, letter-spacing -0.02em
- 글자 색: 환경에 따라 `--ink` 또는 `--paper`
- 점(.) 또는 모음에 `--coral` 미세 액센트 옵션 (CI 빨강과 호응)

```
동행.       ← 마침표만 코럴 (signature)
```

### 락업 패턴 (Co-Branding)

동행은 우리들교회의 도구다. 락업은 **세로 구분선**으로:

```
[우리들교회 CI]  │  동행.
                 │  단기선교 플랫폼
```

- 좌측: 우리들교회 CI (높이 32~40px)
- 구분선: 1px `--ink/30` 또는 `--ci-gray`, 높이 CI보다 1.5배
- 우측: 동행 워드마크 + 한 줄 캐치프레이즈 (caption)

**사용처**: 헤더, 로그인 페이지, 본진 공유 페이지 푸터, 결산 PDF 표지, 이메일 헤더.

**금지**: 두 로고를 합치거나 겹치거나 새 합성 로고 만들기 금지.

---

### 픽셀 모티프 (Pixel Motif) ⭐ 시그니처

CI의 픽셀 미학은 우리만의 시그니처 그래픽 언어로 확장한다.

#### 기본 단위
- **8px 그리드**가 모든 픽셀 모티프의 기본 단위.
- 큰 환경(랜딩 히어로 등): 16px 또는 24px도 OK.

#### 사용처 (절제된 사용)
1. **랜딩 / 본진 페이지 히어로 배경 장식** — 코너에 픽셀 패턴.
2. **섹션 디바이더** — 1px 라인 대신 픽셀 점선:
   ```
   ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
   ```
3. **로딩 스켈레톤 / 프로그레스** — 픽셀 블록이 채워지는 형태.
4. **빈 상태 일러스트** — 픽셀 아트 스타일.
5. **결산 PDF 표지 / 이메일 헤더 장식.**

#### 금지 사항
- 본문 안의 텍스트 강조 ❌ (가독성 해침)
- 데이터 차트 ❌ (정보 왜곡)
- 인터랙티브 요소(버튼, 인풋) ❌ (CI를 캐주얼하게 만듦)

#### 픽셀 모티프 컬러
- midnight 배경 → `--ci-gray` 픽셀 + 코럴 십자가 액센트 1개
- paper 배경 → `--ink-soft` 픽셀 + 코럴 십자가 액센트 1개
- 한 화면에 코럴 픽셀 십자가는 **최대 1개**. 강조점이 흐려지면 안 됨.

#### 구현 (SVG)

랜딩 히어로용 픽셀 패턴 예시 (`components/brand/PixelGrid.tsx`):

```tsx
// 8x8 그리드, 랜덤 sparse pattern
// CI에서 영감받은 파편화된 픽셀
<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <g fill="var(--ci-gray)" opacity="0.4">
    <rect x="0"   y="32"  width="8" height="8"/>
    <rect x="16"  y="32"  width="8" height="8"/>
    <rect x="0"   y="48"  width="8" height="8"/>
    {/* ... CI의 "우리들" 분위기를 환기시키는 sparse 픽셀 ... */}
  </g>
  {/* 코럴 십자가 단 1개 */}
  <g fill="var(--coral)">
    <rect x="120" y="112" width="8" height="32"/>
    <rect x="104" y="120" width="40" height="8"/>
  </g>
</svg>
```

> 작업자는 단순 sparse 패턴을 만들고, **반드시 코럴 십자가 1개를 어딘가에 배치**.
> CI의 핵심은 "픽셀 사이에 박힌 십자가"이므로 이 관계를 유지.

---

## 5. 컴포넌트

### Button

3가지 variant.

| variant | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| `primary` | `--ink` | `--paper` | none |
| `secondary` | `--paper` | `--ink` | 1px `--ink` |
| `accent` | `--coral` | `--paper` | none |
| `ghost` | transparent | `--ink` | none, hover시 `--paper-deep` |

크기: `sm` (h 32) / `md` (h 40) / `lg` (h 48).

상태:
- hover: 색 +5% 어둡게 또는 보더 강조.
- active: 1px translate-y로 살짝 눌림 (인쇄 스탬프 느낌).
- disabled: opacity 50%, cursor not-allowed.
- focus-visible: `outline: 2px solid var(--coral); outline-offset: 2px;`.

```tsx
// components/ui/Button.tsx 예시
<button className="
  inline-flex items-center justify-center gap-2
  h-10 px-5
  bg-ink text-paper
  border border-ink
  rounded-md
  font-medium tracking-tight
  transition-transform
  hover:bg-ink/90
  active:translate-y-px
  focus-visible:outline-2 focus-visible:outline-coral focus-visible:outline-offset-2
  disabled:opacity-50 disabled:pointer-events-none
">
  ...
</button>
```

### Card

기본 카드는 종이 위에 살짝 도드라진 종이 한 장.

```html
<div class="
  bg-paper border border-ink/15 rounded-md
  p-6
  transition
  hover:border-ink/40
">
  ...
</div>
```

variant:
- `surface`: `bg-paper-deep border-transparent` (배경 구역)
- `outlined`: 위 기본
- `accent`: `bg-coral text-paper` (히어로 카드)

### Input / Textarea

```html
<label class="block">
  <span class="text-caption font-semibold tracking-wide uppercase text-ink-soft">이름</span>
  <input class="
    mt-2 block w-full
    bg-paper border-b-2 border-ink/30
    px-0 py-2
    text-body
    focus:border-ink focus:outline-none
    placeholder:text-ink-mute
  " />
</label>
```

- **밑줄 입력 스타일**이 기본 (편지지 같은 느낌). 꽉 찬 박스보다 가벼움.
- 박스 input이 필요한 곳(검색바 등)은 `border-ink/30 rounded-md px-3`.

### Tag / Chip

```html
<span class="
  inline-flex items-center gap-1
  px-2 py-0.5
  border border-ink rounded-sm
  text-caption font-semibold tracking-wide uppercase
">
  미디어
</span>
```

상태별 컬러:
- 진행중: `border-mustard text-mustard`
- 완료: `border-sage text-sage`
- 위험: `border-rust text-rust`

### Avatar

원형 + 1px 잉크 보더. 이니셜은 디스플레이 폰트.

### Toast / Notification

- 화면 우상단.
- `bg-ink text-paper` 솔리드, 1px 코럴 좌측 보더.
- 4초 자동 dismiss.

### Modal / Dialog

- 배경 오버레이: `bg-ink/40` (그레인 살짝 보임).
- 다이얼로그: `bg-paper border border-ink rounded-md`.
- 헤더에 굵은 디스플레이 타이틀 + 라인 디바이더.

### Empty State

```
┌──────────────────────────┐
│                          │
│        [심플 일러]         │
│                          │
│   아직 사진이 없어요.       │
│   첫 컷을 올려볼까요?       │
│                          │
│   [ 사진 올리기 ]          │
│                          │
└──────────────────────────┘
```
- 일러스트는 단색 라인 드로잉 (코럴 또는 잉크). 외부 라이브러리 X, 자체 SVG 제작.

### 회계 전용 패턴

**영수증 카드 (Receipt Card)**
- 좌측: 영수증 사진 썸네일 (1:1, 1px 잉크 보더)
- 우측: 금액 (display-md, 굵게) + 가게명 + 일시 + 카테고리 칩 + 상태 칩
- 상태별 좌측 보더 색: pending=회색 / approved=세이지 / rejected=러스트 / reimbursed=오션
- 금액은 항상 우정렬, tabular-nums (숫자 너비 고정).

**정산 묶음 카드 (Reimbursement Card)**
- 사람 이름 (display-md) + 계좌정보 (caption, 모노 폰트)
- 카테고리별 합계 표 (라인만, 보더 없음)
- 큰 합계 금액 (display-lg, 코럴)
- 우측 하단에 두 버튼: "송금정보 복사" (secondary) + "송금완료" (primary)
- "송금정보 복사" 클릭 시 토스트로 "복사됐어요. 뱅킹앱에 붙여넣기 하세요" 안내

**예산 막대그래프**
- 가로 막대. 배경은 `--ink/8`로 깔고, 실집행은 솔리드 컬러로 채움.
- 100% 초과 시 끝부분에 러스트 컬러로 오버플로우 표시.
- 숫자는 우측 정렬 tabular-nums.

---

## 6. 페이지 레이아웃 패턴

### App Shell

```
┌────────────────────────────────────────┐
│ [CI]│동행          나   설정    🔔    │  ← 헤더 (h-16, paper bg, border-b)
├────────────────────────────────────────┤
│                                        │
│  본문 (paper, grain)                    │
│                                        │
└────────────────────────────────────────┘
```

- 작업 화면 헤더는 **paper 배경 + 작은 CI 락업** (높이 24px).
  - 우리들교회 CI는 작지만 항상 좌측에 존재 — 정체성 유지.
- 데스크탑: 좌측 사이드바 (260px) + 콘텐츠.
- 모바일: 하단 탭바 (5개 탭: 홈/일정/체크/미디어/간증). 헤더는 CI + 동행만.

**브랜드 페이지 (랜딩 / 로그인 / 공유)** 는 다른 셸:
- 헤더가 **midnight 배경 + 큰 CI 락업** (높이 32~40px).
- 부록 B 참조.

### 페이지 헤더 패턴

```
[OVERLINE: 우리들교회 / 2026 여름]
대시보드               <- display-md
한 줄 설명문구이 자리에.       <- body-lg, ink-soft
─────────────────────────       <- 라인 디바이더
[탭]  [탭]  [탭]
```

### 본진 공유 페이지 (퍼블릭)

에디토리얼 잡지 느낌이 가장 강한 곳.
- 큰 디스플레이 타이틀 + 살짝 미스레지스트레이션 효과.
- 사진은 grid + 1장은 풀폭, 다음 2장은 2컬럼 식 비대칭.
- 본문은 max-w-prose (65ch).
- 페이지 푸터에 "이 페이지를 위해 기도해주세요" 같은 짧은 문구.

---

## 7. 모션

### 원칙
- **빠르고 절제된 모션.** 200ms 이하가 표준.
- 패럴랙스, 페이지 전환 페이드, 스플래시 ❌.
- 인터랙션 피드백은 transform 위주 (active 시 1px translate).

### 표준 트랜지션
```css
--tx-fast: 120ms cubic-bezier(0.2, 0, 0, 1);
--tx-base: 200ms cubic-bezier(0.2, 0, 0, 1);
--tx-slow: 320ms cubic-bezier(0.2, 0, 0, 1);
```

### 미디어 그리드 입장
- 새 사진 입장 시 stagger 30ms, opacity 0→1 + scale 0.98→1, 200ms.

### Reduced motion
`@media (prefers-reduced-motion: reduce)`에서 모든 transform 모션 제거.

---

## 8. 아이콘 / 일러스트

### 아이콘
- **Lucide** 사용. stroke-width 1.5.
- 색은 `currentColor`. 절대 다색 아이콘 X.

### 일러스트
- 자체 SVG, 라인 드로잉 위주.
- 코럴 또는 잉크 단색.
- 손그림 느낌 살짝 — perfect 직선보다 약간 구부러진 path.
- 빈 상태 / 온보딩에만 사용.

---

## 9. 데이터 시각화

차트가 필요한 화면(예산, 진행률):
- 막대그래프 / 도넛 / 라인만 사용. 화려한 차트 X.
- 색상은 `--ink`, `--coral`, `--ocean`, `--mustard`, `--sage` 순으로 할당.
- 격자선은 `--ink/10`.
- 레이블은 caption 토큰.

---

## 10. 톤앤보이스 (마이크로카피)

- **간결하고 정직하게.**
- 격식체보다 정중한 평어/존댓말 ("저장됐어요", "다시 올려주세요").
- 종교적 클리셰("주님과 함께!", "할렐루야!") 본문 금지. 사용자가 직접 쓰는 간증 영역에는 자유.
- 빈 상태/실패 메시지에 따뜻함 한 스푼:
  - ❌ "오류 발생"
  - ✅ "잠깐 문제가 있었어요. 다시 시도해주세요."
- 삭제 같은 위험 액션은 분명하게: "정말 삭제할까요? 되돌릴 수 없어요."

### 라벨 작명 예시
- 메뉴: 홈 / 일정 / 준비물 / 미디어 / 간증 / 본진 공유 / 결산
- 상태: 준비중 / 진행중 / 완료 / 보관됨
- 빈 상태: "아직 비어있어요. 첫 항목을 추가해볼까요?"

---

## 11. 접근성

- 모든 인터랙티브 요소 `focus-visible` 스타일 (코럴 outline).
- 이미지 `alt` 필수. 장식용은 `alt=""`.
- 컬러만으로 의미 전달 금지 (상태 칩에 텍스트 라벨 동반).
- 명도 대비: 본문 4.5:1 이상, 큰 텍스트 3:1 이상. (위 토큰들은 `--ink`/`--paper` 기준 통과)
- 한국어 / 영어 모두 lang 속성 명시.
- 모달 등은 키보드 트랩 + ESC dismiss.

---

## 12. 다크 모드

**Phase 4 이후**. 기본은 라이트만 지원. 디자인의 종이 질감이 라이트의 핵심이라, 다크는 같은 무드를 못 살릴 가능성 높음. 도입 시:
- `--paper`를 `--ink-soft` 톤의 잉크 검정 종이로 치환.
- 그레인 강도 약하게.
- 코럴은 그대로 유지 가능.

---

## 13. 컴포넌트 작업 워크플로우

새 화면을 만들 때 Claude Code는:

1. **이 문서의 토큰 / 컴포넌트만으로 구현 가능한지 먼저 확인.**
2. 가능하면 `components/ui/`의 프리미티브를 조립.
3. 새 패턴이 필요하면:
   - 이 문서의 `5. 컴포넌트` 섹션에 정의 추가.
   - `components/ui/`에 신규 컴포넌트 생성.
   - 토큰만 사용. 인라인 hex / 임의 px 금지.
4. 새 색이 필요하다고 느껴지면 거의 99% 잘못된 판단. 기존 토큰 다시 살펴볼 것.

---

## 14. 레퍼런스 무드보드

(작업자가 늘 가까이 둘 것)

- **우리들교회 CI** — `frontend/public/brand/` 안의 공식 자산. 모든 브랜드 모멘트의 출발점.
- Dopple Press — dopplepress.com
- Risograph 출판물: Colpa Press, Bolt Generation
- 명조 + 모던 그리드: Apartamento Magazine, MagCulture
- 한국 사례: 워크룸 프레스, 6699 Press
- 픽셀 미학: Susan Kare 초기 매킨토시 아이콘, 모눈종이 위 십자수 도안
- 색감: 1970~80년대 교회 주보, 미션 매거진 표지

---

## 부록 A — 빠른 참조 (Tailwind 클래스)

```tsx
// 페이지 컨테이너
<main className="bg-paper text-ink min-h-screen">
  <div className="container mx-auto px-5 md:px-8 py-12 md:py-20 max-w-[1080px]">
    ...
  </div>
</main>

// 페이지 헤더
<header className="mb-10">
  <p className="text-overline uppercase tracking-[0.12em] text-ink-soft">
    우리들교회 · 2026 여름
  </p>
  <h1 className="font-display text-display-md mt-2">대시보드</h1>
  <p className="mt-3 text-body-lg text-ink-soft max-w-prose">...</p>
  <hr className="mt-8 border-ink/15" />
</header>

// 카드
<article className="bg-paper border border-ink/15 rounded-md p-6 hover:border-ink/40 transition-colors">
  ...
</article>

// 1차 버튼
<button className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-ink text-paper rounded-md font-medium hover:bg-ink/90 active:translate-y-px transition">
  저장
</button>
```

---

## 부록 B — 첫 화면 시각 가이드

랜딩 페이지를 처음 만들 때 따를 모범. **레이어 2 (midnight + CI)** 의 대표 예시.

```
┌───────────────────────────────────────────────────────┐
│  [우리들교회 CI]  │  동행.    [로그인]                  │  ← 헤더 (midnight 배경)
├───────────────────────────────────────────────────────┤
│                                                       │
│  ··· ■ ··· ■ ■                          ■ ··          │  ← 픽셀 sparse 배경
│  ■ ··· ■ ··· ■    [overline] 우리들교회 단기선교        │
│                                                       │  
│                   함께 걷는 여름.       <- display-xl
│                   올해도 한 페이지에서.  <- 코럴 한 단어 강조
│                                ┃                      │  
│                              ──╋──   ← 픽셀 코럴 십자가 1개
│                                ┃                      │
│                                                       │
│                   [ 시작하기 ]   [ 본진 페이지 →]       │
│                                                       │
│  ····································· ■ ■ ■          │  ← 픽셀 디바이더
│                                                       │
└───────────────────────────────────────────────────────┘
            ↓ 스크롤하면 paper 배경으로 전환 (작업 화면 미리보기)

┌───────────────────────────────────────────────────────┐
│  [paper 배경, grain 텍스처]                            │
│                                                       │
│  [작은 사진 그리드 — 코럴 라인 보더]                    │
│  [기능 소개 — 카드 그리드, 절제된 타이포]                │
│                                                       │
└───────────────────────────────────────────────────────┘

푸터 (midnight 다시):
[우리들교회 CI]  │  동행
저작권 / 문의 / 본 사이트는 우리들교회 단기선교팀 운영
```

### 핵심 포인트
- **헤더와 푸터는 midnight + CI 락업**. 페이지가 우리들교회의 것임을 분명히.
- **본문은 paper**. 작업의 따뜻함을 유지.
- **히어로의 픽셀 십자가는 단 하나**. 시선의 정점.
- **스크롤할수록 paper로 전환**되는 흐름이 "정체성에서 일상으로" 이행을 표현.

이 패턴을 다음 화면에도 적용:
- 로그인 페이지 (전체 midnight, 좌측 CI 영역 + 우측 paper 폼 영역)
- 본진 공유 페이지 헤더 (`/share/[slug]`)
- 결산 PDF 표지

일반 작업 화면(`/dashboard`, `/teams/.../checklist` 등)은 **헤더만 paper + 작은 락업**, 본문은 모두 paper.
