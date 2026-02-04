import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canWrite } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, collectionId } = await params;
    const updates = await request.json();

    // Check workspace access and permissions
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        workspace: true,
      },
    });

    if (!collection || collection.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const workspace = collection.workspace;

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

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.parentId !== undefined && { parentId: updates.parentId }),
        ...(updates.order !== undefined && { order: updates.order }),
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Update collection error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update collection",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, collectionId } = await params;

    // Check workspace access and permissions
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        workspace: true,
      },
    });

    if (!collection || collection.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    const workspace = collection.workspace;

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

    // Prisma will cascade delete children and requests
    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete collection error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete collection",
      },
      { status: 500 }
    );
  }
}
