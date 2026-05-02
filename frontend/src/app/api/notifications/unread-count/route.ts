import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ data: { count: 0 } });

  const res = await fetch(`${API_BASE}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({ data: { count: 0 } }));
  if (!res.ok) return NextResponse.json({ data: { count: 0 } });
  return NextResponse.json(data);
}
