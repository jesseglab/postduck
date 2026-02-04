import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canWrite } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const data = await request.json();

    // Check workspace access and permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: workspace.teamId,
            userId: session.user.id,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: "Not a team member" },
          { status: 403 }
        );
      }

      if (!canWrite(teamMember.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    } else {
      if (workspace.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Not workspace owner" },
          { status: 403 }
        );
      }
    }

    const request = await prisma.request.create({
      data: {
        collectionId: data.collectionId,
        name: data.name,
        method: data.method,
        url: data.url || "",
        headers: data.headers || {},
        body: data.body || {},
        authType: data.authType || "none",
        authConfig: data.authConfig || {},
        authExtraction: data.authExtraction || null,
        useAuthSession: data.useAuthSession || null,
        order: data.order || 0,
      },
    });

    return NextResponse.json({
      ...request,
      createdAt: request.createdAt.getTime(),
      updatedAt: request.updatedAt.getTime(),
      authExtraction: request.authExtraction || null,
      useAuthSession: request.useAuthSession || null,
    });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create request",
      },
      { status: 500 }
    );
  }
}
