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
  type BundledLanguage,
} from "@/components/kibo-ui/code-block";
import { getStatusText } from "@/lib/http-status-codes";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { useActiveEnvironment } from "@/hooks/use-environment";
import { generateCurlCode } from "@/components/request-panel/code-generators";

interface ResponseCurlPreviewProps {
  response: ExecuteResponse | null;
}

export function ResponseCurlPreview({ response }: ResponseCurlPreviewProps) {
  const selectedRequest = useSelectedRequest();
  const { authSessions } = useAppStore();
  const activeEnvironment = useActiveEnvironment();

  // Safety check
  if (!response) {
    return (
      <div className="flex flex-col h-full border-l bg-muted/30 p-4">
        <div className="text-xs font-medium mb-2">Response Output</div>
        <div className="text-sm text-muted-foreground">No response data available</div>
      </div>
    );
  }

  // Generate curl command for debug copy
  const curlCommand = useMemo(() => {
    if (!selectedRequest || !response) return "";
    
    try {
      return generateCurlCode({
        request: selectedRequest,
        method: selectedRequest.method,
        url: selectedRequest.url,
        authSessions,
        environment: activeEnvironment,
      });
    } catch (error) {
      console.error("Failed to generate curl command:", error);
      return "";
    }
  }, [selectedRequest, authSessions, activeEnvironment, response]);

  const curlOutput = useMemo(() => {
    // Debug logging
    console.log("ResponseCurlPreview received:", {
      hasResponse: !!response,
      statusCode: response?.statusCode,
      bodyType: typeof response?.body,
      bodyLength: response?.body?.length ?? 0,
      bodyPreview: response?.body?.substring?.(0, 100),
      headers: response?.headers,
    });

    const lines: string[] = [];

    // Ensure we have a valid response
    if (!response) {
      return "(no response)";
    }

    // Status line
    lines.push(
      `HTTP/1.1 ${response.statusCode} ${getStatusText(response.statusCode)}`
    );
    lines.push("");

    // Headers (sorted for consistency)
    const sortedHeaders = Object.entries(response.headers || {}).sort(([a], [b]) =>
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

    // Body - ensure we handle all cases
    const responseBody = response.body ?? "";
    if (responseBody) {
      // Try to format JSON if applicable
      const contentType =
        response.headers?.["content-type"] ||
        response.headers?.["Content-Type"] ||
        "";
      if (contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(responseBody);
          const formatted = JSON.stringify(parsed, null, 2);
          lines.push(formatted);
        } catch (e) {
          console.warn("Failed to parse JSON in ResponseCurlPreview:", e);
          lines.push(responseBody);
        }
      } else {
        lines.push(responseBody);
      }
    } else {
      lines.push("(empty body)");
    }

    const output = lines.join("\n");
    console.log("ResponseCurlPreview output length:", output.length);
    return output;
  }, [response]);

  // Handle copy debug info
  const handleCopyDebug = async () => {
    if (!curlCommand || !curlOutput) return;

    const debugContent = `Request:
${curlCommand}
gives me this error:
${curlOutput}`;

    try {
      await navigator.clipboard.writeText(debugContent);
    } catch (error) {
      console.error("Failed to copy debug info:", error);
    }
  };

  const codeData = [
    {
      language: "bash" as const,
      filename: "response.txt",
      code: curlOutput || "(no response data)",
    },
  ];

  console.log("ResponseCurlPreview codeData:", {
    codeDataLength: codeData.length,
    codeLength: codeData[0]?.code?.length ?? 0,
    codePreview: codeData[0]?.code?.substring(0, 100),
  });

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
        defaultValue="bash"
        data={codeData}
        className="h-full flex flex-col border-0 rounded-none"
      >
        <CodeBlockHeader className="rounded-none text-xs">
          <div className="text-xs font-medium">Response Output</div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {curlCommand && curlOutput && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCopyDebug}
                    >
                      <Bug className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Copy request and response for debugging
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <CodeBlockCopyButton className="h-6 w-6" />
          </div>
        </CodeBlockHeader>
        <CodeBlockBody className="flex-1 overflow-auto min-h-0">
          {(item) => {
            console.log("CodeBlockBody rendering item:", {
              language: item.language,
              codeLength: item.code?.length ?? 0,
              codePreview: item.code?.substring(0, 50),
            });
            return (
              <CodeBlockItem
                key={item.language}
                value={item.language}
                lineNumbers={false}
                className="h-full text-[10px] [&_code]:text-[10px] [&_pre]:text-[10px]"
              >
                <CodeBlockContent
                  language={item.language as BundledLanguage}
                  syntaxHighlighting={true}
                >
                  {item.code || "(empty)"}
                </CodeBlockContent>
              </CodeBlockItem>
            );
          }}
        </CodeBlockBody>
      </CodeBlock>
    </div>
  );
}

