"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parsePostmanCollection } from "@/lib/postman-parser";
import { createCollection, createRequest } from "@/hooks/use-local-db";
import { useAppStore } from "@/lib/store";
import { useLocalDB } from "@/hooks/use-local-db";
import { Upload, FileJson, AlertCircle } from "lucide-react";

interface ImportPostmanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportPostmanDialog({
  open,
  onOpenChange,
}: ImportPostmanDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    name: string;
    collections: number;
    requests: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { workspace } = useAppStore();
  const { isInitialized } = useLocalDB();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".json")) {
      setError("Please select a JSON file");
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const text = await selectedFile.text();
      const parsed = parsePostmanCollection(text);
      setPreview({
        name: parsed.name,
        collections: parsed.collections.length,
        requests: parsed.requests.length,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to parse Postman collection"
      );
      setPreview(null);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!file || !preview || !workspace) {
      return;
    }

    if (!isInitialized) {
      setError("Database not initialized");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parsePostmanCollection(text);

      // Extract filename without extension for parent folder name
      const fileName = file.name.replace(/\.json$/i, "");

      // Create parent folder named after the JSON file
      const parentFolderId = await createCollection({
        workspaceId: workspace.id,
        parentId: null,
        name: fileName,
        order: 0,
      });

      // Create a map to track collection IDs: tempId -> actualId
      const collectionIdMap = new Map<string, string>();

      // Sort collections to ensure parents are created before children
      // Collections with null parentId come first, then by order
      const sortedCollections = [...parsed.collections].sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return a.order - b.order;
      });

      // First, create all collections (folders) in order
      // All root-level collections become children of the parent folder
      for (const collection of sortedCollections) {
        const actualParentId = collection.parentId
          ? collectionIdMap.get(collection.parentId) || null
          : parentFolderId; // Root collections go under parent folder

        const actualCollectionId = await createCollection({
          workspaceId: workspace.id,
          parentId: actualParentId,
          name: collection.name,
          order: collection.order,
        });
        collectionIdMap.set(collection.id, actualCollectionId);
      }

      // Then, create all requests
      const maxOrder = Math.max(
        0,
        ...useAppStore.getState().requests.map((r) => r.order)
      );

      for (let i = 0; i < parsed.requests.length; i++) {
        const request = parsed.requests[i];
        // Map temporary collection ID to actual ID
        // Root-level requests go into the parent folder
        const collectionId =
          request.collectionId === "root"
            ? parentFolderId
            : collectionIdMap.get(request.collectionId);

        if (!collectionId) {
          throw new Error(`Collection not found for request: ${request.name}`);
        }

        await createRequest({
          collectionId,
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          authType: request.authType,
          authConfig: request.authConfig,
          order: maxOrder + i + 1,
        });
      }

      // Reset state
      setFile(null);
      setPreview(null);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import Postman collection"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Postman Collection</DialogTitle>
          <DialogDescription>
            Upload a Postman collection JSON file to import collections and
            requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                Postman Collection JSON file
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isImporting}
                >
                  Change
                </Button>
              </div>

              {preview && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Collection:</span>
                    <span className="font-medium">{preview.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Folders:</span>
                    <span className="font-medium">{preview.collections}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Requests:</span>
                    <span className="font-medium">{preview.requests}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !preview || isImporting}
          >
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
