"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface State {
  isAdmin: boolean;
  loaded: boolean;
}

// Module-level cache: key = teamId, value = { isAdmin, ts }
// Shared across all hook instances in the same browser tab session.
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { isAdmin: boolean; ts: number }>();

// De-duplicate in-flight fetches so two simultaneous mounts share one request.
const inflight = new Map<string, Promise<boolean>>();

async function resolveAdmin(teamId: string): Promise<boolean> {
  const cached = cache.get(teamId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.isAdmin;
  }

  let req = inflight.get(teamId);
  if (!req) {
    req = fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const me = json?.data;
        if (!me) return false;
        const isOrgAdmin =
          me.org_role === "OWNER" || me.org_role === "ADMIN";
        const isDirector = (me.outreach_memberships ?? []).some(
          (om: { role: string }) => om.role === "DIRECTOR"
        );
        const isStaff = (me.outreach_memberships ?? []).some(
          (om: { role: string; team_id: string | null }) =>
            om.role === "STAFF" && om.team_id === teamId
        );
        const isLeader = (me.team_memberships ?? []).some(
          (tm: { team_id: string; role: string }) =>
            tm.team_id === teamId && tm.role === "LEADER"
        );
        return isOrgAdmin || isDirector || isStaff || isLeader;
      })
      .then((isAdmin) => {
        cache.set(teamId, { isAdmin, ts: Date.now() });
        return isAdmin;
      })
      .finally(() => inflight.delete(teamId));
    inflight.set(teamId, req);
  }
  return req;
}

export function useTeamRole(): State {
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const [state, setState] = useState<State>({ isAdmin: false, loaded: false });

  useEffect(() => {
    if (!teamId) {
      setState({ isAdmin: false, loaded: true });
      return;
    }
    resolveAdmin(teamId)
      .then((isAdmin) => setState({ isAdmin, loaded: true }))
      .catch(() => setState({ isAdmin: false, loaded: true }));
  }, [teamId]);

  return state;
}
