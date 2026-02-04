"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, CodeHeader, CodeBlock } from "@/components/ui/code";
import { FileText } from "lucide-react";
import type { ExecuteResponse } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface ResponseBodyProps {
  response: ExecuteResponse;
}

export function ResponseBody({ response }: ResponseBodyProps) {
  const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");

  let contentType = "text";
  let formattedBody = response.body;

  // Try to detect content type from headers
  const contentTypeHeader =
    Object.entries(response.headers).find(
      ([key]) => key.toLowerCase() === "content-type"
    )?.[1] || "";

  if (contentTypeHeader.includes("application/json")) {
    contentType = "json";
    try {
      const parsed = JSON.parse(response.body);
      formattedBody = JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, show as raw
    }
  } else if (contentTypeHeader.includes("text/html")) {
    contentType = "html";
  } else if (
    contentTypeHeader.includes("text/xml") ||
    contentTypeHeader.includes("application/xml")
  ) {
    contentType = "xml";
  }

  return (
    <div className="flex flex-col h-full p-4 min-h-0 response-body-wrapper">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .response-body-wrapper pre,
        .response-body-wrapper code {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          overflow-wrap: anywhere !important;
        }
      `,
        }}
      />
      <div className="flex gap-2 mb-2 shrink-0">
        <button
          onClick={() => setViewMode("pretty")}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === "pretty"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          Pretty
        </button>
        <button
          onClick={() => setViewMode("raw")}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === "raw"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          Raw
        </button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {viewMode === "pretty" && contentType === "html" ? (
          <iframe
            srcDoc={response.body}
            className="w-full h-full border-0 rounded-md"
            title="Response Preview"
          />
        ) : viewMode === "pretty" ? (
          <ScrollArea className="h-full">
            <Code code={formattedBody}>
              <CodeHeader
                icon={FileText}
                copyButton={true}
                code={formattedBody}
              >
                <span className="text-sm font-medium">
                  {contentType.toUpperCase()}
                </span>
              </CodeHeader>
              <CodeBlock
                code={formattedBody}
                lang={contentType}
                theme="dark"
                writing={false}
              />
            </Code>
          </ScrollArea>
        ) : (
          <div className="border rounded-md overflow-hidden h-full min-h-0">
            <MonacoEditor
              height="100%"
              language={contentType}
              value={response.body}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
