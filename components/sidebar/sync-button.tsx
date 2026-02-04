"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, CloudOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();

  const handleSync = async (direction: "to-cloud" | "from-cloud") => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        setAlertMessage("Sync completed successfully!");
        setAlertVariant("success");
        setShowAlert(true);
        router.refresh();
      } else {
        const data = await response.json();
        setAlertMessage(`Sync failed: ${data.error || "Unknown error"}`);
        setAlertVariant("error");
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage(
        `Sync error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setAlertVariant("error");
      setShowAlert(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleSync("to-cloud")}
          disabled={isSyncing}
        >
          <Cloud className="h-4 w-4 mr-2" />
          {isSyncing ? "Syncing..." : "Sync to Cloud"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleSync("from-cloud")}
          disabled={isSyncing}
        >
          <CloudOff className="h-4 w-4 mr-2" />
          {isSyncing ? "Syncing..." : "Sync from Cloud"}
        </Button>
        <Button
          variant="link"
          size="sm"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Login / Register
        </Button>
      </div>
      <AlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        message={alertMessage}
        variant={alertVariant}
      />
    </>
  );
}
