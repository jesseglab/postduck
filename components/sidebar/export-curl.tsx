"use client";

import { useState } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { requestToCurl } from "@/lib/curl-parser";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function ExportCurl() {
  const selectedRequest = useSelectedRequest();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleExport = () => {
    if (!selectedRequest) return;

    const curlCommand = requestToCurl(selectedRequest);

    // Copy to clipboard
    navigator.clipboard.writeText(curlCommand).then(() => {
      setAlertMessage("cURL command copied to clipboard!");
      setShowAlert(true);
    });
  };

  if (!selectedRequest) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleExport}
      >
        <Download className="h-4 w-4 mr-2" />
        Export as cURL
      </Button>
      <AlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        message={alertMessage}
        variant="success"
      />
    </>
  );
}
