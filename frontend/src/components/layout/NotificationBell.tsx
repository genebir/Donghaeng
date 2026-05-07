"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────────────────

type NotificationKind =
  | "expense_approved"
  | "expense_rejected"
  | "expense_resubmitted"
  | "reimbursement_confirmed"
  | "reimbursement_completed"
  | "testimony_new"
  | "member_joined"
  | "home_update_published";

interface Notification {
  id: string;
  kind: NotificationKind;
  team_id: string;
  ref_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

function notificationHref(n: Notification): string | null {
  const base = `/teams/${n.team_id}`;
  switch (n.kind) {
    case "expense_approved":
    case "expense_rejected":
      return n.ref_id ? `${base}/expenses/${n.ref_id}` : null;
    case "expense_resubmitted":
      return n.ref_id ? `${base}/expenses/review` : null;
    case "reimbursement_confirmed":
    case "reimbursement_completed":
      return n.ref_id ? `${base}/reimbursements/${n.ref_id}` : null;
    case "testimony_new":
      return `${base}/testimonies`;
    case "member_joined":
      return `${base}/members`;
    case "home_update_published":
      return `${base}/home-updates`;
    default:
      return null;
  }
}

const KIND_ICON: Record<NotificationKind, string> = {
  expense_approved: "✓",
  expense_rejected: "✕",
  expense_resubmitted: "↺",
  reimbursement_confirmed: "₩",
  reimbursement_completed: "✓",
  testimony_new: "✦",
  member_joined: "＋",
  home_update_published: "≡",
};
const KIND_COLOR: Record<NotificationKind, string> = {
  expense_approved: "text-sage",
  expense_rejected: "text-rust",
  expense_resubmitted: "text-mustard",
  reimbursement_confirmed: "text-ocean",
  reimbursement_completed: "text-sage",
  testimony_new: "text-coral",
  member_joined: "text-ocean",
  home_update_published: "text-ink",
};

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const json = await res.json();
        setCount(json.data?.count ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleMouse = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleMouse);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouse);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) {
      setLoadingList(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data ?? []);
        }
      } catch { /* silent */ }
      finally { setLoadingList(false); }
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setCount(0);
    } catch { /* silent */ }
  };

  const markOneRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch { /* silent */ }
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* 종 버튼 */}
      <button
        onClick={handleOpen}
        aria-label="알림"
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-paper-deep transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 2a5 5 0 0 1 5 5c0 3 1 4 1.5 5h-13C3 11 4 10 4 7a5 5 0 0 1 5-5z" />
          <path d="M7 14a2 2 0 0 0 4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-paper leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-md border border-ink/10 bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <p className="text-body-sm font-medium text-ink">알림</p>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-caption text-ocean hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingList ? (
              <div className="flex flex-col gap-2 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-sm bg-paper-deep" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-body-sm text-ink-mute">새 알림이 없어요.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const href = notificationHref(n);
                  const inner = (
                    <>
                      <span className={`mt-0.5 flex-shrink-0 text-body-sm font-bold ${KIND_COLOR[n.kind]}`}>
                        {KIND_ICON[n.kind]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-body-sm leading-snug ${!n.is_read ? "font-medium text-ink" : "text-ink-soft"}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-caption text-ink-mute truncate">{n.body}</p>
                        )}
                        <p className="mt-1 text-caption text-ink-mute">{formatRelative(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-coral" />
                      )}
                    </>
                  );
                  const baseClass = `flex items-start gap-3 px-4 py-3 border-b border-ink/5 last:border-0 transition-colors ${!n.is_read ? "bg-paper-deep/60" : ""}`;
                  return (
                    <li key={n.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={() => { if (!n.is_read) markOneRead(n.id); setOpen(false); }}
                          className={`${baseClass} hover:bg-paper-deep`}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className={baseClass}>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
