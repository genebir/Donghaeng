import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  const res = await fetch(
    `${API_BASE}/api/v1/notifications${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ message: data.detail ?? "불러오기 실패" }, { status: res.status });
  return NextResponse.json(data);
}
