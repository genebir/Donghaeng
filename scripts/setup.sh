#!/usr/bin/env bash
# 동행 — 신규 PC 부트스트랩. 멱등: 여러 번 돌려도 안전.
# 지원: macOS / Linux / WSL2 / Git Bash on Windows.
#
# 하는 일:
#   1) 사전 도구 확인 (git/docker/uv/pnpm/openssl)
#   2) backend/.env, frontend/.env.local 없으면 .env.example에서 생성
#   3) 비어있는 시크릿(JWT_SECRET, BANK_INFO_ENCRYPTION_KEY, NEXTAUTH_SECRET)만 자동 채움
#   4) docker compose up -d 후 postgres healthy 까지 대기
#   5) uv sync + alembic upgrade head
#   6) pnpm install
#
# 이미 채워진 값은 절대 덮어쓰지 않는다.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo $ROOT
cd "$ROOT"

c_info=$'\033[1;36m'
c_warn=$'\033[1;33m'
c_err=$'\033[1;31m'
c_off=$'\033[0m'
log()  { printf "%s[setup]%s %s\n" "$c_info" "$c_off" "$*"; }
warn() { printf "%s[setup]%s %s\n" "$c_warn" "$c_off" "$*" >&2; }
err()  { printf "%s[setup]%s %s\n" "$c_err"  "$c_off" "$*" >&2; }

# ---------------------------------------------------------------------------
# 1) 사전 도구 확인
# ---------------------------------------------------------------------------
require() {
  local cmd=$1 hint=$2
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "'$cmd' 가 PATH에 없음. 설치 후 다시 실행하세요."
    err "  → $hint"
    exit 1
  fi
}

require git     "https://git-scm.com/downloads"
require docker  "https://docs.docker.com/get-docker/"
require uv      "https://docs.astral.sh/uv/getting-started/installation/"
require pnpm    "https://pnpm.io/installation  (또는: corepack enable)"
require openssl "macOS/Linux/WSL 기본 포함. Windows는 git-bash에 포함됨."

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  err "docker compose v2 또는 docker-compose v1 둘 다 없음."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  err "Docker 데몬이 실행 중이 아닙니다. Docker Desktop을 시작한 뒤 다시 실행하세요."
  exit 1
fi

# ---------------------------------------------------------------------------
# 2) .env 파일 준비 (없으면 생성, 있으면 그대로)
# ---------------------------------------------------------------------------
ensure_env_file() {
  local target=$1
  if [[ -f "$target" ]]; then
    log "$target — 이미 있음 (유지)"
  else
    log "$target — .env.example 에서 새로 생성"
    cp .env.example "$target"
  fi
}

ensure_env_file backend/.env
ensure_env_file frontend/.env.local

# ---------------------------------------------------------------------------
# 3) 비어있는 시크릿만 자동 채움 (이미 채워진 값은 절대 건드리지 않음)
# ---------------------------------------------------------------------------
sed_inplace() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# 키의 현재 값을 본다. 비었거나 placeholder("change-me-...") 면 새 값으로 교체.
fill_secret_if_blank() {
  local file=$1 key=$2 new_value=$3
  if ! grep -qE "^${key}=" "$file"; then
    return  # 키 자체가 없으면 무시 (스키마 외 변경은 안 한다)
  fi
  local current
  current=$(grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | sed 's/[[:space:]]*$//')
  case "$current" in
    ""|change-me-*)
      log "  ${key}: 비어있어서 자동 생성"
      # 안전한 sed 구분자: '|' 사용. value에 '|' 들어갈 일 없음 (hex/base64-url).
      sed_inplace "s|^${key}=.*$|${key}=${new_value}|" "$file"
      ;;
    *)
      log "  ${key}: 이미 채워져 있음 (유지)"
      ;;
  esac
}

JWT_NEW=$(openssl rand -hex 32)
NEXTAUTH_NEW=$(openssl rand -base64 32 | tr -d '\n=')
# Fernet 키 — 32바이트 urlsafe base64
FERNET_NEW=$(openssl rand 32 | openssl base64 -A | tr '+/' '-_' | tr -d '=')

log "시크릿 점검 — backend/.env"
fill_secret_if_blank backend/.env JWT_SECRET                "$JWT_NEW"
fill_secret_if_blank backend/.env BANK_INFO_ENCRYPTION_KEY  "$FERNET_NEW"

log "시크릿 점검 — frontend/.env.local"
fill_secret_if_blank frontend/.env.local NEXTAUTH_SECRET    "$NEXTAUTH_NEW"

# .env.example 에 새 키가 추가되었지만 사용자 .env에 없으면 경고
diff_env_keys() {
  local user=$1 source=$2
  local missing
  missing=$(comm -23 \
    <(grep -E '^[A-Z_][A-Z0-9_]*=' "$source" | cut -d= -f1 | sort -u) \
    <(grep -E '^[A-Z_][A-Z0-9_]*=' "$user"   | cut -d= -f1 | sort -u))
  if [[ -n "$missing" ]]; then
    warn "$user 에 없는 새 키들이 .env.example 에 추가됨:"
    while IFS= read -r k; do
      [[ -n "$k" ]] && warn "  - $k"
    done <<< "$missing"
    warn "수동으로 $user 에 추가 후 서비스 재시작 필요."
  fi
}

diff_env_keys backend/.env       .env.example
diff_env_keys frontend/.env.local .env.example

# ---------------------------------------------------------------------------
# 4) Docker 인프라 (postgres :5433, minio :9000/9001)
# ---------------------------------------------------------------------------
log "docker compose up -d"
"${DC[@]}" up -d

log "postgres healthy 대기"
for i in $(seq 1 60); do
  status=$(docker inspect --format '{{.State.Health.Status}}' donghaeng-postgres 2>/dev/null || echo "")
  if [[ "$status" == "healthy" ]]; then
    log "postgres healthy"
    break
  fi
  if [[ "$i" == "60" ]]; then
    err "postgres 가 healthy 가 되지 않음. 'docker logs donghaeng-postgres' 로 확인."
    exit 1
  fi
  sleep 2
done

# ---------------------------------------------------------------------------
# 5) Backend
# ---------------------------------------------------------------------------
log "uv sync (backend)"
( cd backend && uv sync )

log "alembic upgrade head"
( cd backend && uv run alembic upgrade head )

# ---------------------------------------------------------------------------
# 6) Frontend
# ---------------------------------------------------------------------------
log "pnpm install (frontend)"
( cd frontend && pnpm install )

log "✅ setup 완료. 다음: ./scripts/start.sh"
