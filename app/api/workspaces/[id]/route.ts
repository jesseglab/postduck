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

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        collections: {
          orderBy: { order: "asc" },
        },
        environments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check access: if team workspace, check team membership; if personal, check ownership
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
    } else {
      if (workspace.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Not workspace owner" },
          { status: 403 }
        );
      }
    }

    // Fetch all requests for collections
    const collections = await prisma.collection.findMany({
      where: { workspaceId: id },
      include: {
        requests: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    // Transform to match expected format
    const requests = collections.flatMap((col) =>
      col.requests.map((req) => ({
        ...req,
        createdAt: req.createdAt.getTime(),
        updatedAt: req.updatedAt.getTime(),
        authExtraction: req.authExtraction || null,
        useAuthSession: req.useAuthSession || null,
      }))
    );

    return NextResponse.json({
      ...workspace,
      collections: collections.map((col) => ({
        ...col,
        createdAt: col.createdAt.getTime(),
        updatedAt: col.updatedAt.getTime(),
      })),
      environments: workspace.environments.map((env) => ({
        ...env,
        createdAt: env.createdAt.getTime(),
        updatedAt: env.updatedAt.getTime(),
        variables: env.variables,
      })),
      requests,
    });
  } catch (error) {
    console.error("Get workspace error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch workspace",
      },
      { status: 500 }
    );
  }
}
