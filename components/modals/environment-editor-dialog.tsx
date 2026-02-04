"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createEnvironment, updateEnvironment } from "@/hooks/use-local-db";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EnvironmentVariable } from "@/types";

interface EnvironmentEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvironmentEditorDialog({
  open,
  onOpenChange,
}: EnvironmentEditorDialogProps) {
  const { environments, workspace, activeEnvironmentId, setActiveEnvironment } =
    useAppStore();
  const [selectedEnvId, setSelectedEnvId] = useState<string>("");
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [envName, setEnvName] = useState("");

  useEffect(() => {
    if (open) {
      const activeEnv =
        environments.find((e) => e.id === activeEnvironmentId) ||
        environments.find((e) => e.isActive) ||
        environments[0];
      if (activeEnv) {
        setSelectedEnvId(activeEnv.id);
        setEnvName(activeEnv.name);
        setVariables([...activeEnv.variables]);
      }
    }
  }, [open, environments, activeEnvironmentId]);

  const handleSave = async () => {
    if (!workspace) return;

    const env = environments.find((e) => e.id === selectedEnvId);
    if (env) {
      await updateEnvironment(selectedEnvId, {
        name: envName,
        variables,
      });
    } else {
      await createEnvironment({
        workspaceId: workspace.id,
        name: envName,
        isActive: false,
        variables,
      });
    }
    onOpenChange(false);
  };

  const handleAddVariable = () => {
    setVariables([
      ...variables,
      { id: `var_${Date.now()}`, key: "", value: "", isSecret: false },
    ]);
  };

  const handleVariableChange = (
    index: number,
    field: keyof EnvironmentVariable,
    value: string | boolean
  ) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
          <DialogDescription>
            Manage environment variables for your requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Environment Name
            </label>
            <Input
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              placeholder="e.g., Production, Development"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Variables</label>
              <Button variant="outline" size="sm" onClick={handleAddVariable}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>

            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-2">
                {variables.map((variable, index) => (
                  <div key={variable.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Key"
                      value={variable.key}
                      onChange={(e) =>
                        handleVariableChange(index, "key", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      type={variable.isSecret ? "password" : "text"}
                      placeholder="Value"
                      value={variable.value}
                      onChange={(e) =>
                        handleVariableChange(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVariable(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No variables. Click "Add Variable" to create one.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
