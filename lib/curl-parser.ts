import type {
  Request,
  HttpMethod,
  RequestBody,
  RequestHeaders,
  AuthType,
  AuthConfig,
} from "@/types";

/**
 * Parse a curl command into a Request object
 * This function calls the API route to parse curl commands server-side
 */
export async function parseCurlCommand(
  curlCommand: string
): Promise<Partial<Request>> {
  const response = await fetch("/api/parse-curl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ curlCommand }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to parse curl command");
  }

  return response.json();
}

/**
 * Convert a Request object to a curl command
 */
export function requestToCurl(request: Request): string {
  const parts: string[] = ["curl"];

  // Method
  if (request.method !== "GET") {
    parts.push(`-X ${request.method}`);
  }

  // Headers
  Object.entries(request.headers).forEach(([key, value]) => {
    parts.push(`-H "${key}: ${value}"`);
  });

  // Auth
  if (request.authType === "bearer" && request.authConfig.bearer) {
    parts.push(`-H "Authorization: Bearer ${request.authConfig.bearer.token}"`);
  } else if (request.authType === "basic" && request.authConfig.basic) {
    const { username, password } = request.authConfig.basic;
    parts.push(`-u "${username}:${password}"`);
  } else if (request.authType === "apikey" && request.authConfig.apikey) {
    const { key, value, addTo } = request.authConfig.apikey;
    if (addTo === "header") {
      parts.push(`-H "${key}: ${value}"`);
    } else {
      // Will be added to URL as query param
    }
  }

  // Body
  if (request.body.type === "json" && request.body.content) {
    parts.push(`-d '${request.body.content}'`);
    parts.push(`-H "Content-Type: application/json"`);
  } else if (request.body.type === "raw" && request.body.content) {
    parts.push(`--data-raw '${request.body.content}'`);
  } else if (request.body.type === "form-data" && request.body.formData) {
    request.body.formData.forEach(({ key, value }) => {
      parts.push(`-F "${key}=${value}"`);
    });
  }

  // URL (with API key query param if needed)
  let url = request.url;
  if (
    request.authType === "apikey" &&
    request.authConfig.apikey?.addTo === "query"
  ) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}${request.authConfig.apikey.key}=${request.authConfig.apikey.value}`;
  }
  parts.push(`"${url}"`);

  return parts.join(" \\\n  ");
}
