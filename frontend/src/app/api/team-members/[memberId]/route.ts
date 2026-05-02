import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { memberId } = await params;
  const body = await req.json();
  const res = await fetch(`${API_BASE}/api/v1/team-members/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ message: data.detail ?? "수정 실패" }, { status: res.status });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { memberId } = await params;
  const res = await fetch(`${API_BASE}/api/v1/team-members/${memberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ message: data.detail ?? "삭제 실패" }, { status: res.status });
  }
  return new NextResponse(null, { status: 204 });
}
