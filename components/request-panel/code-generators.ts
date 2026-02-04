import type { Request, HttpMethod, AuthSession, Environment } from "@/types";
import {
  interpolateRequest,
  interpolateVariables,
} from "@/lib/variable-interpolation";
import { getActiveAuthSession } from "@/lib/auth-extraction";

interface CodeGeneratorParams {
  request: Request;
  method: HttpMethod;
  url: string;
  authSessions: AuthSession[];
  environment: Environment | null;
}

function getHeadersAndAuth(
  request: Request,
  authSessions: AuthSession[],
  environment: Environment | null
): Record<string, string> {
  // Interpolate headers first
  const headers: Record<string, string> = Object.fromEntries(
    Object.entries(request.headers).map(([key, value]) => [
      interpolateVariables(key, environment),
      interpolateVariables(value, environment),
    ])
  );

  // Global auth session OVERRIDES all request-specific auth settings
  // Priority: Global active session > Request-specific auth
  const globalSession = getActiveAuthSession(
    authSessions
  ) as AuthSession | null;

  if (globalSession) {
    // Global session overrides everything
    if (globalSession.tokenType === "bearer") {
      headers["Authorization"] = `Bearer ${globalSession.tokenValue}`;
    } else if (globalSession.tokenType === "cookie") {
      headers["Cookie"] = globalSession.tokenValue;
    }
  } else {
    // No global session, use request-specific auth
    if (request.authType === "saved-session" && request.useAuthSession) {
      const session = authSessions.find((s) => s.id === request.useAuthSession);
      if (session) {
        if (session.tokenType === "bearer") {
          headers["Authorization"] = `Bearer ${session.tokenValue}`;
        } else if (session.tokenType === "cookie") {
          headers["Cookie"] = session.tokenValue;
        }
      }
    } else if (request.authType === "bearer" && request.authConfig.bearer) {
      const token = interpolateVariables(
        request.authConfig.bearer.token,
        environment
      );
      headers["Authorization"] = `Bearer ${token}`;
    } else if (request.authType === "basic" && request.authConfig.basic) {
      const username = interpolateVariables(
        request.authConfig.basic.username,
        environment
      );
      const password = interpolateVariables(
        request.authConfig.basic.password,
        environment
      );
      const credentials = btoa(`${username}:${password}`);
      headers["Authorization"] = `Basic ${credentials}`;
    } else if (request.authType === "apikey" && request.authConfig.apikey) {
      const { key, value, addTo } = request.authConfig.apikey;
      const interpolatedKey = interpolateVariables(key, environment);
      const interpolatedValue = interpolateVariables(value, environment);
      if (addTo === "header") {
        headers[interpolatedKey] = interpolatedValue;
      }
    }
  }

  return headers;
}

function getFinalUrl(
  request: Request,
  url: string,
  environment: Environment | null
): string {
  // Interpolate URL first
  let finalUrl = interpolateVariables(url, environment);

  if (
    request.authType === "apikey" &&
    request.authConfig.apikey?.addTo === "query"
  ) {
    const { key, value } = request.authConfig.apikey;
    const interpolatedKey = interpolateVariables(key, environment);
    const interpolatedValue = interpolateVariables(value, environment);
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${separator}${encodeURIComponent(
      interpolatedKey
    )}=${encodeURIComponent(interpolatedValue)}`;
  }
  return finalUrl;
}

export function generateCurlCode({
  request,
  method,
  url,
  authSessions,
  environment,
}: CodeGeneratorParams): string {
  const parts: string[] = ["curl"];

  // Add method
  if (method !== "GET") {
    parts.push(`-X ${method}`);
  }

  const headers = getHeadersAndAuth(request, authSessions, environment);

  // Add all headers
  Object.entries(headers).forEach(([key, value]) => {
    if (key && value) {
      const escapedValue = value.replace(/"/g, '\\"');
      parts.push(`-H "${key}: ${escapedValue}"`);
    }
  });

  // Add body (interpolate first)
  if (request.body.type === "json" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    try {
      const jsonContent = JSON.parse(interpolatedBody);
      const formattedJson = JSON.stringify(jsonContent);
      const escapedJson = formattedJson.replace(/'/g, "'\\''");
      parts.push(`--data-raw '${escapedJson}'`);
      const hasContentType = Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentType) {
        const dataIndex = parts.length - 1;
        parts.splice(dataIndex, 0, `-H "Content-Type: application/json"`);
      }
    } catch {
      const escapedContent = interpolatedBody.replace(/'/g, "'\\''");
      parts.push(`--data-raw '${escapedContent}'`);
    }
  } else if (request.body.type === "raw" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    const escapedContent = interpolatedBody.replace(/'/g, "'\\''");
    parts.push(`--data-raw '${escapedContent}'`);
  } else if (request.body.type === "form-data" && request.body.formData) {
    const formDataEntries = request.body.formData.filter(
      (item) => item.enabled && item.key
    );
    if (formDataEntries.length > 0) {
      formDataEntries.forEach((item) => {
        const interpolatedKey = interpolateVariables(item.key, environment);
        const interpolatedValue = interpolateVariables(item.value, environment);
        const escapedKey = interpolatedKey.replace(/"/g, '\\"');
        const escapedValue = interpolatedValue.replace(/"/g, '\\"');
        parts.push(`-F "${escapedKey}=${escapedValue}"`);
      });
    }
  }

  const finalUrl = getFinalUrl(request, url, environment);
  const escapedUrl = finalUrl.replace(/"/g, '\\"');
  parts.push(`"${escapedUrl}"`);

  return parts.join(" \\\n  ");
}

export function generateNodeCode({
  request,
  method,
  url,
  authSessions,
  environment,
}: CodeGeneratorParams): string {
  const headers = getHeadersAndAuth(request, authSessions, environment);
  const finalUrl = getFinalUrl(request, url, environment);

  const lines: string[] = [];
  lines.push("// Node.js 18+ (built-in fetch)");
  lines.push("");

  // Build headers object
  const hasHeaders = Object.keys(headers).length > 0;
  if (hasHeaders) {
    lines.push("const headers = {");
    Object.entries(headers).forEach(([key, value]) => {
      if (key && value) {
        const escapedValue = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        lines.push(`  '${key}': '${escapedValue}',`);
      }
    });
    lines.push("};");
    lines.push("");
  }

  // Build body (interpolate first)
  let bodyCode = "";
  let hasBody = false;
  if (request.body.type === "json" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    try {
      const jsonContent = JSON.parse(interpolatedBody);
      lines.push(`const body = ${JSON.stringify(jsonContent, null, 2)};`);
      lines.push("");
      bodyCode = "JSON.stringify(body)";
      hasBody = true;
    } catch {
      const escapedContent = interpolatedBody
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      lines.push(`const body = '${escapedContent}';`);
      lines.push("");
      bodyCode = "body";
      hasBody = true;
    }
  } else if (request.body.type === "raw" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    const escapedContent = interpolatedBody
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
    lines.push(`const body = '${escapedContent}';`);
    lines.push("");
    bodyCode = "body";
    hasBody = true;
  } else if (request.body.type === "form-data" && request.body.formData) {
    const formDataEntries = request.body.formData.filter(
      (item) => item.enabled && item.key
    );
    if (formDataEntries.length > 0) {
      lines.push("const formData = new FormData();");
      formDataEntries.forEach((item) => {
        const interpolatedKey = interpolateVariables(item.key, environment);
        const interpolatedValue = interpolateVariables(item.value, environment);
        lines.push(
          `formData.append('${interpolatedKey}', '${interpolatedValue}');`
        );
      });
      lines.push("");
      bodyCode = "formData";
      hasBody = true;
    }
  }

  // Build fetch options
  lines.push("const options = {");
  if (method !== "GET") {
    lines.push(`  method: '${method}',`);
  }
  if (hasHeaders) {
    lines.push("  headers,");
  }
  if (hasBody) {
    lines.push(`  body: ${bodyCode},`);
  }
  lines.push("};");
  lines.push("");
  lines.push(`fetch('${finalUrl}', options)`);
  lines.push("  .then(response => response.json())");
  lines.push("  .then(data => console.log(data))");
  lines.push("  .catch(error => console.error('Error:', error));");

  return lines.join("\n");
}

export function generatePythonCode({
  request,
  method,
  url,
  authSessions,
  environment,
}: CodeGeneratorParams): string {
  const headers = getHeadersAndAuth(request, authSessions, environment);
  const finalUrl = getFinalUrl(request, url, environment);

  const lines: string[] = [];
  lines.push("import requests");
  lines.push("");

  // Build headers dict
  const hasHeaders = Object.keys(headers).length > 0;
  if (hasHeaders) {
    lines.push("headers = {");
    Object.entries(headers).forEach(([key, value]) => {
      if (key && value) {
        const escapedValue = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        lines.push(`    '${key}': '${escapedValue}',`);
      }
    });
    lines.push("}");
    lines.push("");
  }

  // Build data/json/files (interpolate first)
  let dataCode = "";
  let hasData = false;
  if (request.body.type === "json" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    try {
      // Validate JSON
      JSON.parse(interpolatedBody);
      // Use triple quotes for JSON string to avoid escaping issues
      const jsonLines = interpolatedBody.split("\n");
      lines.push("import json");
      if (jsonLines.length > 1) {
        lines.push("json_data = json.loads(");
        lines.push("    '''");
        jsonLines.forEach((line) => lines.push(`    ${line}`));
        lines.push("    '''");
        lines.push(")");
      } else {
        const escapedJson = interpolatedBody
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'");
        lines.push(`json_data = json.loads('${escapedJson}')`);
      }
      lines.push("");
      dataCode = "json=json_data";
      hasData = true;
    } catch {
      const escapedContent = interpolatedBody
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      lines.push(`data = '${escapedContent}'`);
      lines.push("");
      dataCode = "data=data";
      hasData = true;
    }
  } else if (request.body.type === "raw" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    const escapedContent = interpolatedBody
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
    lines.push(`data = '${escapedContent}'`);
    lines.push("");
    dataCode = "data=data";
    hasData = true;
  } else if (request.body.type === "form-data" && request.body.formData) {
    const formDataEntries = request.body.formData.filter(
      (item) => item.enabled && item.key
    );
    if (formDataEntries.length > 0) {
      lines.push("data = {");
      formDataEntries.forEach((item) => {
        const interpolatedKey = interpolateVariables(item.key, environment);
        const interpolatedValue = interpolateVariables(item.value, environment);
        const escapedValue = interpolatedValue
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'");
        lines.push(`    '${interpolatedKey}': '${escapedValue}',`);
      });
      lines.push("}");
      lines.push("");
      dataCode = "data=data";
      hasData = true;
    }
  }

  // Build request
  const params: string[] = [`'${finalUrl}'`];
  if (hasHeaders) {
    params.push("headers=headers");
  }
  if (hasData) {
    params.push(dataCode);
  }

  lines.push(
    `response = requests.${method.toLowerCase()}(${params.join(", ")})`
  );
  lines.push("print(response.json())");

  return lines.join("\n");
}

export function generatePhpCode({
  request,
  method,
  url,
  authSessions,
  environment,
}: CodeGeneratorParams): string {
  const headers = getHeadersAndAuth(request, authSessions, environment);
  const finalUrl = getFinalUrl(request, url, environment);

  const lines: string[] = [];
  lines.push("<?php");
  lines.push("");

  // Build headers array
  const hasHeaders = Object.keys(headers).length > 0;
  if (hasHeaders) {
    lines.push("$headers = [");
    Object.entries(headers).forEach(([key, value]) => {
      if (key && value) {
        const escapedValue = value
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"');
        lines.push(`    '${key}' => '${escapedValue}',`);
      }
    });
    lines.push("];");
    lines.push("");
  }

  // Build body (interpolate first)
  let bodyCode = "";
  let hasBody = false;
  if (request.body.type === "json" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    try {
      // Validate JSON and use it directly as a JSON string
      JSON.parse(interpolatedBody);
      const escapedJson = interpolatedBody
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      lines.push(`$jsonData = '${escapedJson}';`);
      lines.push("");
      bodyCode = "$jsonData";
      hasBody = true;
    } catch {
      const escapedContent = interpolatedBody
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      lines.push(`$data = '${escapedContent}';`);
      lines.push("");
      bodyCode = "$data";
      hasBody = true;
    }
  } else if (request.body.type === "raw" && request.body.content) {
    const interpolatedBody = interpolateVariables(
      request.body.content,
      environment
    );
    const escapedContent = interpolatedBody
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
    lines.push(`$data = '${escapedContent}';`);
    lines.push("");
    bodyCode = "$data";
    hasBody = true;
  } else if (request.body.type === "form-data" && request.body.formData) {
    const formDataEntries = request.body.formData.filter(
      (item) => item.enabled && item.key
    );
    if (formDataEntries.length > 0) {
      lines.push("$data = [");
      formDataEntries.forEach((item) => {
        const interpolatedKey = interpolateVariables(item.key, environment);
        const interpolatedValue = interpolateVariables(item.value, environment);
        const escapedValue = interpolatedValue
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'");
        lines.push(`    '${interpolatedKey}' => '${escapedValue}',`);
      });
      lines.push("];");
      lines.push("");
      bodyCode = "http_build_query($data)";
      hasBody = true;
    }
  }

  // Build curl options
  lines.push("$ch = curl_init();");
  lines.push("");
  lines.push(`curl_setopt($ch, CURLOPT_URL, '${finalUrl}');`);
  lines.push(`curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);`);

  if (method !== "GET") {
    lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');`);
  }

  if (hasHeaders) {
    lines.push("curl_setopt($ch, CURLOPT_HTTPHEADER, [");
    Object.entries(headers).forEach(([key, value]) => {
      if (key && value) {
        const escapedValue = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        lines.push(`    '${key}: ${escapedValue}',`);
      }
    });
    lines.push("]);");
  }

  if (hasBody) {
    lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${bodyCode});`);
  }

  lines.push("");
  lines.push("$response = curl_exec($ch);");
  lines.push("curl_close($ch);");
  lines.push("");
  lines.push("echo $response;");

  return lines.join("\n");
}
