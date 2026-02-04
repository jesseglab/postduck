"use client";

import { useMemo } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { useActiveEnvironment } from "@/hooks/use-environment";
import type { HttpMethod } from "@/types";
import {
  generateCurlCode,
  generateNodeCode,
  generatePythonCode,
  generatePhpCode,
} from "./code-generators";
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockSelect,
  CodeBlockSelectTrigger,
  CodeBlockSelectValue,
  CodeBlockSelectContent,
  CodeBlockSelectItem,
  CodeBlockCopyButton,
  CodeBlockBody,
  CodeBlockItem,
  CodeBlockContent,
} from "@/components/kibo-ui/code-block";

interface CurlPreviewProps {
  method: HttpMethod;
  url: string;
}

type Language = "curl" | "node" | "python" | "php";

const languageMap: Record<
  Language,
  { name: string; shikiLang: string; filename: string }
> = {
  curl: { name: "cURL", shikiLang: "bash", filename: "request.sh" },
  node: { name: "Node.js", shikiLang: "javascript", filename: "request.js" },
  python: { name: "Python", shikiLang: "python", filename: "request.py" },
  php: { name: "PHP", shikiLang: "php", filename: "request.php" },
};

export function CurlPreview({ method, url }: CurlPreviewProps) {
  const selectedRequest = useSelectedRequest();
  const { authSessions } = useAppStore();
  const activeEnvironment = useActiveEnvironment();

  const codeData = useMemo(() => {
    if (!selectedRequest) return [];

    const params = {
      request: selectedRequest,
      method,
      url,
      authSessions,
      environment: activeEnvironment,
    };

    return [
      {
        language: "curl",
        filename: languageMap.curl.filename,
        code: generateCurlCode(params),
      },
      {
        language: "node",
        filename: languageMap.node.filename,
        code: generateNodeCode(params),
      },
      {
        language: "python",
        filename: languageMap.python.filename,
        code: generatePythonCode(params),
      },
      {
        language: "php",
        filename: languageMap.php.filename,
        code: generatePhpCode(params),
      },
    ];
  }, [selectedRequest, method, url, authSessions, activeEnvironment]);

  if (!selectedRequest) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 border-l bg-muted/30">
        Select a request to preview code
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-l bg-muted/30 curl-preview-wrapper">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .curl-preview-wrapper pre,
        .curl-preview-wrapper code {
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
          <CodeBlockSelect>
            <CodeBlockSelectTrigger className="text-xs">
              <CodeBlockSelectValue placeholder="Select language" />
            </CodeBlockSelectTrigger>
            <CodeBlockSelectContent>
              {(item) => (
                <CodeBlockSelectItem value={item.language} className="text-xs">
                  {languageMap[item.language as Language]?.name ||
                    item.language}
                </CodeBlockSelectItem>
              )}
            </CodeBlockSelectContent>
          </CodeBlockSelect>
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
              <CodeBlockContent
                language={
                  languageMap[item.language as Language]?.shikiLang as any
                }
                syntaxHighlighting={true}
              >
                {item.code}
              </CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      </CodeBlock>
    </div>
  );
}
