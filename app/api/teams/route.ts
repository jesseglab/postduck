import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
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
        _count: {
          select: {
            workspaces: true,
          },
        },
      },
    });

    // Add current user's role to each team
    const teamsWithRoles = teams.map((team) => {
      const member = team.members.find((m) => m.userId === session.user.id);
      return {
        ...team,
        currentUserRole: member?.role || null,
      };
    });

    return NextResponse.json(teamsWithRoles);
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch teams",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingTeam = await prisma.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already taken" },
        { status: 400 }
      );
    }

    // Create team with creator as Space Commander
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        members: {
          create: {
            userId: session.user.id,
            role: "SPACE_COMMANDER",
          },
        },
      },
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create team",
      },
      { status: 500 }
    );
  }
}
