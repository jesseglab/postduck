import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canWrite } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, requestId } = await params;
    const updates = await request.json();

    // Check workspace access and permissions
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        collection: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!req || req.collection.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const workspace = req.collection.workspace;

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

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.method !== undefined && { method: updates.method }),
        ...(updates.url !== undefined && { url: updates.url }),
        ...(updates.headers !== undefined && { headers: updates.headers }),
        ...(updates.body !== undefined && { body: updates.body }),
        ...(updates.authType !== undefined && { authType: updates.authType }),
        ...(updates.authConfig !== undefined && {
          authConfig: updates.authConfig,
        }),
        ...(updates.authExtraction !== undefined && {
          authExtraction: updates.authExtraction,
        }),
        ...(updates.useAuthSession !== undefined && {
          useAuthSession: updates.useAuthSession,
        }),
        ...(updates.order !== undefined && { order: updates.order }),
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
      authExtraction: updated.authExtraction || null,
      useAuthSession: updated.useAuthSession || null,
    });
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update request",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, requestId } = await params;

    // Check workspace access and permissions
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        collection: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!req || req.collection.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const workspace = req.collection.workspace;

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

    await prisma.request.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete request error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete request",
      },
      { status: 500 }
    );
  }
}
