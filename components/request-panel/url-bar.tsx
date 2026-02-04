"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { HttpMethod } from "@/types";

interface UrlBarProps {
  method: HttpMethod;
  url: string;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  readOnly?: boolean;
}

export function UrlBar({
  method,
  url,
  onMethodChange,
  onUrlChange,
  readOnly = false,
}: UrlBarProps) {
  return (
    <div className="flex gap-2 flex-1">
      <Select
        value={method}
        onValueChange={(value) => onMethodChange(value as HttpMethod)}
        disabled={readOnly}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="GET">GET</SelectItem>
          <SelectItem value="POST">POST</SelectItem>
          <SelectItem value="PUT">PUT</SelectItem>
          <SelectItem value="PATCH">PATCH</SelectItem>
          <SelectItem value="DELETE">DELETE</SelectItem>
          <SelectItem value="HEAD">HEAD</SelectItem>
          <SelectItem value="OPTIONS">OPTIONS</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Enter URL or use {{variable}}"
        className="flex-1 font-mono text-sm"
        disabled={readOnly}
      />
    </div>
  );
}
