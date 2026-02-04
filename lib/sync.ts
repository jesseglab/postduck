import { db } from "./db/local";
import { prisma } from "./db/prisma";
import type { Request, Collection, Environment, Workspace } from "@/types";

/**
 * Sync local IndexedDB data to MySQL
 */
export async function syncToCloud(userId: string) {
  const localWorkspace = await db.workspaces
    .where("isLocal")
    .equals(true)
    .first();
  if (!localWorkspace) return;

  // Get or create cloud workspace
  let cloudWorkspace = await prisma.workspace.findFirst({
    where: { userId, name: localWorkspace.name },
  });

  if (!cloudWorkspace) {
    cloudWorkspace = await prisma.workspace.create({
      data: {
        userId,
        name: localWorkspace.name,
        isLocal: false,
        syncedAt: new Date(),
      },
    });
  }

  // Sync collections
  const localCollections = await db.collections.toArray();
  for (const localCol of localCollections) {
    await prisma.collection.upsert({
      where: { id: localCol.id },
      create: {
        id: localCol.id,
        workspaceId: cloudWorkspace.id,
        parentId: localCol.parentId,
        name: localCol.name,
        order: localCol.order,
        createdAt: new Date(localCol.createdAt),
        updatedAt: new Date(localCol.updatedAt),
      },
      update: {
        name: localCol.name,
        parentId: localCol.parentId,
        order: localCol.order,
        updatedAt: new Date(localCol.updatedAt),
      },
    });
  }

  // Sync requests
  const localRequests = await db.requests.toArray();
  for (const localReq of localRequests) {
    await prisma.request.upsert({
      where: { id: localReq.id },
      create: {
        id: localReq.id,
        collectionId: localReq.collectionId,
        name: localReq.name,
        method: localReq.method,
        url: localReq.url,
        headers: localReq.headers as any,
        body: localReq.body as any,
        authType: localReq.authType,
        authConfig: localReq.authConfig as any,
        order: localReq.order,
        createdAt: new Date(localReq.createdAt),
        updatedAt: new Date(localReq.updatedAt),
      },
      update: {
        name: localReq.name,
        method: localReq.method,
        url: localReq.url,
        headers: localReq.headers as any,
        body: localReq.body as any,
        authType: localReq.authType,
        authConfig: localReq.authConfig as any,
        order: localReq.order,
        updatedAt: new Date(localReq.updatedAt),
      },
    });
  }

  // Sync environments
  const localEnvs = await db.environments.toArray();
  for (const localEnv of localEnvs) {
    await prisma.environment.upsert({
      where: { id: localEnv.id },
      create: {
        id: localEnv.id,
        workspaceId: cloudWorkspace.id,
        name: localEnv.name,
        isActive: localEnv.isActive,
        variables: localEnv.variables as any,
        createdAt: new Date(localEnv.createdAt),
        updatedAt: new Date(localEnv.updatedAt),
      },
      update: {
        name: localEnv.name,
        isActive: localEnv.isActive,
        variables: localEnv.variables as any,
        updatedAt: new Date(localEnv.updatedAt),
      },
    });
  }

  // Update sync timestamp
  await prisma.workspace.update({
    where: { id: cloudWorkspace.id },
    data: { syncedAt: new Date() },
  });
}

/**
 * Sync cloud MySQL data to local IndexedDB
 */
export async function syncFromCloud(userId: string) {
  const cloudWorkspaces = await prisma.workspace.findMany({
    where: { userId },
    include: {
      collections: {
        include: { requests: true },
      },
      environments: true,
    },
  });

  if (cloudWorkspaces.length === 0) return;

  const cloudWorkspace = cloudWorkspaces[0];
  const localWorkspace = await db.workspaces
    .where("isLocal")
    .equals(true)
    .first();

  // Sync collections
  for (const cloudCol of cloudWorkspace.collections) {
    await db.collections.put({
      id: cloudCol.id,
      workspaceId: localWorkspace?.id || "local-workspace",
      parentId: cloudCol.parentId || null,
      name: cloudCol.name,
      order: cloudCol.order,
      createdAt: cloudCol.createdAt.getTime(),
      updatedAt: cloudCol.updatedAt.getTime(),
    });
  }

  // Sync requests
  for (const cloudCol of cloudWorkspace.collections) {
    for (const cloudReq of cloudCol.requests) {
      await db.requests.put({
        id: cloudReq.id,
        collectionId: cloudReq.collectionId,
        name: cloudReq.name,
        method: cloudReq.method as any,
        url: cloudReq.url,
        headers: cloudReq.headers as any,
        body: cloudReq.body as any,
        authType: cloudReq.authType as any,
        authConfig: cloudReq.authConfig as any,
        order: cloudReq.order,
        createdAt: cloudReq.createdAt.getTime(),
        updatedAt: cloudReq.updatedAt.getTime(),
      });
    }
  }

  // Sync environments
  for (const cloudEnv of cloudWorkspace.environments) {
    await db.environments.put({
      id: cloudEnv.id,
      workspaceId: localWorkspace?.id || "local-workspace",
      name: cloudEnv.name,
      isActive: cloudEnv.isActive,
      variables: cloudEnv.variables as any,
      createdAt: cloudEnv.createdAt.getTime(),
      updatedAt: cloudEnv.updatedAt.getTime(),
    });
  }
}
