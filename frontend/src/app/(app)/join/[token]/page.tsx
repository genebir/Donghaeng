"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface InviteInfo {
  token: string;
  team_id: string;
  team_name: string;
  outreach_name: string;
  starts_on: string | null;
  ends_on: string | null;
  description: string | null;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "joining" | "done" | "error" | "already">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) {
          setErrorMsg(json.message ?? "유효하지 않은 초대 링크입니다.");
          setStatus("error");
        } else {
          setInfo(json.data);
          setStatus("ready");
        }
      })
      .catch(() => {
        setErrorMsg("초대 링크를 불러오지 못했어요.");
        setStatus("error");
      });
  }, [token]);

  async function handleJoin() {
    setStatus("joining");
    try {
      const res = await fetch(`/api/invite/${token}/join`, { method: "POST" });
      const json = await res.json();
      if (res.status === 409) {
        setStatus("already");
        setTimeout(() => router.push(`/teams/${info!.team_id}`), 1500);
        return;
      }
      if (!res.ok) {
        setErrorMsg(json.message ?? "참여에 실패했어요.");
        setStatus("error");
        return;
      }
      setStatus("done");
      setTimeout(() => router.push(`/teams/${json.data.team_id}`), 1200);
    } catch {
      setErrorMsg("잠깐 문제가 있었어요. 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="h-6 w-32 rounded bg-paper-deep animate-pulse" />
            <div className="h-10 w-full rounded bg-paper-deep animate-pulse" />
            <div className="h-4 w-48 rounded bg-paper-deep animate-pulse" />
          </div>
        )}

        {(status === "ready" || status === "joining") && info && (
          <div className="rounded-xl border border-ink/10 bg-paper p-8 shadow-sm">
            <p className="tracking-overline text-overline uppercase text-ink-mute">팀 초대</p>
            <h1 className="font-display mt-1 text-h1">
              {info.team_name}<span className="text-coral">.</span>
            </h1>
            <p className="mt-1 text-body-sm text-ink-mute">{info.outreach_name}</p>

            {(info.starts_on || info.ends_on) && (
              <p className="mt-3 text-body-sm text-ink-soft">
                {formatDate(info.starts_on)}
                {info.starts_on && info.ends_on && " — "}
                {formatDate(info.ends_on)}
              </p>
            )}

            {info.description && (
              <p className="mt-3 text-body text-ink-soft">{info.description}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={status === "joining"}
              className="mt-8 w-full h-11 rounded-md bg-ink text-body font-medium text-paper transition hover:bg-ink/90 active:translate-y-px disabled:opacity-50"
            >
              {status === "joining" ? "참여 중…" : "이 팀에 참여하기"}
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="rounded-xl border border-sage/30 bg-sage/10 p-8 text-center">
            <p className="text-h2 font-medium text-sage">참여 완료!</p>
            <p className="mt-2 text-body text-ink-soft">팀 페이지로 이동합니다…</p>
          </div>
        )}

        {status === "already" && (
          <div className="rounded-xl border border-ocean/30 bg-ocean/10 p-8 text-center">
            <p className="text-h2 font-medium text-ocean">이미 팀 멤버입니다</p>
            <p className="mt-2 text-body text-ink-soft">팀 페이지로 이동합니다…</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-rust/30 bg-rust/10 p-8 text-center">
            <p className="text-h2 font-medium text-rust">초대 링크 오류</p>
            <p className="mt-2 text-body text-ink-soft">{errorMsg}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep"
            >
              대시보드로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
