import type { Environment } from "@/types";

/**
 * Interpolates environment variables in a string
 * Supports {{variable}} syntax
 */
export function interpolateVariables(
  text: string,
  environment: Environment | null
): string {
  if (!environment || !text) return text;

  let result = text;
  const variablePattern = /\{\{([^}]+)\}\}/g;

  result = result.replace(variablePattern, (match, varName) => {
    const trimmedVarName = varName.trim();
    const variable = environment.variables.find(
      (v) => v.key === trimmedVarName
    );
    return variable ? variable.value : match;
  });

  return result;
}

/**
 * Interpolates variables in request URL, headers, and body
 */
export function interpolateRequest(
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  environment: Environment | null
): {
  url: string;
  headers: Record<string, string>;
  body: string | undefined;
} {
  return {
    url: interpolateVariables(url, environment),
    headers: Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        interpolateVariables(key, environment),
        interpolateVariables(value, environment),
      ])
    ),
    body: body ? interpolateVariables(body, environment) : undefined,
  };
}
