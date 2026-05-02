import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper text-center px-4">
      <p className="text-overline uppercase tracking-widest text-ink-mute mb-4">404</p>
      <h1 className="font-display text-h1 mb-2">
        페이지를 찾을 수 없어요<span className="text-coral">.</span>
      </h1>
      <p className="text-body text-ink-soft mb-8 max-w-sm">
        주소가 잘못됐거나 삭제된 페이지예요.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center rounded-md bg-ink px-5 text-body-sm font-medium text-paper hover:opacity-80"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
