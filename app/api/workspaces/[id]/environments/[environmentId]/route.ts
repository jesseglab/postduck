import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { canWrite } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; environmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, environmentId } = await params;
    const updates = await request.json();

    // Check workspace access and permissions
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      include: {
        workspace: true,
      },
    });

    if (!environment || environment.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Environment not found" },
        { status: 404 }
      );
    }

    const workspace = environment.workspace;

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

    // If setting as active, deactivate others
    if (updates.isActive === true) {
      await prisma.environment.updateMany({
        where: {
          workspaceId,
          id: { not: environmentId },
        },
        data: {
          isActive: false,
        },
      });
    }

    const updated = await prisma.environment.update({
      where: { id: environmentId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.variables !== undefined && {
          variables: updates.variables,
        }),
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.getTime(),
      updatedAt: updated.updatedAt.getTime(),
      variables: updated.variables,
    });
  } catch (error) {
    console.error("Update environment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update environment",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; environmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, environmentId } = await params;

    // Check workspace access and permissions
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      include: {
        workspace: true,
      },
    });

    if (!environment || environment.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Environment not found" },
        { status: 404 }
      );
    }

    const workspace = environment.workspace;

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

    await prisma.environment.delete({
      where: { id: environmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete environment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete environment",
      },
      { status: 500 }
    );
  }
}
