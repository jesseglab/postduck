import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";
import type { TeamRole } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, userId } = await params;
    const { role } = await request.json();

    if (
      !role ||
      !["SPACE_COMMANDER", "STAR_NAVIGATOR", "COSMIC_OBSERVER"].includes(role)
    ) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if requester has manage permissions
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    if (!requesterMember) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    if (!canManage(requesterMember.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prevent removing the last Space Commander
    if (role !== "SPACE_COMMANDER") {
      const targetMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });

      if (targetMember?.role === "SPACE_COMMANDER") {
        const commanderCount = await prisma.teamMember.count({
          where: {
            teamId,
            role: "SPACE_COMMANDER",
          },
        });

        if (commanderCount <= 1) {
          return NextResponse.json(
            { error: "Cannot remove the last Space Commander" },
            { status: 400 }
          );
        }
      }
    }

    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: {
        role: role as TeamRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update member",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId, userId } = await params;

    // Check if requester has manage permissions
    const requesterMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    if (!requesterMember) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    if (!canManage(requesterMember.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prevent removing the last Space Commander
    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (targetMember?.role === "SPACE_COMMANDER") {
      const commanderCount = await prisma.teamMember.count({
        where: {
          teamId,
          role: "SPACE_COMMANDER",
        },
      });

      if (commanderCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last Space Commander" },
          { status: 400 }
        );
      }
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove member",
      },
      { status: 500 }
    );
  }
}
