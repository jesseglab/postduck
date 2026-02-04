"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check } from "lucide-react";

export default function TutorialPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchMarkdown() {
      try {
        const response = await fetch("/api/tutorial-markdown");
        if (response.ok) {
          const data = await response.json();
          setMarkdownContent(data.content);
        } else {
          setMarkdownContent("Error loading markdown content.");
        }
      } catch (error) {
        console.error("Error fetching markdown:", error);
        setMarkdownContent("Error loading markdown content.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarkdown();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  Postman Collection Generator Tutorial
                </CardTitle>
                <CardDescription>
                  Complete guide for generating Postman collections from backend
                  codebases. Copy the markdown content below to use with any AI
                  agent in Cursor.
                </CardDescription>
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy Markdown
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">
                  Loading markdown content...
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border">
                <pre className="p-6 text-sm font-mono whitespace-pre-wrap break-words bg-muted/30">
                  <code>{markdownContent}</code>
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
