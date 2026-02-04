import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

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

    // Check if user is a member
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

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
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
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch members",
      },
      { status: 500 }
    );
  }
}
