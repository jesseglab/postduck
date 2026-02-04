import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canManage } from "@/lib/permissions";
import type { TeamRole } from "@/types";
import { randomBytes } from "crypto";

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

    // Check if user has manage permissions
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

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        teamId: id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch invitations",
      },
      { status: 500 }
    );
  }
}

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
    const { email, role } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const validRole = role || "COSMIC_OBSERVER";
    if (
      !["SPACE_COMMANDER", "STAR_NAVIGATOR", "COSMIC_OBSERVER"].includes(
        validRole
      )
    ) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user has manage permissions
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

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        user: {
          email: email.toLowerCase(),
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: id,
        email: email.toLowerCase(),
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: id,
        email: email.toLowerCase(),
        role: validRole as TeamRole,
        token,
        expiresAt,
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create invitation",
      },
      { status: 500 }
    );
  }
}
