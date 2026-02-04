"use client";

import { useState } from "react";
import { getRoleDisplayName, getRoleDescription } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TeamRole } from "@/types";

interface RoleSelectorProps {
  currentRole: TeamRole;
  onRoleChange: (role: TeamRole) => void;
}

export function RoleSelector({ currentRole, onRoleChange }: RoleSelectorProps) {
  const roles: TeamRole[] = [
    "SPACE_COMMANDER",
    "STAR_NAVIGATOR",
    "COSMIC_OBSERVER",
  ];

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onRoleChange(role)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            currentRole === role
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={currentRole === role ? "default" : "outline"}>
                  {getRoleDisplayName(role)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(role)}
              </p>
            </div>
            {currentRole === role && (
              <div className="size-5 rounded-full bg-primary flex items-center justify-center">
                <div className="size-2 rounded-full bg-primary-foreground" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
