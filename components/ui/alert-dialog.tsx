"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AlertDialogVariant = "success" | "error" | "info" | "warning";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  variant?: AlertDialogVariant;
  confirmText?: string;
  onConfirm?: () => void;
}

const variantConfig: Record<
  AlertDialogVariant,
  { icon: React.ComponentType<{ className?: string }>; titleColor: string }
> = {
  success: {
    icon: CheckCircle2,
    titleColor: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: XCircle,
    titleColor: "text-red-600 dark:text-red-400",
  },
  info: {
    icon: Info,
    titleColor: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: AlertCircle,
    titleColor: "text-yellow-600 dark:text-yellow-400",
  },
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = "info",
  confirmText = "OK",
  onConfirm,
}: AlertDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={cn("size-5", config.titleColor)} />
            <DialogTitle className={cn(config.titleColor)}>
              {title ||
                (variant === "success"
                  ? "Success"
                  : variant === "error"
                  ? "Error"
                  : variant === "warning"
                  ? "Warning"
                  : "Information")}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} variant="default">
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
