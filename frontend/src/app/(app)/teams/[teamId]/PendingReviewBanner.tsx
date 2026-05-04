"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTeamRole } from "@/hooks/useTeamRole";

export function PendingReviewBanner() {
  const { teamId } = useParams<{ teamId: string }>();
  const { isAdmin, loaded } = useTeamRole();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!loaded || !isAdmin) return;
    fetch(`/api/expenses/${teamId}?status=pending`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const expenses = Array.isArray(json) ? json : (json?.data ?? []);
        setCount(expenses.length);
      })
      .catch(() => {});
  }, [teamId, isAdmin, loaded]);

  if (!loaded || !isAdmin || count === 0) return null;

  return (
    <Link
      href={`/teams/${teamId}/expenses/review`}
      className="mb-6 flex items-center gap-3 rounded-md border border-mustard/30 bg-mustard/8 px-4 py-3 hover:bg-mustard/12 transition-colors"
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-mustard text-[11px] font-bold text-paper">
        {count > 9 ? "9+" : count}
      </span>
      <p className="flex-1 text-body-sm font-medium text-ink">
        지출 검토 대기 {count}건 — 승인이 필요해요
      </p>
      <span className="text-caption text-ink-mute">검토하기 →</span>
    </Link>
  );
}
