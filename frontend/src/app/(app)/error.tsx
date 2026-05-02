"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="tracking-overline text-overline uppercase text-ink-mute mb-4">오류</p>
      <h1 className="font-display text-h1 mb-2">
        문제가 발생했어요<span className="text-coral">.</span>
      </h1>
      <p className="text-body text-ink-soft mb-8 max-w-sm">
        일시적인 문제일 수 있어요. 다시 시도하거나 대시보드로 돌아가세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
        >
          다시 시도
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border border-ink/20 px-5 text-body-sm text-ink hover:bg-paper-deep"
        >
          대시보드로
        </Link>
      </div>
    </div>
  );
}
