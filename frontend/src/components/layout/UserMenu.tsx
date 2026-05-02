"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  userName: string;
  userImage?: string | null;
  signOut: () => Promise<void>;
}

export function UserMenu({ userName, userImage, signOut }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="계정 메뉴"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-75"
      >
        <span className="hidden text-body-sm text-ink-soft md:block">{userName}</span>
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt={userName} className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent hover:ring-ink/20 transition-all" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-caption font-medium text-paper">
            {userName.charAt(0)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 min-w-[176px] rounded-md border border-ink/10 bg-paper shadow-xl">
          <div className="border-b border-ink/10 px-4 py-3">
            <p className="max-w-[140px] truncate text-body-sm font-medium text-ink">{userName}</p>
          </div>
          <div className="p-1">
            <Link
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-body-sm text-ink hover:bg-paper-deep transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                <circle cx="7.5" cy="4.5" r="2.5" />
                <path d="M1.5 13c0-3.314 2.686-6 6-6s6 2.686 6 6" />
              </svg>
              프로필 설정
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-body-sm text-ink-mute hover:bg-paper-deep hover:text-rust transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10 10.5V13H2V2h8v2.5" />
                  <path d="M6 7.5h7M11 5.5l2.5 2-2.5 2" />
                </svg>
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
