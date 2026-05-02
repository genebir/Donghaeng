import Link from "next/link";
import { signOut } from "@/auth";
import { Wordmark } from "@/components/brand";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";

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

      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserMenu userName={userName} userImage={userImage} signOut={handleSignOut} />
      </div>
    </header>
  );
}
