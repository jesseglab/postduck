import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if email matches
    if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Invitation email does not match your account" },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: session.user.id,
        },
      },
    });

    if (existingMember) {
      // Delete invitation and return success
      await prisma.teamInvitation.delete({
        where: { id: invitation.id },
      });
      return NextResponse.json({ success: true, message: "Already a member" });
    }

    // Create team member
    await prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: invitation.role,
      },
    });

    // Delete invitation
    await prisma.teamInvitation.delete({
      where: { id: invitation.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation",
      },
      { status: 500 }
    );
  }
}
