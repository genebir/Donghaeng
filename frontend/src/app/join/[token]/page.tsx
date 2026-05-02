import Link from "next/link";
import { auth } from "@/auth";
import { JoinButton } from "./JoinButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let info: InviteInfo | null = null;
  try {
    const res = await fetch(`${API_BASE}/api/v1/invite/${token}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      info = json.data ?? null;
    }
  } catch {}

  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="font-display text-h2 tracking-tight text-ink">
              동행<span className="text-coral">.</span>
            </span>
            <span className="text-caption text-ink-mute">아웃리치 플랫폼</span>
          </Link>
        </div>

        {info ? (
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

            <div className="mt-8">
              {session ? (
                <JoinButton token={token} teamId={info.team_id} />
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/join/${token}`)}`}
                  className="block w-full h-11 rounded-md bg-ink text-center text-body font-medium text-paper leading-[44px] transition hover:bg-ink/90 active:translate-y-px"
                >
                  로그인 후 참여하기
                </Link>
              )}
            </div>

            {!session && (
              <p className="mt-4 text-center text-caption text-ink-mute">
                카카오 또는 구글 계정으로 로그인하세요
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-rust/30 bg-rust/10 p-8 text-center">
            <p className="text-h2 font-medium text-rust">초대 링크 오류</p>
            <p className="mt-2 text-body text-ink-soft">
              유효하지 않거나 만료된 초대 링크입니다.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-md border border-ink/20 px-4 text-body-sm text-ink hover:bg-paper-deep"
            >
              로그인 페이지로
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
