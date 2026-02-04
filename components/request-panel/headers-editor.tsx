"use client";

import { useState, useEffect } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { updateRequest } from "@/hooks/use-local-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function HeadersEditor() {
  const selectedRequest = useSelectedRequest();
  const { updateRequest: updateRequestStore } = useAppStore();
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    []
  );

  useEffect(() => {
    if (selectedRequest) {
      const headerArray = Object.entries(selectedRequest.headers).map(
        ([key, value]) => ({
          key,
          value,
        })
      );
      setHeaders(
        headerArray.length > 0 ? headerArray : [{ key: "", value: "" }]
      );
    }
  }, [selectedRequest]);

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
    saveHeaders(newHeaders);
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    if (newHeaders.length === 0) {
      newHeaders.push({ key: "", value: "" });
    }
    setHeaders(newHeaders);
    saveHeaders(newHeaders);
  };

  const saveHeaders = async (
    headerArray: Array<{ key: string; value: string }>
  ) => {
    if (!selectedRequest) return;

    const headersObj: Record<string, string> = {};
    headerArray.forEach(({ key, value }) => {
      if (key.trim()) {
        headersObj[key.trim()] = value;
      }
    });

    await updateRequest(selectedRequest.id, { headers: headersObj });
    updateRequestStore(selectedRequest.id, { headers: headersObj });
  };

  if (!selectedRequest) return null;

  return (
    <div className="flex flex-col h-full p-4 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-medium">Headers</h3>
        <Button variant="outline" size="sm" onClick={handleAddHeader}>
          <Plus className="h-4 w-4 mr-2" />
          Add Header
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-4">
          {headers.map((header, index) => (
            <div key={index} className="space-y-2">
              <div className="space-y-2 border rounded-md p-3">
                <Input
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) =>
                    handleHeaderChange(index, "key", e.target.value)
                  }
                  onBlur={() => saveHeaders(headers)}
                  className="w-full"
                />
                <Input
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) =>
                    handleHeaderChange(index, "value", e.target.value)
                  }
                  onBlur={() => saveHeaders(headers)}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveHeader(index)}
                className="h-7 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
