"use client";

import { useState } from "react";

export function ShareLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${slug}`
      : `/share/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/20 bg-paper px-5 text-body-sm font-medium text-ink hover:bg-paper-deep active:translate-y-px transition"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 7l3.5 3.5L12 3" />
          </svg>
          복사됨!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11.5" cy="3" r="1.5" />
            <circle cx="11.5" cy="11" r="1.5" />
            <circle cx="3" cy="7" r="1.5" />
            <path d="M4.4 6.4l5.7-2.7M4.4 7.6l5.7 2.7" />
          </svg>
          공유 링크 복사
        </>
      )}
    </button>
  );
}
