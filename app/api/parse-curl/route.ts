import { NextRequest, NextResponse } from "next/server";
import { parse as parseCurl } from "curlconverter";
import type {
  Request,
  HttpMethod,
  RequestBody,
  RequestHeaders,
  AuthType,
  AuthConfig,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { curlCommand } = await request.json();

    if (!curlCommand || typeof curlCommand !== "string") {
      return NextResponse.json(
        { error: "Invalid curl command" },
        { status: 400 }
      );
    }

    const parsed = parseCurl(curlCommand, {});

    const method = (parsed.method?.toUpperCase() || "GET") as HttpMethod;
    const url = parsed.url || "";

    // Parse headers
    const headers: RequestHeaders = {};
    if (parsed.headers) {
      Object.entries(parsed.headers).forEach(([key, value]) => {
        headers[key] = String(value);
      });
    }

    // Parse body
    let body: RequestBody = { type: "none" };
    if (parsed.data) {
      if (typeof parsed.data === "string") {
        // Try to parse as JSON
        try {
          JSON.parse(parsed.data);
          body = { type: "json", content: parsed.data };
        } catch {
          body = { type: "raw", content: parsed.data };
        }
      } else if (typeof parsed.data === "object") {
        body = { type: "json", content: JSON.stringify(parsed.data, null, 2) };
      }
    }

    // Parse auth
    let authType: AuthType = "none";
    const authConfig: AuthConfig = {};

    if (parsed.auth) {
      const [username, password] = parsed.auth.split(":");
      authType = "basic";
      authConfig.basic = { username, password: password || "" };
    } else if (headers["authorization"]) {
      const authHeader = headers["authorization"];
      if (authHeader.startsWith("Bearer ")) {
        authType = "bearer";
        authConfig.bearer = { token: authHeader.replace("Bearer ", "") };
        delete headers["authorization"];
      }
    }

    return NextResponse.json({
      method,
      url,
      headers,
      body,
      authType,
      authConfig,
    });
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
