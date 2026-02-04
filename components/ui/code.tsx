"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "./code-block";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CodeProps extends React.ComponentProps<"div"> {
  code: string;
}

interface CodeHeaderProps extends React.ComponentProps<"div"> {
  icon?: React.ElementType;
  copyButton?: boolean;
  code?: string;
  onCopy?: () => void;
}

export function Code({ code, className, children, ...props }: CodeProps) {
  return (
    <div className={cn("rounded-lg border bg-muted", className)} {...props}>
      {children}
    </div>
  );
}

export function CodeHeader({
  icon: Icon,
  copyButton = false,
  code,
  onCopy,
  className,
  children,
  ...props
}: CodeHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (code) {
        await navigator.clipboard.writeText(code);
      }
      if (onCopy) {
        onCopy();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 border-b bg-muted/50",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </div>
      {copyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export { CodeBlock };
