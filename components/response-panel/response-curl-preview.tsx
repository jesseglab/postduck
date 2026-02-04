"use client";

import { useMemo } from "react";
import type { ExecuteResponse } from "@/types";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockCopyButton,
  CodeBlockBody,
  CodeBlockItem,
  CodeBlockContent,
} from "@/components/kibo-ui/code-block";

interface ResponseCurlPreviewProps {
  response: ExecuteResponse;
}

export function ResponseCurlPreview({ response }: ResponseCurlPreviewProps) {
  const curlOutput = useMemo(() => {
    const lines: string[] = [];

    // Status line
    lines.push(
      `HTTP/1.1 ${response.statusCode} ${getStatusText(response.statusCode)}`
    );
    lines.push("");

    // Headers (sorted for consistency)
    const sortedHeaders = Object.entries(response.headers).sort(([a], [b]) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    sortedHeaders.forEach(([key, value]) => {
      if (key && value) {
        lines.push(`${key}: ${value}`);
      }
    });

    // Cookies if present
    if (response.cookies && response.cookies.length > 0) {
      const cookieValues = response.cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      lines.push(`Set-Cookie: ${cookieValues}`);
    }

    // Empty line before body
    lines.push("");

    // Body
    if (response.body) {
      // Try to format JSON if applicable
      const contentType =
        response.headers["content-type"] ||
        response.headers["Content-Type"] ||
        "";
      if (contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(response.body);
          const formatted = JSON.stringify(parsed, null, 2);
          lines.push(formatted);
        } catch {
          lines.push(response.body);
        }
      } else {
        lines.push(response.body);
      }
    } else {
      lines.push("(empty body)");
    }

    return lines.join("\n");
  }, [response]);

  const codeData = [
    {
      language: "curl",
      filename: "response.txt",
      code: curlOutput,
    },
  ];

  return (
    <div className="flex flex-col h-full border-l bg-muted/30 response-output-wrapper">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .response-output-wrapper pre,
        .response-output-wrapper code {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          overflow-wrap: anywhere !important;
        }
      `,
        }}
      />
      <CodeBlock
        defaultValue="curl"
        data={codeData}
        className="h-full flex flex-col border-0 rounded-none"
      >
        <CodeBlockHeader className="rounded-none text-xs">
          <div className="text-xs font-medium">Response Output</div>
          <div className="flex-1" />
          <CodeBlockCopyButton className="h-6 w-6" />
        </CodeBlockHeader>
        <CodeBlockBody className="flex-1 overflow-auto min-h-0">
          {(item) => (
            <CodeBlockItem
              key={item.language}
              value={item.language}
              lineNumbers={false}
              className="h-full text-[10px] [&_code]:text-[10px] [&_pre]:text-[10px]"
            >
              <CodeBlockContent language="text" syntaxHighlighting={true}>
                {item.code}
              </CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      </CodeBlock>
    </div>
  );
}

function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[statusCode] || "Unknown";
}
