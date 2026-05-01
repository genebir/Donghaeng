import { signIn } from "@/auth";
import { PixelHero, PixelDivider, Wordmark } from "@/components/brand";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
  OAuthSignin: "소셜 로그인을 시작할 수 없습니다.",
  AccessDenied: "접근이 거부되었습니다.",
  Default: "로그인에 실패했습니다. 다시 시도해주세요.",
};

interface Props {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMsg = params.error
    ? (ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.Default)
    : null;
  const callbackUrl = params.callbackUrl ?? "/dashboard";

  async function signInWithKakao() {
    "use server";
    await signIn("kakao", { redirectTo: callbackUrl });
  }

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight text-paper">
      {/* 픽셀 히어로 배경 */}
      <PixelHero className="absolute right-[-4rem] top-[-4rem] hidden h-[32rem] w-[32rem] opacity-20 md:block" />

      <div className="relative mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-16">
        {/* 워드마크 */}
        <div className="mb-12">
          <Wordmark size="md" />
        </div>

        {/* 헤드라인 */}
        <div className="mb-10 w-full text-center">
          <p className="tracking-overline text-overline uppercase text-ci-gray">
            우리들교회 단기선교
          </p>
          <h1 className="font-display mt-3 text-h1 text-paper">
            함께 걷는 여름<span className="text-coral">.</span>
          </h1>
          <p className="mt-3 text-body text-ci-gray">
            소셜 계정으로 로그인하면 바로 시작합니다.
          </p>
        </div>

        {/* 오류 메시지 */}
        {errorMsg && (
          <div className="mb-6 w-full rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-body-sm text-paper">
            {errorMsg}
          </div>
        )}

        {/* 로그인 버튼 */}
        <div className="flex w-full flex-col gap-3">
          {/* 카카오 */}
          <form action={signInWithKakao}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-md bg-[#FEE500] px-5 py-3 text-body font-medium text-[#191919] transition-opacity hover:opacity-90 active:translate-y-px"
            >
              <KakaoIcon />
              카카오로 계속하기
            </button>
          </form>

          {/* 구글 */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-md border border-paper/20 bg-paper/10 px-5 py-3 text-body font-medium text-paper transition-opacity hover:bg-paper/20 active:translate-y-px"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>
          </form>
        </div>

        {/* 하단 픽셀 디바이더 */}
        <div className="mt-16 w-full text-ci-gray">
          <PixelDivider />
        </div>
        <p className="mt-4 text-caption text-ci-gray">
          © {new Date().getFullYear()} 동행 — 우리들교회
        </p>
      </div>
    </main>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.373c0 2.1 1.392 3.942 3.492 4.98l-.888 3.306a.234.234 0 0 0 .36.252L8.232 13.5c.255.024.513.036.768.036 4.142 0 7.5-2.634 7.5-5.874 0-3.24-3.358-5.873-7.5-5.873z"
        fill="#191919"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
