# 동행 (Donghaeng)

교회 단기선교 / 아웃리치 팀이 기획부터 회고까지 한 곳에서 진행할 수 있는 멀티테넌트 플랫폼.

> 자세한 배경, 도메인 모델, 로드맵은 [`CLAUDE.md`](./CLAUDE.md)와 [`docs/`](./docs/) 참조.

---

## 빠른 시작 (로컬 개발)

세 개의 스크립트로 끝. **멱등** — 재실행 안전.

```bash
./scripts/setup.sh   # 1회 (또는 .env.example/스키마 변경 후 재실행)
./scripts/start.sh   # 매번. 이미 떠 있으면 skip
./scripts/stop.sh    # 종료. (--all 붙이면 docker 인프라까지 중지)
```

지원 환경: macOS / Linux / WSL2 / Git Bash on Windows.
사전 도구: `git`, `docker`(+compose), `uv`, `pnpm`, `openssl` — `setup.sh`가 없는 항목을 안내.

포트 충돌 시 환경변수로 override:

```bash
BACKEND_PORT=8001 FRONTEND_PORT=3001 ./scripts/start.sh
```

수동으로 띄우고 싶다면 [`docs/STATUS.md`](./docs/STATUS.md) 의 명령 풀 셋 참조.

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

## 테스트

### 사전 조건

```bash
# donghaeng_test DB 생성 (1회)
docker-compose up -d postgres
docker exec -it donghaeng-postgres-1 psql -U donghaeng -c "CREATE DATABASE donghaeng_test;"
```

### 실행

```bash
cd backend
uv run pytest                                          # 전체 테스트
uv run pytest -v                                       # 상세 출력
uv run pytest --cov=app                                # 커버리지 포함
uv run pytest app/tests/test_expense_flow.py           # 특정 파일만
```

### 환경변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `TEST_DATABASE_URL` | `postgresql+asyncpg://donghaeng:donghaeng@localhost:5433/donghaeng_test` | 테스트용 DB URL |

### 구조

```
backend/app/tests/
├── conftest.py          # 픽스처: DB 세션, HTTP 클라이언트, 인증 헤더
├── factories.py         # 테스트 데이터 팩토리 (make_user, make_team, ...)
├── test_expense_flow.py # 지출 등록 → 승인/반려 → 재제출 흐름
├── test_permissions.py  # 권한 경계 (팀원/팀장/외부인)
└── test_testimony_qr.py # QR 토큰 + 익명 간증 제출
```

각 테스트는 독립된 DB 트랜잭션 안에서 실행되고 완료 후 롤백 — 테스트 간 데이터 오염 없음.

---

## 문서

- [`docs/PRODUCT.md`](./docs/PRODUCT.md) — 무엇을 만드는가
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase별 작업
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 시스템 구조
- [`docs/DATABASE.md`](./docs/DATABASE.md) — 데이터 모델
- [`docs/API.md`](./docs/API.md) — API 명세
- [`docs/DESIGN.md`](./docs/DESIGN.md) — 디자인 시스템
