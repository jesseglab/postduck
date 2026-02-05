"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Terminal, ExternalLink } from "lucide-react";

interface AgentInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentInstallDialog({
  open,
  onOpenChange,
}: AgentInstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Postduck Agent Required</DialogTitle>
          <DialogDescription>
            To make requests to{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              localhost
            </code>{" "}
            URLs from the web app, you need to run the Postduck Agent on your
            local machine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Why is this needed?</h3>
            <p className="text-sm text-muted-foreground">
              When using postduck.org, requests to{" "}
              <code className="text-xs bg-background px-1 py-0.5 rounded">
                localhost
              </code>{" "}
              URLs fail because the server-side proxy runs on the production
              server, not your local machine. The Postduck Agent runs locally
              and proxies these requests, allowing you to test your local APIs
              from the web app.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Quick Start (Recommended)</h3>
            <div className="bg-background border rounded-lg p-3 font-mono text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="flex-1">npx postduck-agent</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText("npx postduck-agent");
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Run this command in your terminal. The agent will start on{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                localhost:19199
              </code>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Alternative Options</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Install globally</p>
                  <p className="text-xs text-muted-foreground">
                    npm install -g postduck-agent
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "npm install -g postduck-agent"
                    );
                  }}
                >
                  Copy
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Download binary</p>
                  <p className="text-xs text-muted-foreground">
                    Pre-built binaries for macOS, Windows, and Linux
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(
                      "https://github.com/yourusername/postduck/releases",
                      "_blank"
                    );
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Tip:</strong> Once the agent is running, this dialog won't
              appear again. The web app will automatically detect and use the
              agent for localhost requests.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              window.open(
                "https://github.com/yourusername/postduck/blob/main/agent/README.md",
                "_blank"
              );
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Documentation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
