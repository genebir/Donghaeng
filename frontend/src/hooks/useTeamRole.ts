"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface State {
  isAdmin: boolean;
  loaded: boolean;
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
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const me = json?.data;
        if (!me) { setState({ isAdmin: false, loaded: true }); return; }
        const isOrgAdmin =
          me.org_role === "OWNER" || me.org_role === "ADMIN";
        const isDirector = (me.outreach_memberships ?? []).some(
          (om: { role: string }) => om.role === "DIRECTOR"
        );
        const isLeader = (me.team_memberships ?? []).some(
          (tm: { team_id: string; role: string }) =>
            tm.team_id === teamId && tm.role === "LEADER"
        );
        setState({ isAdmin: isOrgAdmin || isDirector || isLeader, loaded: true });
      })
      .catch(() => setState({ isAdmin: false, loaded: true }));
  }, [teamId]);

  return state;
}
