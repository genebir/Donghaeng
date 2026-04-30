# 동행 Backend

FastAPI + SQLAlchemy 2.0 + Alembic + asyncpg.

## 셋업

```bash
uv sync                   # 의존성 설치 (.venv 자동 생성)
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

## 검증

- 헬스체크: <http://localhost:8000/healthz>
- API 문서: <http://localhost:8000/docs>

## 개발 명령

```bash
uv run ruff check .              # 린트
uv run ruff format .             # 포매팅
uv run mypy app                  # 타입체크
uv run pytest                    # 테스트
uv run alembic revision --autogenerate -m "메시지"
```

## 폴더 구조

```
backend/
├── app/
│   ├── main.py           # FastAPI 앱
│   ├── config.py         # 설정 (pydantic-settings)
│   ├── deps.py           # 공통 DI (DB session, current_user)
│   ├── core/             # security, permissions, storage
│   ├── db/               # base, session
│   ├── domains/          # 도메인 모듈
│   ├── shared/           # 횡단 유틸
│   └── tests/
├── alembic/
└── scripts/
```
