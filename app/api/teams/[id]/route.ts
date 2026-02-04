import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
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
        },
        invitations: true,
        subscription: true,
        workspaces: {
          include: {
            _count: {
              select: {
                collections: true,
                environments: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is a member
    const member = team.members.find((m) => m.userId === session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    return NextResponse.json({
      ...team,
      currentUserRole: member.role,
    });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch team",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    // Check if user is a member and has manage permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
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

    const updateData: { name?: string; slug?: string } = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if slug already exists
      const existingTeam = await prisma.team.findUnique({
        where: { slug: updateData.slug },
      });

      if (existingTeam && existingTeam.id !== id) {
        return NextResponse.json(
          { error: "Team name already taken" },
          { status: 400 }
        );
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        members: {
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
        },
        subscription: true,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update team",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member and has manage permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
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

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete team",
      },
      { status: 500 }
    );
  }
}
