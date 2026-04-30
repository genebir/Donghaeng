# 동행 (Donghaeng)

교회 단기선교 / 아웃리치 팀이 기획부터 회고까지 한 곳에서 진행할 수 있는 멀티테넌트 플랫폼.

> 자세한 배경, 도메인 모델, 로드맵은 [`CLAUDE.md`](./CLAUDE.md)와 [`docs/`](./docs/) 참조.

---

## 빠른 시작 (로컬 개발)

```bash
# 1. 인프라 (Postgres + MinIO)
docker compose up -d

# 2. 환경변수
cp .env.example .env  # 그리고 backend/, frontend/ 각자 필요한 키 설정

# 3. Backend
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload  # http://localhost:8000

# 4. Frontend (Phase 0 후반)
cd frontend
pnpm install
pnpm dev  # http://localhost:3000
```

---

## 폴더 구조

```
donghaeng/
├── CLAUDE.md            # Claude Code용 프로젝트 가이드
├── docs/                # 제품/아키텍처/DB/API/디자인/로드맵
├── docker-compose.yml   # postgres + minio
├── backend/             # FastAPI + SQLAlchemy + Alembic
└── frontend/            # Next.js 15 + Tailwind v4
```

자세한 구조는 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## 문서

- [`docs/PRODUCT.md`](./docs/PRODUCT.md) — 무엇을 만드는가
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase별 작업
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 시스템 구조
- [`docs/DATABASE.md`](./docs/DATABASE.md) — 데이터 모델
- [`docs/API.md`](./docs/API.md) — API 명세
- [`docs/DESIGN.md`](./docs/DESIGN.md) — 디자인 시스템
