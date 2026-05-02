import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ outreachId: string; membershipId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { outreachId, membershipId } = await params;
  const res = await fetch(
    `${API_BASE}/api/v1/outreaches/${outreachId}/members/${membershipId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ message: data.detail ?? "삭제 실패" }, { status: res.status });
  }
  return new NextResponse(null, { status: 204 });
}
