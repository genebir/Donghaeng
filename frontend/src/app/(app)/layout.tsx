import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader, AppSidebar, MobileTabbar } from "@/components/layout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <AppHeader
        userName={session.user.name ?? "팀원"}
        userImage={session.user.image}
      />

      <div className="flex flex-1">
        <AppSidebar />

        <main className="flex-1 overflow-auto p-5 pb-28 md:p-8 md:pb-8">
          {children}
        </main>
      </div>

      <MobileTabbar />
    </div>
  );
}
