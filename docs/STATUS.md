# STATUS — 진행 상태 스냅샷

> 다른 PC에서 이어 작업할 때 가장 먼저 읽는 파일. ROADMAP은 계획, 여기는 "지금 어디까지 와 있는가".
> **마지막 업데이트:** 2026-05-01 / 커밋 `a9e3860`

---

## 새 PC 부트스트랩 (그대로 이어가기)

```bash
git clone git@github.com:genebir/Donghaeng.git
cd Donghaeng

# 1. 환경변수 — 필요한 키만 채우면 됨 (OAuth/R2/OCR은 Phase별로 천천히)
cp .env.example backend/.env
cp .env.example frontend/.env.local
# 최소 필수: JWT_SECRET, BANK_INFO_ENCRYPTION_KEY (Fernet 32-byte b64), NEXTAUTH_SECRET

# 2. 인프라 (postgres :5433, minio :9000/9001)
docker compose up -d

# 3. 백엔드
cd backend && uv sync && uv run alembic upgrade head
uv run uvicorn app.main:app --reload   # http://localhost:8000

# 4. 프론트엔드 (다른 터미널)
cd frontend && pnpm install && pnpm dev   # http://localhost:3000
```

> docker-compose는 host의 5432가 다른 postgres에게 점유당해 있어 **5433:5432**로 매핑됨
> (자세한 사정은 `docker-compose.yml` 주석). 새 PC에서 5432가 비어있다면 그대로 둬도
> 문제 없음 — `DATABASE_URL`만 일치시키면 됨.

---

## Phase 진행

### Phase 0 — 기반 ✅ 완료
- [x] Backend 스캐폴딩 (uv / ruff strict / mypy strict)
- [x] PostgreSQL + Alembic + 자동 임포트 허브 (`app/db/models_registry.py`)
- [x] CORS / 헬스체크 (`/healthz`, `/healthz/db`)
- [x] JWT 발급/검증 (`app/core/security.py`)
- [x] OAuth exchange (`/api/v1/auth/oauth/exchange`) + `/api/v1/auth/me`
- [x] User / Organization / OrgMembership 모델 (마이그레이션 0001)
- [x] Frontend 스캐폴딩 (Next.js 15 + Tailwind v4 + DESIGN.md 토큰)
- [x] 폰트 자가호스팅 (Pretendard / Inter / Fraunces / Gowun Batang)
- [x] UI 프리미티브 (Button/Card/Input/Tag/Avatar)
- [x] 랜딩 페이지 (DESIGN.md 부록 B)
- [ ] **`/login` 페이지 + NextAuth 연결** ← 미진
- [ ] GitHub Actions CI ← 미진

### Phase 1 — 기획 도구 + 지출 등록 ✅ 백엔드 완료
- [x] Outreach 도메인 (마이그레이션 0002)
- [x] Team + Destination (1:1) 도메인 (0003)
- [x] TeamMember 도메인 (0004) — LEADER/MEMBER role + 6개 part
- [x] ScheduleItem (0005) — date range 쿼리, owner_member_id 검증
- [x] ChecklistItem (0005) — 카테고리/상태 필터, cost_amount Numeric
- [x] Budget (0006) — `(team_id, category)` UNIQUE, ON CONFLICT upsert
- [x] Expense (0006) — pending/approved/rejected/reimbursed status flow,
      approve/reject 액션, 본인외 등록은 admin만, reimbursed 잠금
- [x] 권한 시스템 — Org/Outreach/Team 3단계 + TeamAccess (is_admin 노출) +
      MemberAccess + ExpenseAccess (admin or self)
- [ ] **시드 스크립트 (`scripts/seed.py`) — 더미 지출 20건 포함** ← 미진
- [ ] **비상연락망 PDF 생성** (`weasyprint`/`reportlab`) ← 미진
- [ ] **Frontend 전부 미진** — App Shell / `/dashboard` / `/teams/[id]` 외 7개 라우트

### Phase 2 / 3 / 4 — 미착수

---

## 도메인 / API 매트릭스 (백엔드 기준)

| 도메인 | 모델 | 라우터 | 비고 |
|---|---|---|---|
| user | ✅ | (auth에서) | bank_* 필드 있음, 암호화는 미구현 |
| auth | — | ✅ | OAuth exchange + /me |
| org | ✅ | ✅ | OWNER/ADMIN/MEMBER + ChurchPosition |
| outreach | ✅ | ✅ | year + 날짜, teams[] embed |
| team | ✅ | ✅ | nested + flat router 패턴, Destination 1:1 |
| member | ✅ | ✅ | LEADER 권한이 team admin 체크에 piggyback |
| schedule | ✅ | ✅ | from/to range, kind 8종 |
| checklist | ✅ | ✅ | category/status enum + due_date |
| budget | ✅ | ✅ | upsert + 카테고리별 실집행 합산 summary |
| expense | ✅ | ✅ | approve/reject + reimbursed 잠금 |
| reimbursement | — | — | Phase 2 |
| media | — | — | Phase 2 |
| home_update | — | — | Phase 2 |
| testimony | — | — | Phase 3 |

---

## 다음에 할 수 있는 것 (추천 순서)

1. **GitHub Actions CI** — lint / mypy / alembic check / pytest. 30분 안.
2. **간증 / 홈업데이트 도메인** — 텍스트 위주 가벼운 슬라이스. 본진 공유 페이지 토대.
3. **프론트 `/login` + NextAuth 연결** — OAuth client ID 발급 필요 (카카오/구글).
4. **시드 스크립트** — 로컬 개발 + 프론트 작업 시 데이터 필요.
5. **회계 reimbursement 도메인** — Phase 2 핵심.

---

## 알려진 컨벤션 / 함정

- **revision id**: alembic autogenerate 후 파일명/`revision`/`down_revision` 모두 `0001`/`0002`/... 형식으로 정리한다 (자동 생성된 hex는 가독성 나쁨).
- **StrEnum + lowercase**: `status` 류는 lowercase value (`pending`, `todo`)로 저장.
  `Enum(..., values_callable=lambda e: [m.value for m in e])` 필수, 안 그러면 `.name`이 저장됨.
- **403 vs 404**: 권한 부족과 미존재를 동일하게 403으로 노출 (정보 누설 방지).
- **PATCH 시 부분 업데이트**: `payload.model_dump(exclude_unset=True)`로 받아야 None overwrite 안 일어남.
- **uvicorn --reload는 직접 켜기**: 라우터 추가 후 자동 재시작 안 되면 수동 kill+restart.
- **CRLF 경고**: WSL2에서 종종 뜨는데 무시해도 됨. 코드는 LF 정상.

---

## 변경 시 갱신해야 할 곳

새 도메인 추가 시:
1. `app/domains/<name>/` 모듈 추가
2. `app/db/models_registry.py`에 `from app.domains.<name> import models as _<name>_models  # noqa: F401`
3. `app/main.py`에 라우터 import + `app.include_router(... prefix="/api/v1")`
4. alembic 마이그레이션 생성 + revision id 정리
5. 권한이 다른 도메인을 walk하면 `app/core/permissions.py`에 dep 추가
