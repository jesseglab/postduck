import type { Request, Collection, Environment, Workspace } from "@/types";

const API_BASE = "/api";

/**
 * Cloud API functions for team workspaces
 * These functions make direct API calls to the server when in team mode
 */

export async function createRequestCloud(
  workspaceId: string,
  request: Omit<Request, "id" | "createdAt" | "updatedAt">
): Promise<Request> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/requests`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create request");
  }

  return response.json();
}

export async function updateRequestCloud(
  workspaceId: string,
  requestId: string,
  updates: Partial<Request>
): Promise<Request> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/requests/${requestId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update request");
  }

  return response.json();
}

export async function deleteRequestCloud(
  workspaceId: string,
  requestId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/requests/${requestId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete request");
  }
}

export async function createCollectionCloud(
  workspaceId: string,
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/collections`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collection),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create collection");
  }

  return response.json();
}

export async function updateCollectionCloud(
  workspaceId: string,
  collectionId: string,
  updates: Partial<Collection>
): Promise<Collection> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/collections/${collectionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update collection");
  }

  return response.json();
}

export async function deleteCollectionCloud(
  workspaceId: string,
  collectionId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/collections/${collectionId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete collection");
  }
}

export async function createEnvironmentCloud(
  workspaceId: string,
  environment: Omit<Environment, "id" | "createdAt" | "updatedAt">
): Promise<Environment> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/environments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(environment),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create environment");
  }

  return response.json();
}

export async function updateEnvironmentCloud(
  workspaceId: string,
  environmentId: string,
  updates: Partial<Environment>
): Promise<Environment> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/environments/${environmentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update environment");
  }

  return response.json();
}

export async function deleteEnvironmentCloud(
  workspaceId: string,
  environmentId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/environments/${environmentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete environment");
  }
}

export async function fetchWorkspaceCloud(workspaceId: string): Promise<
  Workspace & {
    collections: Collection[];
    environments: Environment[];
    requests: Request[];
  }
> {
  const response = await fetch(`${API_BASE}/workspaces/${workspaceId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch workspace");
  }
  return response.json();
}
