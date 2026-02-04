"use client";

import { useAppStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
import { EnvironmentEditorDialog } from "@/components/modals/environment-editor-dialog";

export function EnvironmentSelector() {
  const { environments, activeEnvironmentId, setActiveEnvironment } =
    useAppStore();
  const [showEditor, setShowEditor] = useState(false);
  const activeEnv =
    environments.find((e) => e.id === activeEnvironmentId) ||
    environments.find((e) => e.isActive);

  return (
    <>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          Environment
        </div>
        <div className="flex gap-2">
          <Select
            value={activeEnv?.id || ""}
            onValueChange={(value) => setActiveEnvironment(value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowEditor(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EnvironmentEditorDialog open={showEditor} onOpenChange={setShowEditor} />
    </>
  );
}
