import Dexie, { Table } from "dexie";
import type {
  Request,
  Collection,
  Environment,
  Workspace,
  RequestHistory,
  AuthSession,
} from "@/types";

export class LocalDatabase extends Dexie {
  workspaces!: Table<Workspace>;
  collections!: Table<Collection>;
  requests!: Table<Request>;
  environments!: Table<Environment>;
  requestHistory!: Table<RequestHistory>;
  authSessions!: Table<AuthSession>;

  constructor() {
    super("PostduckDB");

    this.version(1).stores({
      workspaces: "id, name, isLocal",
      collections: "id, workspaceId, parentId",
      requests: "id, collectionId, order",
      environments: "id, workspaceId, isActive",
      requestHistory: "id, requestId, executedAt",
    });

    this.version(2).stores({
      workspaces: "id, name, isLocal",
      collections: "id, workspaceId, parentId",
      requests: "id, collectionId, order",
      environments: "id, workspaceId, isActive",
      requestHistory: "id, requestId, executedAt",
      authSessions: "id, workspaceId, requestId",
    });
  }
}

export const db = new LocalDatabase();

// Initialize default workspace
export async function initializeDefaultWorkspace() {
  const existing = await db.workspaces.toArray();
  if (existing.length === 0) {
    const defaultWorkspace: Workspace = {
      id: "local-workspace",
      name: "My Workspace",
      isLocal: true,
    };
    await db.workspaces.add(defaultWorkspace);

    // Create default environment
    const defaultEnv: Environment = {
      id: "default-env",
      workspaceId: "local-workspace",
      name: "Default",
      isActive: true,
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.environments.add(defaultEnv);
  }
}

/**
 * Clear all local storage data
 * This will delete all workspaces, collections, requests, environments, request history, and auth sessions
 */
export async function clearLocalStorage(): Promise<void> {
  await db.workspaces.clear();
  await db.collections.clear();
  await db.requests.clear();
  await db.environments.clear();
  await db.requestHistory.clear();
  await db.authSessions.clear();

  // Reinitialize default workspace after clearing
  await initializeDefaultWorkspace();
}
