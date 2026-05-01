#!/usr/bin/env bash
# 동행 — 로컬 개발 서버 시작. 멱등: 이미 떠 있으면 skip.
#
# 환경변수 override:
#   BACKEND_PORT   기본 8000
#   FRONTEND_PORT  기본 3000
#   BACKEND_HOST   기본 127.0.0.1  (LAN 노출하려면 0.0.0.0)
#
# 사용:
#   ./scripts/start.sh
#   BACKEND_PORT=8001 ./scripts/start.sh   # 포트 충돌 시
#
# 로그/PID:
#   tmp/backend.log,  tmp/backend.pid
#   tmp/frontend.log, tmp/frontend.pid

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"

mkdir -p tmp

c_info=$'\033[1;36m'
c_warn=$'\033[1;33m'
c_err=$'\033[1;31m'
c_off=$'\033[0m'
log()  { printf "%s[start]%s %s\n" "$c_info" "$c_off" "$*"; }
warn() { printf "%s[start]%s %s\n" "$c_warn" "$c_off" "$*" >&2; }
err()  { printf "%s[start]%s %s\n" "$c_err"  "$c_off" "$*" >&2; }

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  err "docker compose 가 없음. ./scripts/setup.sh 먼저 실행."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1) 인프라 (postgres + minio) — 멱등
# ---------------------------------------------------------------------------
pg_state=$(docker inspect --format '{{.State.Status}}' donghaeng-postgres 2>/dev/null || echo "missing")
if [[ "$pg_state" != "running" ]]; then
  log "infra 기동 (postgres + minio)"
  "${DC[@]}" up -d
fi

log "postgres healthy 대기"
for i in $(seq 1 60); do
  status=$(docker inspect --format '{{.State.Health.Status}}' donghaeng-postgres 2>/dev/null || echo "")
  [[ "$status" == "healthy" ]] && break
  if [[ "$i" == "60" ]]; then
    err "postgres 가 healthy 가 되지 않음. 'docker logs donghaeng-postgres' 확인."
    exit 1
  fi
  sleep 2
done

# ---------------------------------------------------------------------------
# 2) PID 파일 + 포트 헬퍼
# ---------------------------------------------------------------------------
is_alive() {
  local pf=$1
  [[ -f "$pf" ]] || return 1
  local pid
  pid=$(cat "$pf" 2>/dev/null || echo "")
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

# bash 빌트인 /dev/tcp — macOS/Linux/WSL/Git Bash 모두 동작.
# 서브셸이 정상 종료되면 (포트가 살아있으면) 0, 아니면 nonzero.
port_in_use() {
  local port=$1
  (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null
}

# ---------------------------------------------------------------------------
# 3) Backend (FastAPI / uvicorn)
# ---------------------------------------------------------------------------
if is_alive tmp/backend.pid; then
  log "backend 이미 실행 중 (pid $(cat tmp/backend.pid)) — skip"
else
  rm -f tmp/backend.pid
  if port_in_use "$BACKEND_PORT"; then
    err "포트 ${BACKEND_PORT} 이 다른 프로세스에 사용 중. BACKEND_PORT=8001 ./scripts/start.sh 식으로 override 하거나, 점유 프로세스 종료 후 재시도."
    exit 1
  fi
  log "backend 시작 — http://${BACKEND_HOST}:${BACKEND_PORT}"
  (
    cd backend
    nohup uv run uvicorn app.main:app \
      --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload \
      > "$ROOT/tmp/backend.log" 2>&1 &
    echo $! > "$ROOT/tmp/backend.pid"
  )
fi

# ---------------------------------------------------------------------------
# 4) Frontend (Next.js / pnpm dev)
# ---------------------------------------------------------------------------
if is_alive tmp/frontend.pid; then
  log "frontend 이미 실행 중 (pid $(cat tmp/frontend.pid)) — skip"
else
  rm -f tmp/frontend.pid
  if port_in_use "$FRONTEND_PORT"; then
    err "포트 ${FRONTEND_PORT} 이 다른 프로세스에 사용 중. FRONTEND_PORT=3001 ./scripts/start.sh 식으로 override."
    exit 1
  fi
  log "frontend 시작 — http://localhost:${FRONTEND_PORT}"
  (
    cd frontend
    nohup pnpm dev --port "$FRONTEND_PORT" \
      > "$ROOT/tmp/frontend.log" 2>&1 &
    echo $! > "$ROOT/tmp/frontend.pid"
  )
fi

# ---------------------------------------------------------------------------
# 5) 헬스 확인 (백엔드 /healthz)
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

✅ 시작 완료.

  Frontend  http://localhost:${FRONTEND_PORT}
  Backend   http://${BACKEND_HOST}:${BACKEND_PORT}
  Docs      http://${BACKEND_HOST}:${BACKEND_PORT}/docs
  Health    http://${BACKEND_HOST}:${BACKEND_PORT}/healthz

  로그:    tail -f tmp/backend.log tmp/frontend.log
  중지:    ./scripts/stop.sh
  전체중지: ./scripts/stop.sh --all   (docker 인프라까지 중지)
EOF
