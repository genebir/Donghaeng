# ROADMAP.md — 개발 로드맵

> 7월 출국까지 약 2개월. **출국 직전 1주는 완전 휴지기**라는 것을 전제로 마감 역산.
> 즉, 실질 개발 가능 기간은 **2026년 5월 1일 ~ 6월 마지막 주**.

---

## 마일스톤 요약

| Phase | 기간 | 핵심 산출물 | 출국 시 사용? |
|---|---|---|---|
| **Phase 0** — 기반 | 5/1 ~ 5/10 | 인프라, 인증, 기본 모델 | — |
| **Phase 1** — 기획 도구 + 지출 등록 | 5/11 ~ 5/24 | 팀/멤버(계좌)/일정/준비물 + **지출 등록 MVP** | ✅ 사전 준비 |
| **Phase 2** — 미디어 + 본진 + 정산 | 5/25 ~ 6/14 | 미디어 허브, 본진 공유, **회계 검토 / 정산 / 예산** | ✅ 현장 핵심 |
| **Phase 3** — 간증/QR/OCR | 6/15 ~ 6/28 | QR 간증 폼, **영수증 OCR**, 알림 | ✅ 현장 차별화 |
| **Phase 4** — 결산/회고 | 7월 출국 후 | 회계 보고서, 결산 책자, 다음 해 템플릿화 | 사후 |

---

## Phase 0 — 기반 (5/1 ~ 5/10, 약 10일)

### Goals
프로젝트 셋업, 인증, 멀티테넌시 골격.

### Deliverables

#### Backend
- [ ] FastAPI 프로젝트 초기화 (`uv init`, ruff/mypy 설정)
- [ ] PostgreSQL + Alembic 셋업, `.env.example`
- [ ] `domains/`, `core/`, `shared/` 폴더 골격
- [ ] 기본 미들웨어: CORS, 에러 핸들러, 요청 로깅
- [ ] Auth: 카카오/구글 OAuth → JWT 발급 (`POST /auth/oauth/exchange`)
- [ ] `current_user` / `current_org` 의존성
- [ ] User / Organization / OrgMembership 모델 + 마이그레이션
- [ ] Health check, `/api/v1/auth/me`

#### Frontend
- [ ] Next.js 15 프로젝트 초기화, Tailwind v4
- [ ] 폰트 자가 호스팅 (Pretendard, Gowun Batang, Inter, Fraunces)
- [ ] `globals.css`에 디자인 토큰 (DESIGN.md 기준)
- [ ] Grain 텍스처 오버레이
- [ ] `components/ui/` 프리미티브: Button, Card, Input, Tag, Avatar
- [ ] NextAuth + 카카오/구글
- [ ] 랜딩 페이지 (1화면, DESIGN.md 부록 B 기준)
- [ ] `/login` 페이지

#### Infra
- [ ] Vercel 프로젝트, Railway 백엔드, Neon DB
- [ ] R2 버킷 + 키
- [ ] GitHub Actions: lint/test/typecheck on PR

### 검증
- 카카오로 로그인하면 JWT 받아서 `/api/v1/auth/me`로 내 정보 받아온다.
- 토큰 / 폰트가 화면에 정확히 적용되어 있다 (`grain` 보임, `--coral`로 글자 강조됨).

---

## Phase 1 — 기획 도구 + 지출 등록 (5/11 ~ 5/24, 약 2주)

### Goals
출국 전 기획/준비에 필요한 핵심 도구. **이게 안 되면 단톡방으로 회귀.**
지출은 사전 준비(장비 구매 등) 단계부터 발생하므로 **Phase 1에 등록 기능까지 포함**.

### Deliverables

#### Backend
- [ ] Outreach / Team / Destination / TeamMember 모델 + 마이그레이션
  - team_member.role 은 `LEADER` / `MEMBER`만, part 별도
  - org_membership.church_position 필드
  - user.bank_* 필드 (암호화 저장)
- [ ] ScheduleItem / ChecklistItem 모델
- [ ] **Budget / Expense 모델** (reimbursement는 Phase 2)
- [ ] 권한 시스템 (`require_team_role`, `require_finance_or_leader`)
- [ ] API:
  - 조직 / 아웃리치 / 팀 CRUD
  - 멤버 초대 + 수락 + 역할 변경
  - 일정 CRUD (date range 쿼리 포함)
  - 준비물 CRUD + 카테고리 필터
  - 비상연락망 PDF 생성 (`weasyprint` 또는 `reportlab`)
  - **Budget upsert**
  - **Expense CRUD (등록 / 조회 / 본인 것 수정 / 삭제)**
- [ ] 시드 스크립트 (`seed.py`) — 더미 지출 20건 포함

#### Frontend
- [ ] App Shell (헤더 + 데스크탑 사이드바 + 모바일 탭바)
- [ ] `/dashboard` — 내가 속한 팀 카드 리스트
- [ ] `/teams/[teamId]` — 팀 홈 (개요 + 다음 일정 + 진행중 준비물 + **이번주 지출 합계**)
- [ ] `/teams/[teamId]/members` — 멤버 리스트 + 초대 + 응급정보 모달
- [ ] `/teams/[teamId]/schedule` — 일자별 일정 (캘린더 뷰 + 데일리 뷰)
- [ ] `/teams/[teamId]/checklist` — 카테고리 탭 + 체크리스트
- [ ] **`/teams/[teamId]/expenses`** — 지출 리스트 + 본인 것만 필터
- [ ] **`/teams/[teamId]/expenses/new`** — 모바일 카메라 우선 등록 폼 (OCR은 Phase 3)
- [ ] **`/teams/[teamId]/budget`** — 카테고리별 계획 입력
- [ ] **`/settings/profile`** — 계좌정보 입력
- [ ] 빈 상태 일러스트 (자체 SVG)

### 검증
- 팀장이 우도교회팀을 만들고, 30명을 초대 링크로 모은다.
- 일정 5개, 준비물 50개를 입력한다.
- 비상연락망 PDF를 다운로드한다.
- **팀장이 사전 준비 단계에서 산 미디어 장비 영수증을 모바일로 등록한다.**
- **카테고리별 예산 입력 후 실집행 막대그래프로 확인한다.**

---

## Phase 2 — 미디어 + 본진 + 정산 (5/25 ~ 6/14, 약 3주) ⭐

### Goals
**현장에서 매일 쓸 핵심.** 미디어팀이 한 곳에서 일하고, 본진은 공개 페이지로 매일 업데이트를 본다.
**회계는 검토 / 승인 / 인별 정산 묶음 기능까지 완성.** Phase 1에서 등록만 됐던 지출이 이제 완결된다.

### Deliverables

#### Backend
- [ ] MediaAsset / MediaThumbnail 모델
- [ ] HomeUpdate / HomeUpdateMedia / ShareLink 모델
- [ ] **Reimbursement 모델 + 상태 머신 (draft → confirmed → completed)**
- [ ] R2 presigned URL 발급 API
- [ ] 업로드 완료 콜백 → 백그라운드 잡 (썸네일, EXIF)
- [ ] 미디어 CRUD + 필터 + 일괄 작업 API
- [ ] HomeUpdate CRUD + publish API
- [ ] 공개 share 엔드포인트 (`/share/{slug}`, 캐시 헤더)
- [ ] **Expense 승인 / 반려 / 일괄 승인 API**
- [ ] **Reimbursement preview / create / confirm / complete API**
- [ ] **회계 보고서 생성 (Excel, PDF) — `openpyxl`, `weasyprint`**

#### Frontend
- [ ] `/teams/[teamId]/media`:
  - 일자별 그리드, 사진 클릭 시 라이트박스
  - 업로드 (드래그앤드롭 + 모바일 카메라롤)
  - 셀렉 토글, 가시성 변경, 태그 추가
  - 일괄 작업 툴바
  - 업로드 큐 (오프라인/약한 네트워크 대비)
- [ ] `/teams/[teamId]/share-settings` — 공개 페이지 설정 + URL 복사
- [ ] `/teams/[teamId]/home-updates` — 게시물 작성/발행
- [ ] **`/share/[slug]`** (퍼블릭) — 에디토리얼 본진 페이지
- [ ] **`/teams/[teamId]/expenses/review`** — 회계 검토 대시보드
  - 필터 + 일괄 승인 + 영수증 사진 모달
- [ ] **`/teams/[teamId]/reimbursements`** — 정산 묶음 리스트
- [ ] **`/teams/[teamId]/reimbursements/[id]`** — 묶음 상세
  - 인별 카드 (계좌정보 + 합계 + "송금정보 복사" + "송금완료")
  - draft 상태에서 expense 추가/제외 토글
- [ ] **`/teams/[teamId]/reports`** — Excel / PDF / ZIP 다운로드 페이지

### 검증
- 팀원 5명이 동시에 사진 50장씩 업로드해도 안 깨진다.
- 미디어팀장이 셀렉 50장 골라 본진 페이지에 게시한다.
- 본진 성도가 카카오톡으로 받은 링크를 열면 OG 미리보기와 함께 페이지가 뜬다.
- **회계 담당이 30건의 영수증을 한 번에 승인하고, 7명에게 정산 묶음을 만들어 송금정보를 복사해 차례대로 송금한다.**
- **회계 담당이 트립 종료 후 회계 Excel과 영수증 ZIP을 한 번에 받는다.**

---

## Phase 3 — 간증 / QR / OCR / 알림 (6/15 ~ 6/28, 약 2주)

### Goals
차별화 기능 마무리. 영수증 OCR로 입력 속도 극대화.

### Deliverables

#### Backend
- [ ] Testimony / QrToken 모델
- [ ] QR 토큰 생성 + 공개 폼 API (rate-limited)
- [ ] **영수증 OCR 통합 (네이버 클로바 우선, Google Vision 폴백)**
- [ ] 음성 업로드 → Whisper 전사 (옵션, 시간 부족하면 Phase 4)
- [ ] 인앱 알림 (지출 반려, 정산 완료 등) — 단순 polling으로 시작

#### Frontend
- [ ] `/teams/[teamId]/testimonies` — 카테고리별, 가시성 필터
- [ ] QR 토큰 관리 + QR 이미지 다운로드 (`qrcode.react`)
- [ ] **`/qr/[token]`** (퍼블릭) — 모바일 우선 익명 폼
- [ ] 본진 페이지에 간증 섹션 표시
- [ ] **지출 등록 폼에 OCR 자동 채우기 통합**
- [ ] 알림 센터 (헤더 종 아이콘)

### 검증
- 현장에서 QR 인쇄해 붙이고, 현지인이 폰으로 스캔해 익명으로 기도제목을 남긴다.
- 팀장이 그 기도제목을 가시성 변경 후 본진 페이지에 띄운다.
- **팀장이 영수증 사진 한 장 찍으면 금액/가게/일시가 자동으로 채워진다.**

---

## Phase 3.5 — 출국 전 정비 (6/29 ~ 7/3)

### Goals
**버그 수정 + 운영 안정성. 새 기능 추가 금지.**

- [ ] E2E 테스트 (핵심 시나리오 5개, Playwright)
- [ ] 에러 모니터링 (Sentry FE+BE)
- [ ] 백업 / 롤백 연습
- [ ] 사용자 가이드 문서 (1페이지)
- [ ] 팀 워크샵 1회 (실제 데이터로 데모 + 피드백)

---

## Phase 4 — 사후 (7월 말 이후)

### Goals
회고 + 다음 해를 위한 자산화. 회계 마무리.

### Deliverables
- [ ] **최종 회계 정산 (트립 종료 후 일괄 정산)**
- [ ] **회계 보고서 고도화** — 교회 회계팀 양식에 맞춤
- [ ] **외화 환산 / 다중 통화 지원** (해외 단기선교 대비)
- [ ] 결산 책자 자동 생성 (PDF) — 사진 + 간증 + 일정 요약
- [ ] 결산 영상 패키지 (셀렉 사진/영상 + 간증 텍스트 zip)
- [ ] 트립 복제 / 템플릿화 ("작년에서 시작하기")
- [ ] 다국어 (영어, 일본어) — QR 폼만이라도
- [ ] 카카오 알림톡 연동 (정산 완료 알림 등)
- [ ] 다크 모드 검토

---

## 작업 우선순위 원칙

### "이게 없으면 단톡방으로 돌아가는가?" 테스트
모든 작업을 이 질문에 통과시킨다.
- ✅ 미디어 허브: 단톡방 사진은 화질 깨짐 + 흩어짐 → **만든다**
- ✅ 본진 공유 페이지: 단톡방으론 깔끔히 못 보여줌 → **만든다**
- ❌ 화려한 차트 / 통계 대시보드: 안 만들어도 단톡방으로 충분 → **나중에**

### "출국 후에도 만들 수 있는가?"
- 결산, 책자, 알림톡 등은 출국 후에도 천천히 가능. 출국 전엔 핵심에만 집중.

---

## 리스크 / 감안 사항

| 리스크 | 대응 |
|---|---|
| 팀장(개발자)이 6월에 본업 폭주 | Phase 2까지가 마지노선. Phase 3는 못 해도 됨. |
| 우도(섬) 네트워크 약함 | 업로드 큐잉 + 자동 재시도. 오프라인 친화 UX. |
| 30명 동시 업로드로 R2 비용 폭증 | R2는 egress 무료. 업로드 자체는 저렴. |
| 응급정보 유출 | RBAC + audit log, 절대 공개 페이지로 새지 않게. |
| 다른 팀 쓰겠다는 요구 폭주 | Phase 4 이후 정식 오픈. 그 전엔 우리팀 + 협력 1팀까지만. |

---

## 다음 액션 (이 문서 작성 시점에)

Claude Code에 다음 순서로 작업 지시:

1. `Phase 0`의 백엔드 부트스트랩부터 시작.
2. 한 번에 한 도메인씩, 모델 → 스키마 → 서비스 → 라우터 → 테스트 → 프론트 화면.
3. 화면 만들기 전 무조건 `DESIGN.md` 토큰 확인.
4. 매 작업 끝에 관련 MD 문서 갱신.
