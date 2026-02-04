import { NextRequest, NextResponse } from "next/server";
import type { ExecuteRequestParams, ExecuteResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const params: ExecuteRequestParams = await request.json();
    const startTime = Date.now();

    // Validate URL is provided
    if (!params.url || typeof params.url !== "string") {
      return NextResponse.json(
        {
          statusCode: 0,
          headers: {},
          body: "Error: URL is required",
          duration: 0,
          size: 0,
        },
        { status: 400 }
      );
    }

    // Check for unresolved variables in URL
    const unresolvedVars = params.url.match(/\{\{[^}]+\}\}/g);
    if (unresolvedVars && unresolvedVars.length > 0) {
      return NextResponse.json(
        {
          statusCode: 0,
          headers: {},
          body: `Error: Unresolved variables in URL: ${unresolvedVars.join(
            ", "
          )}. Please set these variables in your active environment.`,
          duration: 0,
          size: 0,
        },
        { status: 400 }
      );
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(params.url);
    } catch (urlError) {
      return NextResponse.json(
        {
          statusCode: 0,
          headers: {},
          body: `Error: Invalid URL format: ${params.url}. ${
            urlError instanceof Error
              ? urlError.message
              : "URL must be a valid absolute URL (e.g., https://example.com/api)"
          }`,
          duration: 0,
          size: 0,
        },
        { status: 400 }
      );
    }

    // Prepare headers
    const headers: Record<string, string> = { ...params.headers };

    // Prepare body
    let body: string | FormData | undefined;
    if (params.body) {
      if (params.body.type === "json" && params.body.content) {
        body = params.body.content;
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      } else if (params.body.type === "raw" && params.body.content) {
        body = params.body.content;
      } else if (params.body.type === "form-data" && params.body.formData) {
        const formData = new FormData();
        params.body.formData
          .filter((item) => item.enabled)
          .forEach((item) => {
            formData.append(item.key, item.value);
          });
        body = formData;
        // Don't set Content-Type for FormData, browser will set it with boundary
        delete headers["Content-Type"];
      }
    }

    // Normalize URL - handle common issues
    let finalUrl = params.url.trim();

    // Fix double slashes (except after protocol)
    finalUrl = finalUrl.replace(/([^:]\/)\/+/g, "$1");

    // Handle API key in query params
    if (
      params.authType === "apikey" &&
      params.authConfig.apikey?.addTo === "query"
    ) {
      const separator = finalUrl.includes("?") ? "&" : "?";
      finalUrl = `${finalUrl}${separator}${params.authConfig.apikey.key}=${params.authConfig.apikey.value}`;

      // Validate final URL after adding query params
      try {
        new URL(finalUrl);
      } catch (urlError) {
        return NextResponse.json(
          {
            statusCode: 0,
            headers: {},
            body: `Error: Invalid URL after adding query parameters: ${finalUrl}. ${
              urlError instanceof Error
                ? urlError.message
                : "URL must be a valid absolute URL"
            }`,
            duration: 0,
            size: 0,
          },
          { status: 400 }
        );
      }
    }

    // Execute the request with timeout and better error handling
    let fetchResponse: Response;
    const errorDetails = `URL: ${finalUrl}\nMethod: ${params.method}`;

    try {
      // Create abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        fetchResponse = await fetch(finalUrl, {
          method: params.method,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          body: body instanceof FormData ? body : body,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
    } catch (fetchError) {
      // Provide detailed error information
      if (fetchError instanceof Error) {
        // Check for specific error types
        if (
          fetchError.name === "AbortError" ||
          fetchError.message.includes("timeout")
        ) {
          return NextResponse.json(
            {
              statusCode: 0,
              headers: {},
              body: `Error: Request timeout after 30 seconds.\n\n${errorDetails}\n\nThe server did not respond in time. This could indicate:\n- The server is slow or overloaded\n- Network connectivity issues\n- The endpoint is not responding`,
              duration: 0,
              size: 0,
            },
            { status: 500 }
          );
        }

        if (
          fetchError.message.includes("ENOTFOUND") ||
          fetchError.message.includes("getaddrinfo")
        ) {
          return NextResponse.json(
            {
              statusCode: 0,
              headers: {},
              body: `Error: DNS resolution failed - could not resolve hostname.\n\n${errorDetails}\n\nThis means the domain name could not be resolved. Check:\n- Is the URL correct?\n- Is the domain name spelled correctly?\n- Do you have internet connectivity?`,
              duration: 0,
              size: 0,
            },
            { status: 500 }
          );
        }

        if (fetchError.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            {
              statusCode: 0,
              headers: {},
              body: `Error: Connection refused.\n\n${errorDetails}\n\nThe server refused the connection. This could mean:\n- The server is not running\n- The port is incorrect\n- A firewall is blocking the connection`,
              duration: 0,
              size: 0,
            },
            { status: 500 }
          );
        }

        if (
          fetchError.message.includes("certificate") ||
          fetchError.message.includes("SSL") ||
          fetchError.message.includes("TLS")
        ) {
          return NextResponse.json(
            {
              statusCode: 0,
              headers: {},
              body: `Error: SSL/TLS certificate error.\n\n${errorDetails}\n\nThere was a problem with the SSL certificate. This could be:\n- Self-signed certificate\n- Expired certificate\n- Certificate mismatch\n\nOriginal error: ${fetchError.message}`,
              duration: 0,
              size: 0,
            },
            { status: 500 }
          );
        }

        // Generic fetch failed error with URL info
        return NextResponse.json(
          {
            statusCode: 0,
            headers: {},
            body: `Error: Network request failed.\n\n${errorDetails}\n\nError details: ${fetchError.message}\n\nPossible causes:\n- Invalid URL or unreachable server\n- CORS restrictions\n- Network connectivity issues\n- SSL/TLS certificate problems\n- Server is down or unreachable`,
            duration: 0,
            size: 0,
          },
          { status: 500 }
        );
      }

      // Fallback for unknown errors
      return NextResponse.json(
        {
          statusCode: 0,
          headers: {},
          body: `Error: Unknown network error.\n\n${errorDetails}\n\n${fetchError}`,
          duration: 0,
          size: 0,
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;

    // Read response body
    const responseText = await fetchResponse.text();
    const size = new Blob([responseText]).size;

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse cookies
    // Note: Headers API doesn't have getAll(), so we need to iterate through all headers
    // to find all Set-Cookie headers (case-insensitive)
    const cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: string;
    }> = [];

    // Collect all Set-Cookie headers (case-insensitive)
    const setCookieHeaders: string[] = [];
    fetchResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value);
      }
    });

    // Parse each Set-Cookie header
    setCookieHeaders.forEach((setCookieHeader) => {
      // Each Set-Cookie header contains one cookie
      // Format: "name=value; domain=example.com; path=/; expires=..."
      const parts = setCookieHeader.split(";").map((p) => p.trim());
      // Split only on the first "=" to handle values that contain "="
      const firstEqualsIndex = parts[0].indexOf("=");
      const name =
        firstEqualsIndex > 0
          ? parts[0].substring(0, firstEqualsIndex).trim()
          : parts[0].trim();
      const value =
        firstEqualsIndex > 0
          ? parts[0].substring(firstEqualsIndex + 1).trim()
          : "";

      if (name) {
        const cookie: (typeof cookies)[0] = {
          name,
          value: value || "",
        };

        parts.slice(1).forEach((part) => {
          const lowerPart = part.toLowerCase();
          if (lowerPart.startsWith("domain=")) {
            cookie.domain = part.split("=").slice(1).join("=");
          } else if (lowerPart.startsWith("path=")) {
            cookie.path = part.split("=").slice(1).join("=");
          } else if (lowerPart.startsWith("expires=")) {
            cookie.expires = part.split("=").slice(1).join("=");
          }
        });

        cookies.push(cookie);
      }
    });

    const response: ExecuteResponse = {
      statusCode: fetchResponse.status,
      headers: responseHeaders,
      body: responseText,
      duration,
      size,
      cookies: cookies.length > 0 ? cookies : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Provide more specific error messages
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle common fetch errors
      if (error.message.includes("fetch failed")) {
        errorMessage = `Network error: Failed to connect to the server. This could be due to:
- Invalid URL or unreachable server
- CORS restrictions
- Network connectivity issues
- SSL/TLS certificate problems

Original error: ${error.message}`;
      } else if (error.message.includes("Invalid URL")) {
        errorMessage = `Invalid URL: ${error.message}`;
      } else if (error.name === "TypeError" && error.message.includes("URL")) {
        errorMessage = `URL parsing error: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        statusCode: 0,
        headers: {},
        body: `Error: ${errorMessage}`,
        duration: 0,
        size: 0,
      },
      { status: 500 }
    );
  }
}
