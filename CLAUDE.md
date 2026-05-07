# 동행 (Donghaeng) — 아웃리치 플랫폼

> **함께 걷는다.** 교회 단기선교 / 아웃리치 팀이 기획부터 회고까지 한 곳에서 진행할 수 있는 멀티테넌트 플랫폼.

---

## 프로젝트 개요

- **만든 이유**: 매년 여름 우리들교회(분당)가 여러 팀으로 나뉘어 여러 교회로 아웃리치를 가는데, 매번 처음부터 다시 시작함. 기획·준비물·일정·미디어·간증이 단톡방·엑셀·구글드라이브에 흩어져 있음.
- **목표**: 한 번 만들어두면 매년 재사용 가능한 아웃리치 운영 플랫폼.
- **첫 사용 사례**: 2026년 7월, 우리들교회 → 우도교회 (약 30명).
- **확장 사용 사례**: 같은 해 같은 교회의 다른 팀들, 그리고 매년 다른 행선지.

---

## 핵심 개념 (Domain Model 요약)

```
Organization (예: 우리들교회)
  └─ Outreach (예: 2026 여름 단기선교)
       └─ Team (예: 우도교회 팀)
            ├─ Members (역할: 팀장/팀원, 파트: 미디어/찬양/교사/회계/의료/일반)
            ├─ Destination (방문지 교회 정보)
            ├─ Schedule (일자별 일정)
            ├─ Checklist (준비물 / 사역 준비)
            ├─ MediaAssets (사진 / 영상)
            ├─ Testimonies (간증 / 기도제목)
            ├─ HomeUpdates (본진 공유 게시물)
            └─ Accounting ⭐
                 ├─ Budget (카테고리별 예산)
                 ├─ Expense (지출 / 영수증)
                 └─ Reimbursement (정산 묶음 — 인별 일괄 송금)
```

**역할 체계**
- 조직(교회) 직분: **마을장 / 목자 / 부목자 / 목원** (`church_position`, 표시용)
- 시스템 권한: **OWNER / ADMIN / MEMBER** (실제 권한)
- 아웃리치 팀 역할: **팀장(LEADER) / 팀원(MEMBER)**
- 파트(부서): MEDIA / WORSHIP / TEACHER / **FINANCE** / MEDICAL / GENERAL

자세한 모델은 [docs/DATABASE.md](./docs/DATABASE.md) 참조.

---

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | SSR/이미지 최적화, 본진 공유 페이지 SEO |
| Backend | FastAPI + Python 3.12 | 빠른 개발, 타입 안정성, 비동기 |
| Database | PostgreSQL 16 | 관계형 + JSONB 유연성 |
| ORM | SQLAlchemy 2.0 + Alembic | 마이그레이션 |
| Storage | S3 호환 (Cloudflare R2 추천) | 사진/영상 |
| Auth | NextAuth + JWT (FastAPI 검증) | 카카오/구글 로그인 |
| Styling | Tailwind CSS v4 + 커스텀 토큰 | 디자인 시스템 |
| Deploy | Vercel (FE) + Railway/Fly.io (BE) | 간단함 |

자세한 구조는 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## 문서 인덱스 (Claude Code가 따라야 할 순서)

작업할 때 참고할 문서들. **디자인은 항상 `DESIGN.md`를 먼저 읽고 화면을 만들 것.**

1. **[docs/PRODUCT.md](./docs/PRODUCT.md)** — 무엇을 만드는지. 유저 스토리 / 화면 목록 / 우선순위.
2. **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — 폴더 구조, 모듈 경계, 환경변수.
3. **[docs/DATABASE.md](./docs/DATABASE.md)** — 스키마, 관계, 인덱스, 시드 데이터.
4. **[docs/API.md](./docs/API.md)** — FastAPI 엔드포인트, 요청/응답 스키마.
5. **[docs/DESIGN.md](./docs/DESIGN.md)** — **🎨 디자인 시스템. UI 만들기 전 필독.**
6. **[docs/ROADMAP.md](./docs/ROADMAP.md)** — Phase별 우선순위. 7월 출국 전 MVP 범위.

---

## 작업 원칙 (Claude Code 가이드)

### 코드 스타일
- **Backend**: PEP8 + `ruff` + `mypy`. 모든 함수에 타입 힌트.
- **Frontend**: ESLint + Prettier. `any` 금지. 서버 컴포넌트 우선, 필요한 곳만 `'use client'`.
- **Naming**: 한국어 도메인 용어는 영어 코드명으로 (예: 간증 → `testimony`, 준비물 → `checklist_item`).

### 폴더 구조 원칙
- Backend: 도메인별 모듈 (`outreach/`, `team/`, `media/`...) — 모놀리스지만 도메인 경계 명확히.
- Frontend: `app/` 라우트 기반, 공통 UI는 `components/ui/`, 도메인 컴포넌트는 `components/{domain}/`.

### 디자인 작업 시 필수 절차
1. **먼저 `docs/DESIGN.md`를 view로 열어서 토큰 / 컴포넌트 패턴 확인**.
2. 거기 정의된 컬러 토큰(`--paper`, `--ink`, `--coral`...)과 타이포 스케일만 사용.
3. 새 패턴이 필요하면 `DESIGN.md`에 먼저 추가하고 코드에 반영. **반대로 하지 말 것.**

### Git 커밋 규칙
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- 예: `feat(media): 일자별 사진 업로드 API 추가`.

### 테스트

**하네스 구조** (`backend/app/tests/`)

```
conftest.py          # 픽스처: 트랜잭션 격리 DB 세션, httpx AsyncClient, auth_headers()
factories.py         # make_user / make_org / make_team / make_expense / make_qr_token …
test_expense_flow.py # 지출 등록→승인/반려→재제출 흐름
test_permissions.py  # 팀원/팀장/외부인 권한 경계
test_testimony_qr.py # QR 토큰 + 익명 간증 제출
```

**핵심 규칙**
- 팩토리 함수는 반드시 `db.flush()` (commit 금지) — 트랜잭션 롤백으로 격리.
- 새 도메인 모델을 추가하면 `conftest.py` 상단 import 목록에도 추가할 것 (Base.metadata 등록용).
- 테스트는 `pytest-asyncio`의 `asyncio_mode = "auto"` 덕분에 `@pytest.mark.asyncio` 불필요.
- DB URL은 `TEST_DATABASE_URL` 환경변수 (기본: `postgresql+asyncpg://donghaeng:donghaeng@localhost:5433/donghaeng_test`).

**실행**
```bash
cd backend
uv run pytest -v          # 전체
uv run pytest --cov=app   # 커버리지
```

E2E는 7월 출국 직전에 Playwright 한 번만.

---

## 멀티테넌트 설계 메모

- 모든 핵심 테이블은 `organization_id` FK를 가진다.
- API 미들웨어에서 현재 유저의 `organization_id`로 자동 필터링.
- 본진 공유 페이지는 `slug` 기반 공개 URL (`/share/{trip-slug}`)로 인증 없이 접근.
  - 단, 민감한 데이터는 노출 안 함 (개인정보 / 비공개 간증).

---

## 단계별 개발 (요약)

| Phase | 기간 | 범위 |
|---|---|---|
| Phase 0 | ~5월 1주 | 인프라 / 인증 / 기본 모델 |
| Phase 1 | ~5월 말 | 팀 / 멤버(계좌포함) / 일정 / 준비물 / **지출 등록** |
| Phase 2 | ~6월 중 | 미디어 허브 / 본진 공유 / **회계 검토 + 정산** |
| Phase 3 | ~6월 말 | 간증 수집 (QR) / 알림 / **OCR** |
| Phase 4 | 7월 출국 후 | 회고 / 결산 / 회계 보고서 / 다음 해 템플릿화 |

자세한 건 [docs/ROADMAP.md](./docs/ROADMAP.md).

---

## 작업 시작 전 체크리스트

새 기능 작업할 때 Claude Code는 다음 순서를 따른다:

1. [ ] `CLAUDE.md` (이 파일) 읽기
2. [ ] 관련 도메인 문서 (`PRODUCT.md`, `DATABASE.md`, `API.md`) 읽기
3. [ ] UI 작업이면 **반드시 `DESIGN.md` 먼저 읽기**
4. [ ] 변경사항이 스키마/API에 영향 주면 해당 MD 먼저 업데이트, 그 다음 코드
5. [ ] 작업 완료 후 README나 관련 문서 업데이트
