import type { TeamRole } from "@/types";

export const PERMISSIONS = {
  SPACE_COMMANDER: [
    "manage:team",
    "manage:billing",
    "write:all",
    "read:all",
    "execute:all",
  ],
  STAR_NAVIGATOR: ["write:all", "read:all", "execute:all"],
  COSMIC_OBSERVER: ["read:all", "execute:all"],
} as const;

export type Permission =
  | "manage:team"
  | "manage:billing"
  | "write:all"
  | "read:all"
  | "execute:all";

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS[role];
  return rolePermissions.includes(permission);
}

/**
 * Check if a role can write/edit resources
 */
export function canWrite(role: TeamRole | null | undefined): boolean {
  if (!role) return false;
  return hasPermission(role, "write:all");
}

/**
 * Check if a role can manage team settings
 */
export function canManage(role: TeamRole | null | undefined): boolean {
  if (!role) return false;
  return hasPermission(role, "manage:team");
}

/**
 * Check if a role can manage billing
 */
export function canManageBilling(role: TeamRole | null | undefined): boolean {
  if (!role) return false;
  return hasPermission(role, "manage:billing");
}

/**
 * Check if a role can execute requests
 */
export function canExecute(role: TeamRole | null | undefined): boolean {
  if (!role) return false;
  return hasPermission(role, "execute:all");
}

/**
 * Get role display name with emoji
 */
export function getRoleDisplayName(role: TeamRole): string {
  switch (role) {
    case "SPACE_COMMANDER":
      return "Space Commander 🦆🚀";
    case "STAR_NAVIGATOR":
      return "Star Navigator 🦆⭐";
    case "COSMIC_OBSERVER":
      return "Cosmic Observer 🦆🔭";
    default:
      return role;
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: TeamRole): string {
  switch (role) {
    case "SPACE_COMMANDER":
      return "Full access: billing, team management, workspace settings, CRUD on all resources";
    case "STAR_NAVIGATOR":
      return "Can create/edit/delete collections and requests, manage environments";
    case "COSMIC_OBSERVER":
      return "Read-only: can view and execute requests, but cannot modify anything";
    default:
      return "";
  }
}
