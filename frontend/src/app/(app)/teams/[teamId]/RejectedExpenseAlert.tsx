"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ExpenseLite {
  purchaser_user_id: string;
  status: string;
}

export function RejectedExpenseAlert() {
  const { teamId } = useParams<{ teamId: string }>();
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/expenses/${teamId}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/users/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([expJson, meJson]) => {
        const expenses: ExpenseLite[] = Array.isArray(expJson)
          ? expJson
          : (expJson?.data ?? []);
        const meId: string | null = meJson?.data?.id ?? null;
        if (meId) {
          setCount(
            expenses.filter(
              (e) => e.purchaser_user_id === meId && e.status === "rejected"
            ).length
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [teamId]);

  if (!loaded || count === 0) return null;

  return (
    <Link
      href={`/teams/${teamId}/expenses?tab=mine&status=rejected`}
      className="mb-6 flex items-center gap-3 rounded-md border border-rust/30 bg-rust/5 px-4 py-3 hover:bg-rust/10 transition-colors"
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-[11px] font-bold text-paper">
        {count > 9 ? "9+" : count}
      </span>
      <p className="flex-1 text-body-sm font-medium text-rust">
        반려된 지출 {count}건 — 수정 후 재제출이 필요해요
      </p>
      <span className="text-caption text-rust/70">확인하기 →</span>
    </Link>
  );
}
