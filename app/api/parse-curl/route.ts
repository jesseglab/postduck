import { NextRequest, NextResponse } from "next/server";
import type {
  HttpMethod,
  RequestBody,
  RequestHeaders,
  AuthType,
  AuthConfig,
} from "@/types";

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: RequestHeaders;
  body: RequestBody;
  authType: AuthType;
  authConfig: AuthConfig;
}

/**
 * Simple curl command parser - handles common curl options without native dependencies
 */
function parseCurlCommand(curlCommand: string): ParsedCurl {
  // Normalize the command - handle line continuations and multiple spaces
  const normalized = curlCommand
    .replace(/\\\s*\n/g, " ") // Handle line continuations
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Extract tokens respecting quotes
  const tokens = tokenize(normalized);

  let method: HttpMethod = "GET";
  let url = "";
  const headers: RequestHeaders = {};
  let body: RequestBody = { type: "none" };
  let authType: AuthType = "none";
  const authConfig: AuthConfig = {};
  const formData: Array<{ key: string; value: string; enabled: boolean }> = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "curl") {
      i++;
      continue;
    }

    // Method flag
    if (token === "-X" || token === "--request") {
      i++;
      if (i < tokens.length) {
        method = tokens[i].toUpperCase() as HttpMethod;
      }
      i++;
      continue;
    }

    // Header flag
    if (token === "-H" || token === "--header") {
      i++;
      if (i < tokens.length) {
        const headerValue = tokens[i];
        const colonIndex = headerValue.indexOf(":");
        if (colonIndex > 0) {
          const key = headerValue.slice(0, colonIndex).trim();
          const value = headerValue.slice(colonIndex + 1).trim();
          headers[key.toLowerCase()] = value;
        }
      }
      i++;
      continue;
    }

    // Data flags
    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-ascii"
    ) {
      i++;
      if (i < tokens.length) {
        const data = tokens[i];
        // Try to detect JSON
        try {
          JSON.parse(data);
          body = { type: "json", content: data };
        } catch {
          body = { type: "raw", content: data };
        }
        // Default to POST if no method specified
        if (method === "GET") {
          method = "POST";
        }
      }
      i++;
      continue;
    }

    // JSON data flag (specific for JSON)
    if (token === "--json") {
      i++;
      if (i < tokens.length) {
        body = { type: "json", content: tokens[i] };
        if (method === "GET") {
          method = "POST";
        }
      }
      i++;
      continue;
    }

    // Form data
    if (token === "-F" || token === "--form") {
      i++;
      if (i < tokens.length) {
        const formValue = tokens[i];
        const eqIndex = formValue.indexOf("=");
        if (eqIndex > 0) {
          formData.push({
            key: formValue.slice(0, eqIndex),
            value: formValue.slice(eqIndex + 1),
            enabled: true,
          });
        }
        if (method === "GET") {
          method = "POST";
        }
      }
      i++;
      continue;
    }

    // URL encoded form data
    if (token === "--data-urlencode") {
      i++;
      if (i < tokens.length) {
        const formValue = tokens[i];
        const eqIndex = formValue.indexOf("=");
        if (eqIndex > 0) {
          formData.push({
            key: formValue.slice(0, eqIndex),
            value: encodeURIComponent(formValue.slice(eqIndex + 1)),
            enabled: true,
          });
        }
        if (method === "GET") {
          method = "POST";
        }
      }
      i++;
      continue;
    }

    // Basic auth
    if (token === "-u" || token === "--user") {
      i++;
      if (i < tokens.length) {
        const auth = tokens[i];
        const colonIndex = auth.indexOf(":");
        if (colonIndex > 0) {
          authType = "basic";
          authConfig.basic = {
            username: auth.slice(0, colonIndex),
            password: auth.slice(colonIndex + 1),
          };
        } else {
          authType = "basic";
          authConfig.basic = {
            username: auth,
            password: "",
          };
        }
      }
      i++;
      continue;
    }

    // Skip common flags we don't need
    if (
      token === "-k" ||
      token === "--insecure" ||
      token === "-v" ||
      token === "--verbose" ||
      token === "-s" ||
      token === "--silent" ||
      token === "-S" ||
      token === "--show-error" ||
      token === "-L" ||
      token === "--location" ||
      token === "-i" ||
      token === "--include" ||
      token === "--compressed"
    ) {
      i++;
      continue;
    }

    // Skip flags with values we don't need
    if (
      token === "-o" ||
      token === "--output" ||
      token === "-A" ||
      token === "--user-agent" ||
      token === "-e" ||
      token === "--referer" ||
      token === "--connect-timeout" ||
      token === "-m" ||
      token === "--max-time" ||
      token === "--retry" ||
      token === "-w" ||
      token === "--write-out"
    ) {
      i += 2; // Skip flag and its value
      continue;
    }

    // URL (anything that looks like a URL or doesn't start with -)
    if (
      !token.startsWith("-") &&
      (token.includes("://") || token.includes("."))
    ) {
      url = token;
      i++;
      continue;
    }

    // Unknown flag, try to skip
    i++;
  }

  // Handle form data
  if (formData.length > 0 && body.type === "none") {
    body = { type: "form-data", formData };
  }

  // Check for Bearer token in headers
  const authHeader = headers["authorization"];
  if (authHeader && authType === "none") {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      authType = "bearer";
      authConfig.bearer = { token: authHeader.slice(7).trim() };
      delete headers["authorization"];
    }
  }

  return {
    method,
    url,
    headers,
    body,
    authType,
    authConfig,
  };
}

/**
 * Tokenize a curl command, respecting quoted strings
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escape) {
      current += char;
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === " " && !inSingleQuote && !inDoubleQuote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export async function POST(request: NextRequest) {
  try {
    const { curlCommand } = await request.json();

    if (!curlCommand || typeof curlCommand !== "string") {
      return NextResponse.json(
        { error: "Invalid curl command" },
        { status: 400 }
      );
    }

    const parsed = parseCurlCommand(curlCommand);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to parse curl command: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 400 }
    );
  }
}
