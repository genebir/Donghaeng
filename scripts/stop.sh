#!/usr/bin/env bash
# 동행 — 로컬 개발 서버 중지. 멱등: 떠 있지 않아도 안전.
#
# 사용:
#   ./scripts/stop.sh         dev 서버만 중지 (docker는 그대로)
#   ./scripts/stop.sh --all   dev 서버 + docker 인프라까지 중지

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

c_info=$'\033[1;36m'
c_off=$'\033[0m'
log() { printf "%s[stop]%s %s\n" "$c_info" "$c_off" "$*"; }

# 자손까지 재귀로 시그널 보냄. pgrep 없는 환경(거의 없음)에서는 직접 자식만.
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
  if [[ ! -f "$pf" ]]; then
    log "$name: pid 파일 없음 — skip"
    return 0
  fi
  local pid
  pid=$(cat "$pf" 2>/dev/null || echo "")
  if [[ -z "$pid" ]]; then
    log "$name: pid 파일 비어있음 — 정리"
    rm -f "$pf"
    return 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    log "$name: pid $pid 이미 없음 — 정리"
    rm -f "$pf"
    return 0
  fi

  log "$name 중지 (pid $pid + 자손 트리)"
  kill_tree -TERM "$pid"

  # graceful 대기 (5초)
  for i in $(seq 1 10); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done

  if kill -0 "$pid" 2>/dev/null; then
    log "$name: SIGTERM 무시 — SIGKILL"
    kill_tree -KILL "$pid"
  fi

  rm -f "$pf"
}

stop_pidfile backend
stop_pidfile frontend

if [[ "${1:-}" == "--all" ]]; then
  if docker compose version >/dev/null 2>&1; then
    DC=(docker compose)
  else
    DC=(docker-compose)
  fi
  log "docker 인프라 중지 (postgres + minio)"
  "${DC[@]}" stop
fi

log "✅ 중지 완료."
