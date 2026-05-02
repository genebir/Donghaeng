import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${API_BASE}/api/v1/expenses/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ message: data.detail ?? "승인에 실패했습니다." }, { status: res.status });
  return NextResponse.json(data);
}
