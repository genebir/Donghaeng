"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinButton({ token, teamId }: { token: string; teamId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "joining" | "done" | "already">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setStatus("joining");
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/join`, { method: "POST" });
      const json = await res.json();
      if (res.status === 409) {
        setStatus("already");
        setTimeout(() => router.push(`/teams/${teamId}`), 1200);
        return;
      }
      if (!res.ok) {
        setError(json.message ?? "참여에 실패했어요.");
        setStatus("idle");
        return;
      }
      setStatus("done");
      setTimeout(() => router.push(`/teams/${teamId}`), 1200);
    } catch {
      setError("잠깐 문제가 있었어요. 다시 시도해주세요.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/10 p-4 text-center">
        <p className="text-body font-medium text-sage">참여 완료! 팀 페이지로 이동합니다…</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="rounded-xl border border-ocean/30 bg-ocean/10 p-4 text-center">
        <p className="text-body font-medium text-ocean">이미 팀 멤버입니다. 이동합니다…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-body-sm text-rust">{error}</p>}
      <button
        onClick={handleJoin}
        disabled={status === "joining"}
        className="w-full h-11 rounded-md bg-ink text-body font-medium text-paper transition hover:bg-ink/90 active:translate-y-px disabled:opacity-50"
      >
        {status === "joining" ? "참여 중…" : "이 팀에 참여하기"}
      </button>
    </div>
  );
}
