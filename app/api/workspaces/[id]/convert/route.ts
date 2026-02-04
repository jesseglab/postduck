import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Check if user owns the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not workspace owner" },
        { status: 403 }
      );
    }

    // Check if user is a member of the team and has manage permissions
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

    // Convert workspace to team workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: {
        teamId,
        isLocal: false,
        syncedAt: new Date(),
      },
      include: {
        collections: true,
        environments: true,
      },
    });

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error("Convert workspace error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert workspace",
      },
      { status: 500 }
    );
  }
}
