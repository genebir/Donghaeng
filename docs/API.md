# API.md — FastAPI 엔드포인트

베이스 경로: `/api/v1`. 모든 응답은 JSON. 인증은 `Authorization: Bearer <jwt>`.

---

## 공통 규칙

### 응답 포맷

성공:
```json
{ "data": { ... } }
```

리스트:
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "page_size": 20, "total": 105 }
}
```

에러 (FastAPI 기본을 살짝 확장):
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "팀장만 수행할 수 있습니다.",
    "details": {}
  }
}
```

### 페이지네이션
쿼리 파라미터: `?page=1&page_size=20`. 기본 20, 최대 100.

### 정렬
`?sort=-created_at` (앞에 `-` 가 내림차순).

---

## 인증

### `POST /api/v1/auth/oauth/exchange`
Next.js의 NextAuth가 OAuth 끝낸 후 발급된 OAuth profile을 백엔드에 넘겨 JWT 발급.

Body:
```json
{
  "provider": "kakao",
  "subject": "1234567890",
  "email": "...",
  "name": "...",
  "profile_image_url": "..."
}
```

Response:
```json
{
  "data": {
    "access_token": "...",
    "token_type": "Bearer",
    "expires_in": 604800,
    "user": { "id": "...", "name": "...", "email": "..." }
  }
}
```

### `GET /api/v1/auth/me`
현재 유저 + 소속 조직/팀 요약.

---

## 조직 (Organization)

### `POST /api/v1/orgs`
새 조직 생성. 호출 유저가 OWNER가 됨.

### `GET /api/v1/orgs/{org_id}`

### `PATCH /api/v1/orgs/{org_id}`
이름/로고/색상 수정. OWNER/DIRECTOR만.

### `GET /api/v1/orgs/{org_id}/members`

### `POST /api/v1/orgs/{org_id}/members/invite`
이메일/카카오로 초대.

---

## 아웃리치 (Outreach)

### `GET /api/v1/orgs/{org_id}/outreaches`
연도별 리스트.

### `POST /api/v1/orgs/{org_id}/outreaches`
새 아웃리치 생성. body에 `clone_from_id` 주면 작년 데이터 복제 (팀 구조 + 체크리스트 템플릿).

### `GET /api/v1/outreaches/{outreach_id}`
아웃리치 상세 + 소속 팀 리스트.

### `PATCH /api/v1/outreaches/{outreach_id}`

---

## 팀 (Team)

### `POST /api/v1/outreaches/{outreach_id}/teams`
팀 생성.

### `GET /api/v1/teams/{team_id}`
팀 상세 (멤버 수, 진행상태 요약).

### `PATCH /api/v1/teams/{team_id}`

### `POST /api/v1/teams/{team_id}/destination`
방문지 정보 설정/수정.

### `POST /api/v1/teams/{team_id}/clone`
다른 팀(보통 작년 같은 위치) 데이터를 이 팀으로 복제.

---

## 멤버 (Team Member)

### `GET /api/v1/teams/{team_id}/members`
역할/파트별 필터.

### `POST /api/v1/teams/{team_id}/members`
직접 추가 (관리자).

### `POST /api/v1/teams/{team_id}/members/invite`
초대 링크 생성.

### `POST /api/v1/teams/join?token=...`
초대 토큰으로 가입.

### `GET /api/v1/team-members/{member_id}`
**응급정보는 LEADER/VICE_LEADER만 조회 가능. audit_log 기록.**

### `PATCH /api/v1/team-members/{member_id}`
본인 또는 LEADER만.

### `PATCH /api/v1/team-members/{member_id}/role`
LEADER만.

### `GET /api/v1/teams/{team_id}/emergency-roster.pdf`
비상연락망 PDF. LEADER만.

---

## 일정 (Schedule)

### `GET /api/v1/teams/{team_id}/schedule?from=...&to=...`

### `POST /api/v1/teams/{team_id}/schedule`

### `PATCH /api/v1/schedule/{item_id}`

### `DELETE /api/v1/schedule/{item_id}`

### `POST /api/v1/teams/{team_id}/schedule/import-template`
"VBS 표준 일정" 같은 템플릿 적용.

---

## 준비물 (Checklist)

### `GET /api/v1/teams/{team_id}/checklist?category=&status=`

### `POST /api/v1/teams/{team_id}/checklist`

### `PATCH /api/v1/checklist/{item_id}`

### `DELETE /api/v1/checklist/{item_id}`

### `GET /api/v1/checklist/templates`
미리 정의된 템플릿 (시스템 + 조직별 커스텀).

### `POST /api/v1/teams/{team_id}/checklist/import-template`

---

## 미디어 (Media) ⭐

### `POST /api/v1/teams/{team_id}/media/presign`
업로드용 presigned URL 발급.

Request:
```json
{
  "filename": "IMG_1234.jpg",
  "mime_type": "image/jpeg",
  "byte_size": 4823923
}
```

Response:
```json
{
  "data": {
    "media_id": "...",
    "upload_url": "https://r2...",
    "method": "PUT",
    "headers": { "Content-Type": "image/jpeg" },
    "expires_in": 600
  }
}
```

### `POST /api/v1/media/{media_id}/complete`
업로드 완료 알림 → 백엔드가 메타 검증 + 백그라운드 처리 큐잉.

### `GET /api/v1/teams/{team_id}/media`
필터: `?date=2026-07-15&kind=photo&selected=true&visibility=team&uploader_id=...`.

### `GET /api/v1/media/{media_id}`
서명된 URL 포함 응답 (24h 만료).

### `PATCH /api/v1/media/{media_id}`
태그, 가시성, is_selected 토글.

### `DELETE /api/v1/media/{media_id}`
업로더 본인 또는 LEADER만.

### `POST /api/v1/teams/{team_id}/media/bulk`
일괄 작업: 가시성 변경, 셀렉, 태그 추가, 다운로드 ZIP.

---

## 간증 / 기도제목 (Testimony)

### `GET /api/v1/teams/{team_id}/testimonies?kind=&visibility=`

### `POST /api/v1/teams/{team_id}/testimonies`
인증된 멤버용.

### `PATCH /api/v1/testimonies/{id}`

### `DELETE /api/v1/testimonies/{id}`

### QR 폼 (퍼블릭)
- `GET /api/v1/qr/{token}` — 토큰 검증, 폼 메타 (팀 이름 등) 반환.
- `POST /api/v1/qr/{token}/submit` — 익명 간증 제출.
  ```json
  {
    "kind": "PRAYER",
    "content": "...",
    "author_display_name": "우도교회 학생"
  }
  ```
  Rate limit: IP당 분당 3회.

### `POST /api/v1/teams/{team_id}/qr-tokens`
QR 토큰 생성 (라벨, 만료일 옵션).

---

## 본진 공유 (Home Updates)

### `GET /api/v1/teams/{team_id}/home-updates`
관리자용 (draft 포함).

### `POST /api/v1/teams/{team_id}/home-updates`

### `PATCH /api/v1/home-updates/{id}`

### `POST /api/v1/home-updates/{id}/publish`

### 공개 페이지 (인증 불필요)
- `GET /api/v1/share/{slug}` — 팀 공개 메타 + 발행된 home_update 리스트.
- `GET /api/v1/share/{slug}/updates/{update_id}` — 단건 + 미디어.

---

## 회계 (Accounting) ⭐

### 예산 (Budget)

#### `GET /api/v1/teams/{team_id}/budget`
카테고리별 예산 + 실집행(승인된 expense 합산) 한 번에 반환.

Response:
```json
{
  "data": [
    {
      "category": "MEAL",
      "planned_amount": "1500000",
      "spent_approved": "832500",
      "spent_pending": "120000",
      "remaining": "547500",
      "currency": "KRW"
    },
    ...
  ],
  "meta": { "total_planned": "8000000", "total_spent": "..." }
}
```

#### `PUT /api/v1/teams/{team_id}/budget`
카테고리별 예산 일괄 설정 (upsert).

---

### 지출 (Expense)

#### `POST /api/v1/teams/{team_id}/expenses`
지출 등록.

Request:
```json
{
  "amount": "45000",
  "currency": "KRW",
  "spent_at": "2026-07-15T14:23:00+09:00",
  "vendor": "OO마트",
  "category": "MEAL",
  "description": "VBS 둘째날 간식",
  "payment_method": "PERSONAL_CARD",
  "receipt_media_id": "uuid-or-null",
  "checklist_item_id": "uuid-or-null",
  "ocr_raw": { ... }
}
```

`purchaser_user_id`는 자동으로 현재 유저로 설정.
다른 사람 대신 등록(예: 팀원이 영수증 사진만 보내고 회계가 등록)은 LEADER/FINANCE만 가능, body에 `purchaser_user_id` 포함.

#### `POST /api/v1/teams/{team_id}/expenses/ocr`
영수증 OCR 처리. 클라이언트에서 사진 → presigned 업로드 → 이 API 호출.

Request:
```json
{ "media_id": "uuid" }
```

Response:
```json
{
  "data": {
    "amount": "45000",
    "vendor": "OO마트",
    "spent_at": "2026-07-15T14:23:00+09:00",
    "raw": { ... },
    "confidence": 0.92
  }
}
```

#### `GET /api/v1/teams/{team_id}/expenses`
필터: `?status=&category=&purchaser_user_id=&from=&to=&payment_method=`.
일반 팀원은 자동으로 본인 것만 (백엔드 필터).

#### `GET /api/v1/expenses/{expense_id}`
영수증 미디어 서명 URL 포함.

#### `PATCH /api/v1/expenses/{expense_id}`
- 등록자 본인: status가 `pending` 또는 `rejected`일 때만 수정 가능
- LEADER/FINANCE: 언제든 수정 가능 (단 reimbursed 상태는 잠금)

#### `DELETE /api/v1/expenses/{expense_id}`
등록자 본인(pending만) 또는 LEADER/FINANCE.

#### `POST /api/v1/expenses/{expense_id}/approve`
LEADER/FINANCE만. body 비워도 됨.

#### `POST /api/v1/expenses/{expense_id}/reject`
```json
{ "reason": "영수증 사진 흐림. 재촬영 부탁드려요." }
```
등록자에게 알림.

#### `POST /api/v1/teams/{team_id}/expenses/bulk-approve`
```json
{ "expense_ids": ["uuid1", "uuid2", ...] }
```

---

### 정산 (Reimbursement)

#### `POST /api/v1/teams/{team_id}/reimbursements/preview`
승인된 expense들을 결제자별로 그룹핑한 미리보기 (DB 변경 없음).

Response:
```json
{
  "data": [
    {
      "recipient": {
        "user_id": "uuid",
        "name": "김OO",
        "bank": { "bank_name": "국민", "account_number": "12345-67-890123", "holder": "김OO" }
      },
      "expenses": [ { "id": "uuid", "amount": "45000", "category": "MEAL", ... }, ... ],
      "total_amount": "585500",
      "by_category": { "MEAL": "342500", "SUPPLIES": "198000", ... },
      "currency": "KRW"
    },
    ...
  ]
}
```

#### `POST /api/v1/teams/{team_id}/reimbursements`
실제 정산 묶음 생성 (`draft` 상태). 미리보기 결과를 토대로 일괄 생성.

Request:
```json
{ "include_expense_ids": ["uuid1", ...] }
```
없으면 모든 승인 + 미정산 expense 자동 포함.

#### `GET /api/v1/teams/{team_id}/reimbursements`
필터: `?status=&recipient_user_id=`.

#### `GET /api/v1/reimbursements/{reimbursement_id}`
묶인 expense 리스트 + 총액 + 송금 정보 포함.

#### `PATCH /api/v1/reimbursements/{reimbursement_id}`
draft 상태일 때 expense 추가/제거.

#### `POST /api/v1/reimbursements/{reimbursement_id}/confirm`
draft → confirmed. 잠금.

#### `POST /api/v1/reimbursements/{reimbursement_id}/complete`
실제 송금 후 호출. confirmed → completed. 묶인 expense.status를 `reimbursed`로 일괄 업데이트.

```json
{
  "transfer_method": "BANK_TRANSFER",
  "transfer_reference": "2026-07-30 14:23 송금완료",
  "notes": ""
}
```

#### `POST /api/v1/reimbursements/{reimbursement_id}/reopen`
completed → draft (실수 정정용). audit_log 필수. LEADER만.

---

### 보고서 (Reports)

#### `GET /api/v1/teams/{team_id}/reports/accounting.xlsx`
Excel 다운로드. 시트 3개 (전체 지출 / 카테고리별 / 인별 정산).

#### `GET /api/v1/teams/{team_id}/reports/reimbursement/{id}.pdf`
한 사람의 정산 PDF.

#### `GET /api/v1/teams/{team_id}/reports/receipts.zip`
영수증 사진 일괄 ZIP + meta.csv.

---

## 결산 (Retrospective, Phase 4)

- `POST /api/v1/teams/{team_id}/retrospective/generate` — 셀렉된 미디어 + 발행된 간증 모아서 결산 리소스 패키지 생성.
- `GET /api/v1/teams/{team_id}/retrospective/booklet.pdf` — 자동 생성된 책자.

---

## 권한 매트릭스 (요약)

조직 시스템 권한: `OWNER` / `ADMIN` / `MEMBER`
팀 역할: `LEADER` / `MEMBER`
파트: `MEDIA` / `WORSHIP` / `TEACHER` / `FINANCE` / `MEDICAL` / `GENERAL`

| 작업 | OWNER | ADMIN | LEADER | FINANCE 파트 | MEDIA 파트장 | 일반 팀원 |
|---|---|---|---|---|---|---|
| 조직 설정 | ✅ | — | — | — | — | — |
| 아웃리치 / 팀 생성 | ✅ | ✅ | — | — | — | — |
| 팀 정보 수정 | ✅ | ✅ | ✅ | — | — | — |
| 멤버 추가 / 역할 변경 | ✅ | ✅ | ✅ | — | — | — |
| 응급정보 조회 | ✅ | ✅ | ✅ | — | — | — |
| 일정 / 준비물 편집 | ✅ | ✅ | ✅ | — | — | — |
| 미디어 업로드 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 미디어 셀렉 / 일괄 작업 | ✅ | ✅ | ✅ | — | ✅ | — |
| 본진 게시물 발행 | ✅ | ✅ | ✅ | — | ✅ | — |
| 간증 작성 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 간증 가시성 변경 | ✅ | ✅ | ✅ | — | — | — |
| 본인 지출 등록 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 모든 지출 조회 | ✅ | ✅ | ✅ | ✅ | — | — |
| 지출 승인 / 반려 | ✅ | ✅ | ✅ | ✅ | — | — |
| 정산 묶음 처리 | ✅ | ✅ | ✅ | ✅ | — | — |
| 송금 완료 처리 | ✅ | ✅ | ✅ | ✅ | — | — |
| 계좌정보 조회 (본인 외) | ✅ (감사) | ✅ (감사) | ✅ (정산 시) | ✅ (정산 시) | — | — |
| 회계 보고서 다운로드 | ✅ | ✅ | ✅ | ✅ | — | — |

---

## OpenAPI

FastAPI가 자동 생성하는 `/api/v1/openapi.json` 활용.
Phase 4에서 `openapi-typescript`로 프론트 타입 자동 생성 도입.
