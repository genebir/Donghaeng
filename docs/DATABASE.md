# DATABASE.md — 데이터 모델

PostgreSQL 16 기준. SQLAlchemy 2.0 + Alembic 마이그레이션.

---

## 명명 규칙

- 테이블명: 단수 snake_case (`team`, `team_member`, `media_asset`).
- 기본 키: `id BIGSERIAL` 또는 `id UUID DEFAULT gen_random_uuid()`. **UUID 사용** (멀티테넌트 + 외부 노출 안전).
- 외래 키: `{ref_table}_id`.
- 타임스탬프: 모든 테이블에 `created_at`, `updated_at TIMESTAMPTZ`.
- 소프트 삭제는 필요한 테이블만 `deleted_at TIMESTAMPTZ NULL`.

---

## ERD (텍스트)

```
organization (조직)
  ├── outreach (연도별 아웃리치)
  │     └── team (팀)
  │           ├── team_member (팀원, FK to user)
  │           ├── destination (방문지)
  │           ├── schedule_item (일정)
  │           ├── checklist_item (준비물)
  │           ├── media_asset (사진/영상)
  │           ├── testimony (간증/기도제목)
  │           ├── home_update (본진 게시물)
  │           ├── budget (카테고리별 예산)
  │           ├── expense (지출/영수증)         ⭐ 회계
  │           ├── reimbursement (정산 묶음)     ⭐ 회계
  │           └── share_link (공개 링크)
  └── user (조직 가입 유저, bank_account 포함)

independent:
  user (auth)
  qr_token (QR 간증 폼 토큰)
```

---

## 핵심 테이블 정의

### `organization`
교회 또는 선교회 단위.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| name | TEXT NOT NULL | "우리들교회" |
| slug | TEXT UNIQUE NOT NULL | "woori" |
| logo_url | TEXT | |
| primary_color | TEXT | 디자인 토큰 오버라이드 (옵션) |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

---

### `user`
인증 주체.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE NOT NULL | |
| name | TEXT NOT NULL | |
| profile_image_url | TEXT | |
| oauth_provider | TEXT | "kakao" \| "google" |
| oauth_subject | TEXT | provider 내부 ID |
| phone | TEXT | 응급용 |
| bank_name | TEXT | 정산 송금용 (예: "국민") |
| bank_account_number | TEXT | 정산 송금용. **암호화 권장**. |
| bank_account_holder | TEXT | 예금주 (이름과 다를 수 있음) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스: `(oauth_provider, oauth_subject) UNIQUE`.

> 계좌 정보는 본인 + 회계 담당자 + 팀장만 조회 가능. audit_log 기록.

---

### `org_membership`
유저가 어떤 조직에 속해있는지.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK → organization | |
| user_id | UUID FK → user | |
| role | TEXT NOT NULL | **시스템 권한**. `OWNER` \| `ADMIN` \| `MEMBER` |
| church_position | TEXT | **표시용 직분**. `VILLAGE_HEAD` (마을장) \| `SHEPHERD` (목자) \| `VICE_SHEPHERD` (부목자) \| `SHEEP` (목원) \| `OTHER` |
| village_name | TEXT | 소속 마을 이름 (있으면) |
| created_at | TIMESTAMPTZ | |

`(organization_id, user_id) UNIQUE`.

> `role`은 권한 결정용. `church_position`은 화면 표시 + 필터링용.
> 우리들교회 외 다른 교회는 `church_position` 옵션을 organization 설정에서 커스터마이즈 가능.

---

### `outreach`
한 해의 아웃리치 시즌.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| organization_id | UUID FK → organization | |
| name | TEXT NOT NULL | "2026 여름 단기선교" |
| year | INT NOT NULL | 2026 |
| starts_on | DATE | 전체 시작일 |
| ends_on | DATE | 전체 종료일 |
| description | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스: `(organization_id, year)`.

---

### `team`
한 트립 안의 한 팀.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| outreach_id | UUID FK → outreach | |
| name | TEXT NOT NULL | "우도교회팀" |
| slug | TEXT NOT NULL | URL용. (outreach_id, slug) UNIQUE |
| starts_on | DATE | 팀별 일정 |
| ends_on | DATE | |
| description | TEXT | |
| status | TEXT DEFAULT 'planning' | planning \| ongoing \| finished \| archived |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `destination`
팀이 방문하는 교회.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| church_name | TEXT NOT NULL | "우도교회" |
| address | TEXT | |
| coordinator_name | TEXT | 담당 목사님 이름 |
| coordinator_phone | TEXT | |
| coordinator_email | TEXT | |
| timezone | TEXT DEFAULT 'Asia/Seoul' | 해외 대비 |
| notes | TEXT | 특이사항 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `team_member`
유저가 어떤 팀에 어떤 역할로 속해있는지.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| user_id | UUID FK → user | |
| role | TEXT NOT NULL | `LEADER` (팀장) \| `MEMBER` (팀원). 단순화. |
| part | TEXT | `MEDIA` \| `WORSHIP` \| `TEACHER` \| `FINANCE` \| `MEDICAL` \| `GENERAL` |
| is_part_lead | BOOLEAN DEFAULT FALSE | 해당 파트의 책임자 여부 |
| emergency_info | JSONB | { blood_type, allergies, medications, guardian: {name, phone, relation} } |
| meta | JSONB | { shirt_size, dietary, etc } |
| joined_at | TIMESTAMPTZ DEFAULT now() | |

`(team_id, user_id) UNIQUE`.

> 권한 결정 규칙:
> - 팀 일반 관리: `role = LEADER`
> - 회계 처리: `role = LEADER` 또는 `part = FINANCE` (is_part_lead 무관, 회계 파트면 다 가능)
> - 미디어 일괄 작업: `role = LEADER` 또는 `part = MEDIA AND is_part_lead = TRUE`

---

### `schedule_item`
일정 한 건.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| starts_at | TIMESTAMPTZ NOT NULL | |
| ends_at | TIMESTAMPTZ | |
| title | TEXT NOT NULL | |
| kind | TEXT | TRAVEL / WORSHIP / VBS / MEAL / FREE / PRAYER / MEETING / OTHER |
| location | TEXT | |
| description | TEXT | |
| owner_member_id | UUID FK → team_member | 담당자 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스: `(team_id, starts_at)`.

---

### `checklist_item`
준비물 / 사역 준비 항목.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| category | TEXT NOT NULL | TEAM_GEAR / PERSONAL / MINISTRY / DOCS / MISC |
| title | TEXT NOT NULL | |
| quantity | TEXT | "30개", "1박스" |
| owner_member_id | UUID FK → team_member | |
| due_date | DATE | |
| status | TEXT DEFAULT 'todo' | todo / in_progress / done |
| cost_amount | NUMERIC(12,2) | |
| cost_currency | TEXT DEFAULT 'KRW' | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `media_asset`
사진 / 영상 파일.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| uploader_id | UUID FK → user | |
| storage_key | TEXT NOT NULL | R2 object key |
| mime_type | TEXT NOT NULL | |
| byte_size | BIGINT | |
| width | INT | |
| height | INT | |
| duration_ms | INT | 영상만 |
| captured_at | TIMESTAMPTZ | EXIF |
| status | TEXT DEFAULT 'pending' | pending / ready / failed |
| visibility | TEXT DEFAULT 'team' | private / team / home / public |
| is_selected | BOOLEAN DEFAULT FALSE | 베스트 컷 마크 |
| selected_by | UUID FK → user NULL | |
| tags | TEXT[] | ["VBS", "예배", "단체"] |
| meta | JSONB | EXIF 등 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스: `(team_id, captured_at DESC)`, `(team_id, is_selected) WHERE is_selected = true`, `(team_id, visibility)`.

---

### `media_thumbnail`
썸네일 변환물 (1:N from media_asset).

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| media_asset_id | UUID FK → media_asset | |
| size | TEXT NOT NULL | xs / sm / md / lg |
| storage_key | TEXT NOT NULL | |
| width | INT | |
| height | INT | |

---

### `testimony`
간증 / 기도제목.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| author_user_id | UUID FK → user NULL | NULL이면 익명/QR 제출 |
| author_display_name | TEXT | 익명 시 표시명 ("우도교회 학생", "익명") |
| kind | TEXT NOT NULL | THANKS / REPENT / PRAYER / VISION / CHALLENGE |
| content | TEXT NOT NULL | |
| audio_storage_key | TEXT | 음성 파일 (Phase 3) |
| transcribed | BOOLEAN DEFAULT FALSE | |
| visibility | TEXT DEFAULT 'team' | private / team / home / public |
| collected_via | TEXT | DIRECT / QR / IMPORT |
| qr_token_id | UUID FK → qr_token NULL | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스: `(team_id, created_at DESC)`, `(team_id, visibility)`.

---

### `home_update`
본진 공유 게시물.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| author_id | UUID FK → user | |
| title | TEXT | |
| body | TEXT | 짧은 글 |
| posted_for_date | DATE | 어느 날 일지 |
| status | TEXT DEFAULT 'draft' | draft / published |
| published_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `home_update_media` (조인 테이블)

| 컬럼 | 타입 | |
|---|---|---|
| home_update_id | UUID FK | PK 일부 |
| media_asset_id | UUID FK | PK 일부 |
| sort_order | INT | |

PK: `(home_update_id, media_asset_id)`.

---

### `share_link`
공개 본진 페이지 / QR 링크.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| slug | TEXT UNIQUE NOT NULL | URL의 마지막 segment |
| kind | TEXT | HOME_PAGE / QR_TESTIMONY |
| created_by | UUID FK → user | |
| expires_at | TIMESTAMPTZ | 옵션 |
| revoked_at | TIMESTAMPTZ | 옵션 |
| created_at | TIMESTAMPTZ | |

---

### `qr_token`
QR 간증 수집 토큰.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| token | TEXT UNIQUE NOT NULL | URL-safe random |
| label | TEXT | "우도교회 청년부 QR" |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

---

### `budget` ⭐ 회계
카테고리별 예산 계획. **팀당 카테고리별 1행**.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| category | TEXT NOT NULL | TRANSPORT / LODGING / MEAL / MINISTRY / GIFT / SUPPLIES / MEDICAL / MISC |
| planned_amount | NUMERIC(12,2) NOT NULL | 계획 예산 |
| currency | TEXT DEFAULT 'KRW' | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

`(team_id, category)` UNIQUE.

> 실집행은 expense 테이블을 카테고리로 합산하면 자동 계산.

---

### `expense` ⭐ 회계 — 핵심
개별 지출 / 영수증 한 건. 팀장이 본인 카드/현금으로 사고 올린 모든 항목.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| purchaser_user_id | UUID FK → user | **누가 결제했나** (정산 받을 사람) |
| amount | NUMERIC(12,2) NOT NULL | |
| currency | TEXT DEFAULT 'KRW' | |
| spent_at | TIMESTAMPTZ NOT NULL | 영수증 일시 |
| vendor | TEXT | 가게/업체명 ("OO마트") |
| category | TEXT NOT NULL | budget.category와 동일 enum |
| description | TEXT NOT NULL | "VBS 간식 구매" 등 |
| payment_method | TEXT | PERSONAL_CARD / PERSONAL_CASH / CHURCH_CARD / OTHER |
| receipt_media_id | UUID FK → media_asset NULL | 영수증 사진. media_asset에 별도 visibility=`internal`로 저장 |
| ocr_raw | JSONB | OCR 원본 응답 (검증/재처리용) |
| status | TEXT NOT NULL DEFAULT 'pending' | `pending` / `approved` / `rejected` / `reimbursed` |
| approved_by_user_id | UUID FK → user NULL | 승인자 (보통 회계 또는 팀장) |
| approved_at | TIMESTAMPTZ | |
| rejection_reason | TEXT | |
| reimbursement_id | UUID FK → reimbursement NULL | 정산 시 묶임 |
| checklist_item_id | UUID FK → checklist_item NULL | 준비물과 연결 (옵션) |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스:
- `(team_id, status)` — 회계 검토 대시보드
- `(team_id, purchaser_user_id, status)` — 사람별 정산 대상
- `(team_id, category)` — 예산 비교
- `(team_id, spent_at DESC)` — 타임라인

상태 흐름:
```
pending ──(승인)──► approved ──(정산묶음 생성)──► (reimbursement_id 채워짐)
   │                                              │
   └──(반려)──► rejected                          ▼
                                            (송금 완료)──► reimbursed
```

---

### `reimbursement` ⭐ 회계 — 정산 묶음
한 사람에게 한 번에 송금하는 단위. **승인된 expense들을 받는 사람별로 묶어서 정산.**

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | UUID PK | |
| team_id | UUID FK → team | |
| recipient_user_id | UUID FK → user | 송금 대상 |
| total_amount | NUMERIC(12,2) NOT NULL | 묶인 expense 합계 (denormalized) |
| currency | TEXT DEFAULT 'KRW' | |
| status | TEXT NOT NULL DEFAULT 'draft' | `draft` / `confirmed` / `completed` |
| confirmed_by_user_id | UUID FK → user NULL | 정산 묶음 확정자 (회계) |
| confirmed_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | 실제 송금 완료 시각 |
| transfer_method | TEXT | BANK_TRANSFER / CASH / CHURCH_CARD_OFFSET / OTHER |
| bank_snapshot | JSONB | 송금 시점 계좌 정보 스냅샷 |
| transfer_reference | TEXT | 송금 메모/거래번호 |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

인덱스:
- `(team_id, status)`
- `(team_id, recipient_user_id)`

상태 흐름:
```
draft ──(회계 확정)──► confirmed ──(송금 실행)──► completed
                            │
                            └──(이슈 발견)──► draft (다시 풀기)
```

> draft: 회계가 정산할 항목을 모으고 있는 상태. expense.reimbursement_id 일시 연결.
> confirmed: 송금 직전 잠금. 이 상태에선 묶음 변경 불가.
> completed: 송금 완료. expense.status = `reimbursed`로 일괄 업데이트.

---

### `audit_log`
민감 정보 접근 로그.

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | BIGSERIAL PK | |
| user_id | UUID FK | |
| action | TEXT | "VIEW_EMERGENCY_INFO", "EDIT_MEMBER" |
| target_type | TEXT | "team_member" |
| target_id | TEXT | |
| meta | JSONB | |
| ip_address | INET | |
| created_at | TIMESTAMPTZ | |

---

## 마이그레이션 순서

1. `0001_initial`: organization, user (with bank fields), org_membership
2. `0002_outreach_team`: outreach, team, destination, team_member
3. `0003_planning`: schedule_item, checklist_item
4. `0004_media`: media_asset, media_thumbnail
5. `0005_accounting`: budget, expense, reimbursement ⭐
6. `0006_testimony`: testimony, qr_token
7. `0007_share`: share_link, home_update, home_update_media
8. `0008_audit`: audit_log

---

## 시드 데이터 (개발용)

`backend/scripts/seed.py`가 생성:
- Organization: "우리들교회"
- User: "테스트 팀장" (kakao mock)
- Outreach: "2026 여름 단기선교"
- Team: "우도교회팀"
- 5명의 더미 멤버
- 일정 5개, 준비물 10개, 간증 3개
