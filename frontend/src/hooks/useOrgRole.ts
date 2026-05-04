"use client";

import { useEffect, useState } from "react";

interface State {
  isOrgAdmin: boolean;
  loaded: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let _cached: { isOrgAdmin: boolean; ts: number } | null = null;
let _inflight: Promise<boolean> | null = null;

async function resolveOrgAdmin(): Promise<boolean> {
  if (_cached && Date.now() - _cached.ts < CACHE_TTL_MS) return _cached.isOrgAdmin;
  if (!_inflight) {
    _inflight = fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const me = json?.data;
        if (!me) return false;
        return me.org_role === "OWNER" || me.org_role === "ADMIN";
      })
      .then((isOrgAdmin) => {
        _cached = { isOrgAdmin, ts: Date.now() };
        return isOrgAdmin;
      })
      .finally(() => { _inflight = null; });
  }
  return _inflight;
}

export function useOrgRole(): State {
  const [state, setState] = useState<State>({ isOrgAdmin: false, loaded: false });
  useEffect(() => {
    resolveOrgAdmin()
      .then((isOrgAdmin) => setState({ isOrgAdmin, loaded: true }))
      .catch(() => setState({ isOrgAdmin: false, loaded: true }));
  }, []);
  return state;
}
