"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface CheckItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
  action: string;
}

export function TeamOnboarding() {
  const { teamId } = useParams<{ teamId: string }>();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [dismissed, setDismissed] = useState(true); // start hidden until data loads
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `onboarding-dismissed-${teamId}`;
    if (localStorage.getItem(key)) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/users/me").then((r) => r.json()),
      fetch(`/api/teams/${teamId}/members`).then((r) => r.json()),
    ])
      .then(([meJson, membersJson]) => {
        const me = meJson.data;
        const members: { user: { id: string }; emergency_info: Record<string, string> | null }[] =
          membersJson.data ?? [];
        const myMember = members.find((m) => m.user.id === me?.id);

        const hasEmergency =
          myMember?.emergency_info !== null &&
          Object.values(myMember?.emergency_info ?? {}).some((v) => String(v ?? "").trim() !== "");
        const hasBank = !!me?.bank_account_number_masked;
        const hasPhone = !!me?.phone;

        const checkItems: CheckItem[] = [
          {
            key: "emergency",
            label: "응급 정보",
            done: !!hasEmergency,
            href: `/teams/${teamId}/members?openEmergency=1`,
            action: "입력하기",
          },
          {
            key: "bank",
            label: "계좌 정보",
            done: !!hasBank,
            href: "/settings/profile",
            action: "입력하기",
          },
          {
            key: "phone",
            label: "연락처",
            done: !!hasPhone,
            href: "/settings/profile",
            action: "입력하기",
          },
        ];

        setItems(checkItems);
        const allDone = checkItems.every((c) => c.done);
        if (allDone) {
          localStorage.setItem(key, "1");
          setDismissed(true);
        } else {
          setDismissed(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading || dismissed) return null;

  const pending = items.filter((c) => !c.done);
  if (pending.length === 0) return null;

  return (
    <div className="mb-6 rounded-md border border-mustard/30 bg-mustard/8 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-body-sm font-medium text-ink">
            출발 전 입력해주세요 — {pending.length}가지 남았어요
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pending.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-md border border-mustard/40 bg-paper px-3 py-1.5 text-caption font-medium text-ink hover:border-mustard/70 transition-colors"
                >
                  <span className="text-mustard">!</span>
                  {item.label} {item.action}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(`onboarding-dismissed-${teamId}`, "1");
            setDismissed(true);
          }}
          className="flex-shrink-0 rounded p-1 text-ink-mute hover:text-ink hover:bg-mustard/10 transition-colors"
          aria-label="닫기"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
