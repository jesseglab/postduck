import type { ExecuteResponse, AuthExtractionConfig } from "@/types";

/**
 * Get nested value from object using dot notation path
 * Example: getNestedValue({ data: { token: "abc" } }, "data.token") => "abc"
 */
function getNestedValue(obj: any, path?: string): any {
  if (!path) return null;
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Extract authentication token from response based on configuration
 */
export function extractAuthToken(
  response: ExecuteResponse,
  config: AuthExtractionConfig
): string | null {
  if (!config.enabled) return null;

  try {
    if (config.extractFrom === "body") {
      // Parse JSON body and extract using path
      const body = JSON.parse(response.body);
      const token = getNestedValue(body, config.path);
      return token ? String(token) : null;
    } else if (config.extractFrom === "cookie") {
      // Find cookie by name in response.cookies (case-insensitive)
      if (!response.cookies || !config.cookieName) {
        console.log("[Auth Extraction] No cookies or cookie name missing", {
          hasCookies: !!response.cookies,
          cookieName: config.cookieName,
        });
        return null;
      }

      console.log("[Auth Extraction] Looking for cookie:", {
        cookieName: config.cookieName,
        availableCookies: response.cookies.map((c) => c.name),
      });

      const cookie = response.cookies.find(
        (c) => c.name.toLowerCase() === config.cookieName!.toLowerCase()
      );

      if (cookie) {
        console.log("[Auth Extraction] Cookie found:", cookie.name);
        return cookie.value || null;
      } else {
        console.log("[Auth Extraction] Cookie not found:", config.cookieName);
        return null;
      }
    } else if (config.extractFrom === "header") {
      // Extract from response headers
      if (!config.path) return null;
      const headerValue = response.headers[config.path];
      return headerValue || null;
    }
  } catch (error) {
    console.error("Failed to extract auth token:", error);
    return null;
  }

  return null;
}

/**
 * Check if auth session is expired
 */
export function isAuthSessionExpired(session: { expiresAt?: number }): boolean {
  if (!session.expiresAt) return false;
  return Date.now() >= session.expiresAt;
}

/**
 * Format time ago string (e.g., "2h ago", "30m ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get the most recent active (non-expired) auth session
 * Auth sessions are global and can be used across all requests
 */
export function getActiveAuthSession(
  sessions: Array<{ id: string; expiresAt?: number; updatedAt: number }>
): { id: string; expiresAt?: number; updatedAt: number } | null {
  if (!sessions || sessions.length === 0) return null;

  // Filter out expired sessions and sort by most recently updated
  const activeSessions = sessions
    .filter((s) => !isAuthSessionExpired(s))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return activeSessions.length > 0 ? activeSessions[0] : null;
}
