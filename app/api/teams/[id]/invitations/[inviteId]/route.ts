import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, inviteId } = await params;

    // Check if user has manage permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    if (!canManage(teamMember.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.teamInvitation.delete({
      where: { id: inviteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invitation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete invitation",
      },
      { status: 500 }
    );
  }
}
