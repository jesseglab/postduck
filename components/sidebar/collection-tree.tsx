"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  Upload,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  createCollection,
  moveCollectionUp,
  moveCollectionDown,
  deleteCollection,
  deleteRequest,
  updateCollection,
  updateRequest,
} from "@/hooks/use-local-db";
import { useLocalDB } from "@/hooks/use-local-db";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Tree, Folder, File } from "@/components/ui/file-tree";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportCurlDialog } from "@/components/modals/import-curl-dialog";
import { ImportPostmanDialog } from "@/components/modals/import-postman-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

type DragItem = {
  id: string;
  type: "collection" | "request";
};

export function CollectionTree() {
  const {
    collections,
    requests,
    selectedCollectionId,
    selectedRequestId,
    setSelectedCollection,
    setSelectedRequest,
  } = useAppStore();
  const { workspace } = useAppStore();
  const [showCollectionPrompt, setShowCollectionPrompt] = useState(false);
  const [showRequestPrompt, setShowRequestPrompt] = useState(false);
  const [showImportCurlDialog, setShowImportCurlDialog] = useState(false);
  const [showImportPostmanDialog, setShowImportPostmanDialog] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "collection" | "request";
    id: string;
    name: string;
  }>({
    open: false,
    type: "collection",
    id: "",
    name: "",
  });

  // Drag and drop state
  const [draggingItem, setDraggingItem] = useState<DragItem | null>(null);
  const [dragHoldProgress, setDragHoldProgress] = useState<{
    id: string;
    progress: number;
  } | null>(null);
  const dragHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragHoldStartRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragHoldTimerRef.current) {
        clearInterval(dragHoldTimerRef.current);
      }
    };
  }, []);

  // Global mouse handlers to clean up drag state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragHoldTimerRef.current) {
        clearInterval(dragHoldTimerRef.current);
        dragHoldTimerRef.current = null;
      }
      if (dragHoldStartRef.current) {
        setDragHoldProgress(null);
        dragHoldStartRef.current = null;
      }
      // Cancel drag if mouse up without dropping
      if (draggingItem) {
        setDraggingItem(null);
      }
    };

    const handleGlobalMouseMove = () => {
      // Keep drag state active while moving
      if (draggingItem) {
        // Visual feedback is handled by className
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [draggingItem]);

  // Get all expanded items (all collections that have children)
  const initialExpandedItems = useMemo(() => {
    return collections
      .filter((c) => {
        const hasChildCollections = collections.some(
          (child) => child.parentId === c.id
        );
        const hasRequests = requests.some((r) => r.collectionId === c.id);
        return hasChildCollections || hasRequests;
      })
      .map((c) => c.id);
  }, [collections, requests]);

  const handleCreateCollection = () => {
    if (!workspace) return;
    setShowCollectionPrompt(true);
  };

  const handleConfirmCollection = async (name: string) => {
    if (!workspace) return;
    const maxOrder = Math.max(0, ...collections.map((c) => c.order));
    await createCollection({
      workspaceId: workspace.id,
      parentId: null,
      name,
      order: maxOrder + 1,
    });
  };

  const handleCreateRequest = (collectionId: string) => {
    setPendingCollectionId(collectionId);
    setShowRequestPrompt(true);
  };

  const handleConfirmRequest = async (name: string) => {
    if (!pendingCollectionId) return;

    const { createRequest: createRequestFn } = await import(
      "@/hooks/use-local-db"
    );
    const requests = useAppStore.getState().requests;
    const maxOrder = Math.max(0, ...requests.map((r) => r.order));

    await createRequestFn({
      collectionId: pendingCollectionId,
      name,
      method: "GET",
      url: "",
      headers: {},
      body: { type: "none" },
      authType: "none",
      authConfig: {},
      order: maxOrder + 1,
    });
    setPendingCollectionId(null);
  };

  const handleMoveUp = async (collectionId: string) => {
    await moveCollectionUp(collectionId);
  };

  const handleMoveDown = async (collectionId: string) => {
    await moveCollectionDown(collectionId);
  };

  const handleDeleteCollection = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    setDeleteDialog({
      open: true,
      type: "collection",
      id: collectionId,
      name: collection.name,
    });
  };

  const handleDeleteRequest = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;
    setDeleteDialog({
      open: true,
      type: "request",
      id: requestId,
      name: request.name,
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.type === "collection") {
      await deleteCollection(deleteDialog.id);
      if (selectedCollectionId === deleteDialog.id) {
        setSelectedCollection(null);
      }
    } else {
      await deleteRequest(deleteDialog.id);
      if (selectedRequestId === deleteDialog.id) {
        setSelectedRequest(null);
      }
    }
    setDeleteDialog({ open: false, type: "collection", id: "", name: "" });
  };

  // Drag and drop handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, item: DragItem) => {
    // Only start drag hold on left mouse button
    if (e.button !== 0) return;
    // Don't prevent default - let normal clicks work
    // Only start drag hold if not clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[role='button']")) {
      return;
    }

    dragHoldStartRef.current = Date.now();
    setDragHoldProgress({ id: item.id, progress: 0 });

    const updateProgress = () => {
      if (!dragHoldStartRef.current) return;
      const elapsed = Date.now() - dragHoldStartRef.current;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setDragHoldProgress({ id: item.id, progress });

      if (progress >= 100) {
        // Start dragging - set dragging item
        setDraggingItem(item);
        setDragHoldProgress(null);
        dragHoldStartRef.current = null;
        if (dragHoldTimerRef.current) {
          clearInterval(dragHoldTimerRef.current);
          dragHoldTimerRef.current = null;
        }
      }
    };

    dragHoldTimerRef.current = setInterval(updateProgress, 16); // ~60fps
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragHoldTimerRef.current) {
      clearInterval(dragHoldTimerRef.current);
      dragHoldTimerRef.current = null;
    }
    if (dragHoldStartRef.current) {
      setDragHoldProgress(null);
      dragHoldStartRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleDrop = useCallback(
    async (targetCollectionId: string) => {
      if (!draggingItem) return;

      const targetCollection = collections.find(
        (c) => c.id === targetCollectionId
      );
      if (!targetCollection) return;

      // Prevent dropping on itself or its descendants
      if (draggingItem.type === "collection") {
        const isDescendant = (id: string, parentId: string): boolean => {
          const collection = collections.find((c) => c.id === id);
          if (!collection || !collection.parentId) return false;
          if (collection.parentId === parentId) return true;
          return isDescendant(collection.parentId, parentId);
        };

        if (
          draggingItem.id === targetCollectionId ||
          isDescendant(targetCollectionId, draggingItem.id)
        ) {
          setDraggingItem(null);
          return;
        }
      }

      if (draggingItem.type === "collection") {
        const collection = collections.find((c) => c.id === draggingItem.id);
        if (!collection) return;

        const children = collections.filter(
          (c) => c.parentId === targetCollectionId
        );
        const maxOrder =
          children.length > 0 ? Math.max(...children.map((c) => c.order)) : -1;

        await updateCollection(draggingItem.id, {
          parentId: targetCollectionId,
          order: maxOrder + 1,
        });
      } else {
        const request = requests.find((r) => r.id === draggingItem.id);
        if (!request) return;

        const collectionRequests = requests.filter(
          (r) => r.collectionId === targetCollectionId
        );
        const maxOrder =
          collectionRequests.length > 0
            ? Math.max(...collectionRequests.map((r) => r.order))
            : -1;

        await updateRequest(draggingItem.id, {
          collectionId: targetCollectionId,
          order: maxOrder + 1,
        });
      }

      setDraggingItem(null);
    },
    [draggingItem, collections, requests]
  );

  // Check if a collection can be moved up (has a parent)
  const canMoveUp = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection && collection.parentId !== null;
  };

  // Check if a collection can be moved down (has siblings or parent has parent)
  const canMoveDown = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return false;

    // Can move down if there are siblings before it, or if parent has a parent
    const siblings = collections.filter(
      (c) => c.parentId === collection.parentId
    );
    const sortedSiblings = siblings.sort((a, b) => a.order - b.order);
    const currentIndex = sortedSiblings.findIndex((c) => c.id === collectionId);

    return (
      currentIndex > 0 ||
      (collection.parentId !== null &&
        collections.some(
          (c) => c.id === collection.parentId && c.parentId !== null
        ))
    );
  };

  // Recursive render function for collections and requests
  const renderCollection = (collectionId: string): React.ReactNode => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return null;

    const isSelected = selectedCollectionId === collectionId;
    const isDragging = draggingItem?.id === collectionId;
    const isDragTarget = draggingItem && draggingItem.id !== collectionId;
    const childCollections = collections
      .filter((c) => c.parentId === collectionId)
      .sort((a, b) => a.order - b.order);
    const collectionRequests = requests
      .filter((r) => r.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);

    const showHoldProgress = dragHoldProgress?.id === collectionId;

    return (
      <ContextMenu key={collectionId}>
        <ContextMenuTrigger asChild>
          <div
            data-folder-id={collectionId}
            className={`relative ${
              isDragTarget ? "ring-2 ring-primary ring-offset-2" : ""
            } ${isDragging ? "opacity-50" : ""}`}
            onMouseDown={(e) => {
              // Only start drag hold if not already dragging and not clicking buttons or accordion trigger
              const target = e.target as HTMLElement;
              const isAccordionTrigger = target.closest(
                "[data-radix-accordion-trigger]"
              );
              const isButton = target.closest("button");
              if (
                !draggingItem &&
                !isButton &&
                !isAccordionTrigger &&
                e.button === 0
              ) {
                handleMouseDown(e, { id: collectionId, type: "collection" });
              }
            }}
            onMouseUp={(e) => {
              handleMouseUp();
              // Drop on mouse up if dragging onto this folder
              if (draggingItem && draggingItem.id !== collectionId) {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(collectionId);
                setDraggingItem(null);
              }
            }}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => {
              // Visual feedback for drag target
              if (draggingItem && draggingItem.id !== collectionId) {
                // Already handled by className
              }
            }}
            onClick={(e) => {
              // Only handle drop on click if we're dragging
              if (draggingItem && draggingItem.id !== collectionId) {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(collectionId);
                setDraggingItem(null);
              }
              // Otherwise, let clicks pass through to Folder component for expand/collapse
            }}
          >
            {showHoldProgress && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-75"
                      style={{ width: `${dragHoldProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            <Folder
              value={collectionId}
              element={collection.name}
              isSelect={isSelected}
              className="group relative"
            >
              <>
                {childCollections.map((child) => renderCollection(child.id))}
                {collectionRequests.map((request) => {
                  const isSelected = selectedRequestId === request.id;
                  const isDragging = draggingItem?.id === request.id;
                  const showHoldProgress = dragHoldProgress?.id === request.id;

                  return (
                    <ContextMenu key={request.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={`relative ${
                            isDragging ? "opacity-50" : ""
                          }`}
                          onMouseDown={(e) =>
                            handleMouseDown(e, {
                              id: request.id,
                              type: "request",
                            })
                          }
                          onMouseUp={(e) => {
                            handleMouseUp();
                          }}
                          onClick={(e) => {
                            // If dragging and clicking on a folder, drop
                            if (
                              draggingItem &&
                              draggingItem.type === "request"
                            ) {
                              const target = e.target as HTMLElement;
                              const folderElement =
                                target.closest("[data-folder-id]");
                              if (folderElement) {
                                const folderId =
                                  folderElement.getAttribute("data-folder-id");
                                if (folderId && draggingItem.id !== folderId) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDrop(folderId);
                                  setDraggingItem(null);
                                  return;
                                }
                              }
                            }
                            // Normal click to select
                            if (!draggingItem) {
                              setSelectedRequest(request.id);
                            }
                          }}
                          onMouseLeave={handleMouseLeave}
                        >
                          {showHoldProgress && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 rounded">
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-75"
                                    style={{
                                      width: `${dragHoldProgress.progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <File
                            value={request.id}
                            isSelect={isSelected}
                            onClick={() => setSelectedRequest(request.id)}
                            fileIcon={
                              <span
                                className={`text-[10px] font-medium ${
                                  request.method === "GET"
                                    ? "text-blue-400"
                                    : request.method === "POST"
                                    ? "text-green-400"
                                    : request.method === "PUT"
                                    ? "text-orange-400"
                                    : request.method === "PATCH"
                                    ? "text-yellow-400"
                                    : request.method === "DELETE"
                                    ? "text-red-400"
                                    : request.method === "HEAD"
                                    ? "text-purple-400"
                                    : request.method === "OPTIONS"
                                    ? "text-cyan-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {request.method}
                              </span>
                            }
                            className="flex items-center gap-2"
                          >
                            <span className="flex-1 truncate">
                              {request.name}
                            </span>
                            {request.authExtraction?.enabled && (
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </File>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => handleDeleteRequest(request.id)}
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </>
            </Folder>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleCreateRequest(collectionId)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Request
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleMoveUp(collectionId)}
            disabled={!canMoveUp(collectionId)}
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Move Up
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleMoveDown(collectionId)}
            disabled={!canMoveDown(collectionId)}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Move Down
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleDeleteCollection(collectionId)}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const rootCollections = collections
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="p-2">
        <div className="flex gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start"
            onClick={handleCreateCollection}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Upload className="h-4 w-4" />
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowImportCurlDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import cURL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowImportPostmanDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Postman
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tree
          className="bg-background"
          initialSelectedId={
            selectedCollectionId || selectedRequestId || undefined
          }
          initialExpandedItems={initialExpandedItems}
        >
          {rootCollections.map((collection) => renderCollection(collection.id))}
        </Tree>
      </div>
      <PromptDialog
        open={showCollectionPrompt}
        onOpenChange={setShowCollectionPrompt}
        message="Collection name:"
        placeholder="Enter collection name"
        onConfirm={handleConfirmCollection}
      />
      <PromptDialog
        open={showRequestPrompt}
        onOpenChange={setShowRequestPrompt}
        message="Request name:"
        placeholder="Enter request name"
        onConfirm={handleConfirmRequest}
      />
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={`Delete ${
          deleteDialog.type === "collection" ? "Collection" : "Request"
        }?`}
        message={
          deleteDialog.type === "collection"
            ? `Are you sure you want to delete "${deleteDialog.name}"? This will also delete all folders and requests inside it. This action cannot be undone.`
            : `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`
        }
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ImportCurlDialog
        open={showImportCurlDialog}
        onOpenChange={setShowImportCurlDialog}
      />
      <ImportPostmanDialog
        open={showImportPostmanDialog}
        onOpenChange={setShowImportPostmanDialog}
      />
    </>
  );
}
