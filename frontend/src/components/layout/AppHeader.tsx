import Link from "next/link";
import { signOut } from "@/auth";
import { Wordmark } from "@/components/brand";

interface Props {
  userName: string;
  userImage?: string | null;
}

export async function AppHeader({ userName, userImage }: Props) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink/10 bg-paper px-5 md:px-8">
      <Link href="/dashboard" className="flex items-center">
        <Wordmark size="sm" />
      </Link>

      <div className="flex items-center gap-4">
        <span className="hidden text-body-sm text-ink-soft md:block">{userName}</span>

        {/* 아바타 */}
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt={userName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-caption font-medium text-paper">
            {userName.charAt(0)}
          </div>
        )}

        <form action={handleSignOut}>
          <button
            type="submit"
            className="text-body-sm text-ink-mute underline-offset-4 hover:text-ink hover:underline"
          >
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
