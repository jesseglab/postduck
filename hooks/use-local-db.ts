import { useEffect, useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, initializeDefaultWorkspace } from "@/lib/db/local";
import { useAppStore } from "@/lib/store";
import type {
  Request,
  Collection,
  Environment,
  Workspace,
  AuthSession,
} from "@/types";

export function useLocalDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setRequests, setCollections, setEnvironments, setWorkspace } =
    useAppStore();

  // Refs to track previous values and prevent unnecessary updates
  const prevCollectionsRef = useRef<string>("");
  const prevRequestsRef = useRef<string>("");
  const prevEnvironmentsRef = useRef<string>("");
  const prevWorkspaceRef = useRef<string>("");

  // Initialize database on mount
  useEffect(() => {
    initializeDefaultWorkspace().then(() => {
      setIsInitialized(true);
    });
  }, []);

  // Live queries for reactive updates
  const workspaces = useLiveQuery(() => db.workspaces.toArray(), []) || [];
  const collections = useLiveQuery(() => db.collections.toArray(), []) || [];
  const requests = useLiveQuery(() => db.requests.toArray(), []) || [];
  const environments = useLiveQuery(() => db.environments.toArray(), []) || [];

  // Sync to store - only update if data actually changed
  useEffect(() => {
    if (isInitialized && workspaces.length > 0) {
      const workspaceStr = JSON.stringify(workspaces[0]);
      if (prevWorkspaceRef.current !== workspaceStr) {
        prevWorkspaceRef.current = workspaceStr;
        setWorkspace(workspaces[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, workspaces]);

  useEffect(() => {
    const collectionsStr = JSON.stringify(collections);
    if (prevCollectionsRef.current !== collectionsStr) {
      prevCollectionsRef.current = collectionsStr;
      setCollections(collections as Collection[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections]);

  useEffect(() => {
    const requestsStr = JSON.stringify(requests);
    if (prevRequestsRef.current !== requestsStr) {
      prevRequestsRef.current = requestsStr;
      setRequests(requests as Request[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  useEffect(() => {
    const environmentsStr = JSON.stringify(environments);
    if (prevEnvironmentsRef.current !== environmentsStr) {
      prevEnvironmentsRef.current = environmentsStr;
      setEnvironments(environments as Environment[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments]);

  return {
    isInitialized,
    db,
  };
}

export async function createRequest(
  request: Omit<Request, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  await db.requests.add({
    ...request,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateRequest(
  id: string,
  updates: Partial<Request>
): Promise<void> {
  await db.requests.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteRequest(id: string): Promise<void> {
  await db.requests.delete(id);
}

export async function createCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  await db.collections.add({
    ...collection,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateCollection(
  id: string,
  updates: Partial<Collection>
): Promise<void> {
  await db.collections.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteCollection(id: string): Promise<void> {
  // Recursively delete all child collections first
  const childCollections = await db.collections
    .where("parentId")
    .equals(id)
    .toArray();

  for (const child of childCollections) {
    await deleteCollection(child.id);
  }

  // Delete all requests in this collection
  await db.requests.where("collectionId").equals(id).delete();

  // Finally delete the collection itself
  await db.collections.delete(id);
}

export async function createEnvironment(
  environment: Omit<Environment, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const id = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  await db.environments.add({
    ...environment,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateEnvironment(
  id: string,
  updates: Partial<Environment>
): Promise<void> {
  await db.environments.update(id, { ...updates, updatedAt: Date.now() });
}

export async function setActiveEnvironment(id: string): Promise<void> {
  // Deactivate all environments
  await db.environments.toCollection().modify((env) => {
    env.isActive = env.id === id;
  });
}

/**
 * Move a collection up in the hierarchy (to its parent's level)
 * If it's already at root level, this does nothing
 */
export async function moveCollectionUp(id: string): Promise<void> {
  const collection = await db.collections.get(id);
  if (!collection || !collection.parentId) {
    // Already at root level
    return;
  }

  const parent = await db.collections.get(collection.parentId);
  if (!parent) {
    return;
  }

  // Move to parent's level (use parent's parentId)
  await updateCollection(id, {
    parentId: parent.parentId,
    order: parent.order + 1,
  });
}

/**
 * Move a collection down in the hierarchy (into a sibling folder)
 * Finds the previous sibling and moves into it, or if no sibling, moves into parent
 */
export async function moveCollectionDown(id: string): Promise<void> {
  const collection = await db.collections.get(id);
  if (!collection) {
    return;
  }

  const siblings = await db.collections
    .where("parentId")
    .equals(collection.parentId)
    .toArray();

  // Sort siblings by order
  const sortedSiblings = siblings.sort((a, b) => a.order - b.order);
  const currentIndex = sortedSiblings.findIndex((c) => c.id === id);

  if (currentIndex > 0) {
    // Move into the previous sibling
    const targetSibling = sortedSiblings[currentIndex - 1];
    const maxOrder = await db.collections
      .where("parentId")
      .equals(targetSibling.id)
      .toArray()
      .then((children) =>
        children.length > 0 ? Math.max(...children.map((c) => c.order)) : -1
      );

    await updateCollection(id, {
      parentId: targetSibling.id,
      order: maxOrder + 1,
    });
  } else if (collection.parentId) {
    // If it's the first sibling, move it to be a child of the parent's parent
    // This effectively moves it "down" one level relative to its current position
    const parent = await db.collections.get(collection.parentId);
    if (parent && parent.parentId) {
      const grandparentChildren = await db.collections
        .where("parentId")
        .equals(parent.parentId)
        .toArray();
      const maxOrder =
        grandparentChildren.length > 0
          ? Math.max(...grandparentChildren.map((c) => c.order))
          : -1;

      await updateCollection(id, {
        parentId: parent.parentId,
        order: maxOrder + 1,
      });
    }
  }
}

export async function createAuthSession(
  session: Omit<AuthSession, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const id = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  await db.authSessions.add({
    ...session,
    id,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateAuthSession(
  id: string,
  updates: Partial<AuthSession>
): Promise<void> {
  await db.authSessions.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteAuthSession(id: string): Promise<void> {
  await db.authSessions.delete(id);
}

export async function getAuthSession(
  id: string
): Promise<AuthSession | undefined> {
  return db.authSessions.get(id);
}
