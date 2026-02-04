"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { extractPathParams } from "@/lib/path-params";

interface PathParamsEditorProps {
  url: string;
  onParamsChange: (params: Record<string, string>) => void;
}

export function PathParamsEditor({
  url,
  onParamsChange,
}: PathParamsEditorProps) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [paramNames, setParamNames] = useState<string[]>([]);

  // Extract path parameters from URL whenever it changes
  useEffect(() => {
    const extracted = extractPathParams(url);
    setParamNames(extracted);

    // Remove params that are no longer in the URL, preserving existing values
    setParams((prevParams) => {
      const updatedParams: Record<string, string> = {};
      extracted.forEach((name) => {
        updatedParams[name] = prevParams[name] || "";
      });
      return updatedParams;
    });
  }, [url]);

  // Notify parent when params change
  useEffect(() => {
    onParamsChange(params);
  }, [params, onParamsChange]);

  const handleParamChange = (paramName: string, value: string) => {
    setParams((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  if (paramNames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <label className="text-xs font-medium text-muted-foreground">
        Path Parameters
      </label>
      <div className="grid grid-cols-2 gap-2">
        {paramNames.map((paramName) => (
          <div key={paramName} className="space-y-1">
            <label
              htmlFor={`path-param-${paramName}`}
              className="text-xs block text-muted-foreground"
            >
              {paramName}
            </label>
            <Input
              id={`path-param-${paramName}`}
              value={params[paramName] || ""}
              onChange={(e) => handleParamChange(paramName, e.target.value)}
              placeholder={`Enter ${paramName}`}
              className="font-mono text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
