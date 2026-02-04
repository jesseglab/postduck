/**
 * Extracts path parameters from a URL string
 * Path parameters are identified by the :paramName pattern
 * @param url - The URL string to analyze
 * @returns Array of parameter names found in the URL
 */
export function extractPathParams(url: string): string[] {
  if (!url) return [];

  // Match patterns like :paramName or :param_name
  const paramPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const matches = url.matchAll(paramPattern);
  const params: string[] = [];

  for (const match of matches) {
    const paramName = match[1];
    if (!params.includes(paramName)) {
      params.push(paramName);
    }
  }

  return params;
}

/**
 * Replaces path parameters in a URL with their values
 * @param url - The URL string with path parameters
 * @param params - Object mapping parameter names to values
 * @returns URL with path parameters replaced
 */
export function replacePathParams(
  url: string,
  params: Record<string, string>
): string {
  let result = url;

  for (const [key, value] of Object.entries(params)) {
    // Replace :paramName with the value
    const pattern = new RegExp(
      `:${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "g"
    );
    result = result.replace(pattern, encodeURIComponent(value));
  }

  return result;
}
