#!/usr/bin/env bash
# 동행 — 로컬 개발 서버 재시작.
#
# 기본 동작: dev 서버(backend + frontend)만 재시작. docker 인프라는 그대로.
# --migrate  : 재시작 전에 alembic upgrade head 실행
# --deps     : 재시작 전에 uv sync + pnpm install 실행
# --hard     : docker 인프라까지 내렸다가 다시 올림 (--migrate + --deps 포함)
#
# 사용 예:
#   ./scripts/restart.sh
#   ./scripts/restart.sh --migrate
#   ./scripts/restart.sh --hard
#
# 환경변수 override:
#   BACKEND_PORT   기본 8000
#   FRONTEND_PORT  기본 3000
#   BACKEND_HOST   기본 127.0.0.1

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

c_info=$'\033[1;36m'
c_warn=$'\033[1;33m'
c_err=$'\033[1;31m'
c_off=$'\033[0m'
log()  { printf "%s[restart]%s %s\n" "$c_info" "$c_off" "$*"; }
warn() { printf "%s[restart]%s %s\n" "$c_warn" "$c_off" "$*" >&2; }
err()  { printf "%s[restart]%s %s\n" "$c_err"  "$c_off" "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 플래그 파싱
# ---------------------------------------------------------------------------
OPT_MIGRATE=false
OPT_DEPS=false
OPT_HARD=false

for arg in "$@"; do
  case "$arg" in
    --migrate) OPT_MIGRATE=true ;;
    --deps)    OPT_DEPS=true ;;
    --hard)    OPT_HARD=true; OPT_MIGRATE=true; OPT_DEPS=true ;;
    *) err "알 수 없는 옵션: $arg  (--migrate | --deps | --hard)" ;;
  esac
done

# ---------------------------------------------------------------------------
# docker compose 감지
# ---------------------------------------------------------------------------
if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  err "docker compose 가 없음. ./scripts/setup.sh 먼저 실행."
fi

# ---------------------------------------------------------------------------
# 헬퍼 — PID 트리 종료 (stop.sh 와 동일 로직)
# ---------------------------------------------------------------------------
kill_tree() {
  local sig=$1 pid=$2
  if command -v pgrep >/dev/null 2>&1; then
    local child
    while IFS= read -r child; do
      [[ -n "$child" ]] && kill_tree "$sig" "$child"
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi
  kill "$sig" "$pid" 2>/dev/null || true
}

stop_pidfile() {
  local name=$1
  local pf="tmp/${name}.pid"
  [[ -f "$pf" ]] || { log "$name: 실행 중 아님 — skip"; return 0; }
  local pid
  pid=$(cat "$pf" 2>/dev/null || echo "")
  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$pf"
    return 0
  fi
  log "$name 중지 (pid $pid)"
  kill_tree -TERM "$pid"
  for _ in $(seq 1 10); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill_tree -KILL "$pid"
  fi
  rm -f "$pf"
}

mkdir -p tmp

# ---------------------------------------------------------------------------
# 1) 기존 서버 중지
# ---------------------------------------------------------------------------
log "dev 서버 중지 중..."
stop_pidfile backend
stop_pidfile frontend

# ---------------------------------------------------------------------------
# 2) --hard: docker 인프라 재시작
# ---------------------------------------------------------------------------
if $OPT_HARD; then
  log "docker 인프라 재시작 (--hard)"
  "${DC[@]}" down
  "${DC[@]}" up -d
fi

# ---------------------------------------------------------------------------
# 3) --deps: 의존성 재설치
# ---------------------------------------------------------------------------
if $OPT_DEPS; then
  log "backend 의존성 동기화 (uv sync)"
  (cd backend && uv sync)

  log "frontend 의존성 설치 (pnpm install)"
  (cd frontend && pnpm install)
fi

# ---------------------------------------------------------------------------
# 4) docker 인프라가 healthy 인지 확인 (--hard 아니면 빠르게 통과)
# ---------------------------------------------------------------------------
log "postgres healthy 대기"
for i in $(seq 1 60); do
  status=$(docker inspect --format '{{.State.Health.Status}}' donghaeng-postgres 2>/dev/null || echo "")
  [[ "$status" == "healthy" ]] && break
  if [[ "$i" == "60" ]]; then
    err "postgres 가 healthy 가 되지 않음. 'docker logs donghaeng-postgres' 확인."
  fi
  sleep 2
done

# ---------------------------------------------------------------------------
# 5) --migrate: DB 마이그레이션
# ---------------------------------------------------------------------------
if $OPT_MIGRATE; then
  log "alembic upgrade head"
  (cd backend && uv run alembic upgrade head)
fi

# ---------------------------------------------------------------------------
# 6) Backend 재시작
# ---------------------------------------------------------------------------
log "backend 시작 — http://${BACKEND_HOST}:${BACKEND_PORT}"
(
  cd backend
  nohup uv run uvicorn app.main:app \
    --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload \
    > "$ROOT/tmp/backend.log" 2>&1 &
  echo $! > "$ROOT/tmp/backend.pid"
)

# ---------------------------------------------------------------------------
# 7) Frontend 재시작
# ---------------------------------------------------------------------------
log "frontend 시작 — http://localhost:${FRONTEND_PORT}"
(
  cd frontend
  nohup pnpm dev --port "$FRONTEND_PORT" \
    > "$ROOT/tmp/frontend.log" 2>&1 &
  echo $! > "$ROOT/tmp/frontend.pid"
)

# ---------------------------------------------------------------------------
# 8) 헬스 확인
# ---------------------------------------------------------------------------
log "backend /healthz 응답 대기"
for i in $(seq 1 30); do
  if curl -sf "http://${BACKEND_HOST}:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
    log "backend 응답 OK"
    break
  fi
  if [[ "$i" == "30" ]]; then
    warn "backend 가 60초 안에 응답 안 함. tmp/backend.log 확인."
  fi
  sleep 2
done

cat <<EOF

✅ 재시작 완료.

  Frontend  http://localhost:${FRONTEND_PORT}
  Backend   http://${BACKEND_HOST}:${BACKEND_PORT}
  Docs      http://${BACKEND_HOST}:${BACKEND_PORT}/docs

  로그:    tail -f tmp/backend.log tmp/frontend.log
  중지:    ./scripts/stop.sh
EOF
