# ARCHITECTURE.md — 시스템 아키텍처

## 전체 구성

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Next.js 15     │  HTTPS  │  FastAPI        │  asyncpg│  PostgreSQL 16  │
│  (App Router)   │ ──────► │  (Python 3.12)  │ ──────► │                 │
│  Vercel         │         │  Railway/Fly    │         │  Neon / RDS     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │  S3 SDK
                                     ▼
                            ┌─────────────────┐
                            │  Cloudflare R2  │
                            │  (미디어 원본)   │
                            └─────────────────┘
```

---

## 모노레포 구조

```
donghaeng/
├── CLAUDE.md
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DESIGN.md
│   └── ROADMAP.md
├── README.md
├── docker-compose.yml          # 로컬 개발 (postgres, minio)
├── .env.example
│
├── backend/                    # FastAPI
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py             # FastAPI app, 라우터 등록
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── deps.py             # 공통 의존성 (DB session, current_user)
│   │   ├── db/
│   │   │   ├── base.py         # Base, async engine
│   │   │   └── session.py
│   │   ├── core/
│   │   │   ├── security.py     # JWT, password
│   │   │   ├── permissions.py  # RBAC 체크
│   │   │   └── storage.py      # R2/S3 클라이언트
│   │   ├── domains/            # 도메인 모듈 (각자 model/schema/service/router)
│   │   │   ├── org/
│   │   │   ├── outreach/
│   │   │   ├── team/
│   │   │   ├── member/
│   │   │   ├── schedule/
│   │   │   ├── checklist/
│   │   │   ├── media/
│   │   │   ├── testimony/
│   │   │   ├── home_update/
│   │   │   └── accounting/     # budget + expense + reimbursement + report ⭐
│   │   ├── shared/             # 도메인 횡단 유틸
│   │   │   ├── pagination.py
│   │   │   ├── slug.py
│   │   │   └── audit.py
│   │   └── tests/
│   └── scripts/
│       └── seed.py             # 시드 데이터 (개발용)
│
└── frontend/                   # Next.js 15
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── public/
    │   ├── fonts/              # Pretendard, Gowun Batang
    │   └── grain.png           # 리소 노이즈 텍스처
    ├── src/
    │   ├── app/                # App Router
    │   │   ├── layout.tsx      # 글로벌 레이아웃 (폰트, 테마)
    │   │   ├── page.tsx        # 랜딩
    │   │   ├── (auth)/
    │   │   │   ├── login/
    │   │   │   └── invite/
    │   │   ├── (app)/          # 인증 필요
    │   │   │   ├── dashboard/
    │   │   │   ├── teams/[teamId]/
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── members/
    │   │   │   │   ├── schedule/
    │   │   │   │   ├── checklist/
    │   │   │   │   ├── media/
    │   │   │   │   └── testimonies/
    │   │   │   └── settings/
    │   │   ├── share/[slug]/   # 공개 본진 페이지
    │   │   └── qr/[token]/     # QR 간증 폼
    │   ├── components/
    │   │   ├── ui/             # 디자인시스템 프리미티브 (Button, Card, Input...)
    │   │   ├── layout/         # Header, Sidebar, Container
    │   │   ├── media/          # 미디어 도메인 컴포넌트
    │   │   ├── schedule/
    │   │   ├── accounting/     # 영수증 카드, 정산 묶음, 예산 차트 ⭐
    │   │   └── testimony/
    │   ├── lib/
    │   │   ├── api.ts          # FastAPI 클라이언트 (fetch wrapper)
    │   │   ├── auth.ts         # NextAuth 설정
    │   │   └── utils.ts
    │   ├── hooks/
    │   ├── styles/
    │   │   ├── globals.css     # 토큰, 베이스 스타일
    │   │   └── grain.css       # 리소 텍스처 오버레이
    │   └── types/              # TS 타입 (백엔드 스키마와 동기화)
    └── tests/
```

---

## Backend 모듈 패턴

각 도메인 모듈은 동일한 구조를 따른다:

```
domains/team/
├── __init__.py
├── models.py       # SQLAlchemy ORM 모델
├── schemas.py      # Pydantic 스키마 (Request/Response)
├── service.py      # 비즈니스 로직 (DB 트랜잭션 단위)
├── router.py       # FastAPI 라우터
├── permissions.py  # 이 도메인 전용 권한 체크 (필요 시)
└── tests/
    ├── test_service.py
    └── test_router.py
```

**원칙**
- `router.py`는 얇게: 입력 검증 → service 호출 → 응답.
- `service.py`에 비즈니스 로직 집중. service는 다른 service 호출 가능.
- model끼리만 직접 import. service → models, router → schemas+service.
- 도메인 간 결합이 강해지면 `shared/`로 빼거나 이벤트로 분리.

---

## Frontend 패턴

### Server Components 우선
- 데이터 페칭은 서버 컴포넌트에서 직접.
- `'use client'`는 인터랙션이 필요한 leaf 컴포넌트만.

### 데이터 페칭
- 서버: `fetch()` + `next: { revalidate, tags }` 활용.
- 클라이언트: TanStack Query (mutation, optimistic update가 필요한 곳만).

### 폼
- React Hook Form + Zod 스키마.
- 백엔드 Pydantic 스키마와 같은 모양 유지 (수동 동기화. Phase 4에서 OpenAPI 자동 생성 고려).

### 상태 관리
- 전역 상태 최소화. URL 상태 + 서버 상태로 대부분 해결.
- 진짜 필요하면 Zustand.

---

## 인증 / 권한

### 로그인
1. NextAuth로 카카오 / 구글 OAuth.
2. NextAuth 세션에서 JWT 발급 → FastAPI에 Bearer로 전달.
3. FastAPI는 JWT 검증, `current_user` 의존성으로 주입.

### 권한 (RBAC)
- 역할은 `team_member` 테이블의 `role` 필드.
- 가능한 역할: `LEADER`, `VICE_LEADER`, `PART_LEAD`, `MEMBER`.
- `core/permissions.py`에 데코레이터 / 의존성으로 구현:
  ```python
  @require_team_role(TeamRole.LEADER, TeamRole.VICE_LEADER)
  async def update_member_emergency_info(...): ...
  ```

### 공개 페이지
- `/share/[slug]` 와 `/qr/[token]` 는 인증 없이 접근.
- 백엔드는 슬러그/토큰을 검증하고, 공개 가능한 데이터만 반환.
- 공개 토큰은 만료 가능 (`expires_at`), 폐기 가능 (`revoked_at`).

---

## 미디어 업로드 흐름

1. **클라이언트**가 `POST /api/media/presign` 호출 (파일명, 크기, mime).
2. **백엔드**가 R2 presigned PUT URL + media row의 `pending` 상태로 생성.
3. **클라이언트**가 R2에 직접 업로드 (백엔드 우회 → 빠름).
4. 완료되면 클라이언트가 `POST /api/media/{id}/complete` 호출.
5. **백엔드**가 R2에서 메타 확인 후 EXIF/썸네일 처리 백그라운드 잡 큐잉.
6. **워커** (FastAPI BackgroundTasks 또는 Phase 3에서 ARQ/RQ)가:
   - 썸네일 생성 (3 사이즈: 200/800/1600)
   - EXIF 추출 → 촬영시각/GPS
   - 미디어 row를 `ready` 상태로 업데이트.

---

## 환경 변수 (.env.example)

```bash
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/donghaeng
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7일

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=donghaeng-media
R2_PUBLIC_URL=https://media.donghaeng.app

KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OCR (영수증)
NAVER_CLOVA_OCR_URL=
NAVER_CLOVA_OCR_SECRET=
# 또는 Google Vision
GOOGLE_VISION_API_KEY=

# 계좌정보 암호화
BANK_INFO_ENCRYPTION_KEY=  # Fernet 키 (32 bytes base64)

ENVIRONMENT=development  # development | staging | production
SENTRY_DSN=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 로컬 개발

```bash
# 1. 인프라 띄우기
docker compose up -d   # postgres + minio (S3 모킹)

# 2. 백엔드
cd backend
uv sync                  # 의존성 (uv 권장, pip도 OK)
alembic upgrade head     # 마이그레이션
python scripts/seed.py   # 시드 데이터
uv run uvicorn app.main:app --reload

# 3. 프론트엔드
cd frontend
pnpm install
pnpm dev
```

---

## 배포 (간단)

- **Frontend**: Vercel. `main` 브랜치 자동 배포.
- **Backend**: Railway 또는 Fly.io. Dockerfile 기반.
- **DB**: Neon (Postgres serverless, 무료티어 충분). 7월 한정 트래픽이면 비용 거의 없음.
- **Storage**: Cloudflare R2 (egress 무료).
- **모니터링**: Sentry (FE+BE), 로그는 Better Stack.

---

## 보안 / 개인정보

- 응급정보 (`emergency_info` JSONB)는 별도 컬럼 + audit log.
- 미디어 R2 버킷은 private, 공개 URL은 signed (24h 만료).
- 본진 공유 페이지의 데이터는 항상 `is_public=true` 필터링.
- HTTPS 강제, HSTS 헤더.
- Rate limit: 미디어 업로드 / QR 폼 제출에 IP 기반 제한 (slowapi).
