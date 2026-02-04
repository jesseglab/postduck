"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseCurlCommand } from "@/lib/curl-parser";
import { createRequest } from "@/hooks/use-local-db";
import { useAppStore } from "@/lib/store";
import { useLocalDB } from "@/hooks/use-local-db";

interface ImportCurlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCurlDialog({
  open,
  onOpenChange,
}: ImportCurlDialogProps) {
  const [curlCommand, setCurlCommand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { selectedCollectionId, workspace } = useAppStore();
  const { isInitialized } = useLocalDB();

  const handleImport = async () => {
    if (!curlCommand.trim()) {
      setError("Please enter a curl command");
      return;
    }

    if (!selectedCollectionId) {
      setError("Please select a collection first");
      return;
    }

    if (!workspace) {
      setError("Workspace not found");
      return;
    }

    try {
      const parsed = await parseCurlCommand(curlCommand);

      const requestName = parsed.url
        ? new URL(parsed.url).pathname.split("/").pop() || "Imported Request"
        : "Imported Request";

      const maxOrder = Math.max(
        0,
        ...useAppStore.getState().requests.map((r) => r.order)
      );

      await createRequest({
        collectionId: selectedCollectionId,
        name: requestName,
        method: parsed.method || "GET",
        url: parsed.url || "",
        headers: parsed.headers || {},
        body: parsed.body || { type: "none" },
        authType: parsed.authType || "none",
        authConfig: parsed.authConfig || {},
        order: maxOrder + 1,
      });

      setCurlCommand("");
      setError(null);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse curl command"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import cURL Command</DialogTitle>
          <DialogDescription>
            Paste your cURL command below to import it as a new request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={curlCommand}
            onChange={(e) => {
              setCurlCommand(e.target.value);
              setError(null);
            }}
            placeholder="curl -X GET https://api.example.com/users -H 'Authorization: Bearer token'"
            className="font-mono text-sm min-h-[200px]"
          />

          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
