import { useState, useEffect, useCallback } from "react";
import type { Team, TeamMember, TeamInvitation, TeamRole } from "@/types";
import {
  canWrite,
  canManage,
  canManageBilling,
  canExecute,
} from "@/lib/permissions";

interface UseTeamOptions {
  teamId?: string | null;
}

export function useTeam(options?: UseTeamOptions) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const teamId = options?.teamId;

  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setLoading(false);
      return;
    }

    const fetchTeam = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch team");
        }
        const data = await response.json();
        setTeam(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch team");
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  return { team, loading, error };
}

export function useTeamMembers(teamId: string | null | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}/members`);
        if (!response.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await response.json();
        setMembers(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch members"
        );
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  const refetch = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to refetch members:", err);
    }
  }, [teamId]);

  return { members, loading, error, refetch };
}

export function useTeamRole(
  teamId: string | null | undefined,
  userId: string | null | undefined
) {
  const { members } = useTeamMembers(teamId);
  const member = members.find((m) => m.userId === userId);
  return member?.role || null;
}

export function useCanEdit(
  teamId: string | null | undefined,
  userId: string | null | undefined
) {
  const role = useTeamRole(teamId, userId);
  return canWrite(role);
}

export function useCanManage(
  teamId: string | null | undefined,
  userId: string | null | undefined
) {
  const role = useTeamRole(teamId, userId);
  return canManage(role);
}

export function useCanManageBilling(
  teamId: string | null | undefined,
  userId: string | null | undefined
) {
  const role = useTeamRole(teamId, userId);
  return canManageBilling(role);
}

export function useCanExecute(
  teamId: string | null | undefined,
  userId: string | null | undefined
) {
  const role = useTeamRole(teamId, userId);
  return canExecute(role);
}

export function useTeamInvitations(teamId: string | null | undefined) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams/${teamId}/invitations`);
        if (!response.ok) {
          throw new Error("Failed to fetch invitations");
        }
        const data = await response.json();
        setInvitations(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch invitations"
        );
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [teamId]);

  const refetch = useCallback(async () => {
    if (!teamId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (err) {
      console.error("Failed to refetch invitations:", err);
    }
  }, [teamId]);

  return { invitations, loading, error, refetch };
}
