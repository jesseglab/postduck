"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { AgentInstallDialog } from "@/components/modals/agent-install-dialog";
import { useState } from "react";

export function AgentStatusIndicator() {
  const { agentConnected } = useAppStore();
  const [showDialog, setShowDialog] = useState(false);

  if (agentConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-muted-foreground">Agent Connected</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => setShowDialog(true)}
      >
        <XCircle className="h-4 w-4 mr-2 text-red-500 shrink-0" />
        <span className="flex-1 text-left">Agent Not Connected</span>
        <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
      </Button>
      <AgentInstallDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
