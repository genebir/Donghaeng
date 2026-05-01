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

## 문서

- [`docs/PRODUCT.md`](./docs/PRODUCT.md) — 무엇을 만드는가
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase별 작업
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — 시스템 구조
- [`docs/DATABASE.md`](./docs/DATABASE.md) — 데이터 모델
- [`docs/API.md`](./docs/API.md) — API 명세
- [`docs/DESIGN.md`](./docs/DESIGN.md) — 디자인 시스템
