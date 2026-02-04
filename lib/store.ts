import { create } from "zustand";
import type {
  Request,
  Collection,
  Environment,
  Workspace,
  AuthSession,
} from "@/types";

interface AppState {
  // Current selection
  selectedRequestId: string | null;
  selectedCollectionId: string | null;
  activeEnvironmentId: string | null;

  // Data
  requests: Request[];
  collections: Collection[];
  environments: Environment[];
  workspace: Workspace | null;
  authSessions: AuthSession[];

  // Actions
  setSelectedRequest: (id: string | null) => void;
  setSelectedCollection: (id: string | null) => void;
  setActiveEnvironment: (id: string) => void;
  setRequests: (requests: Request[]) => void;
  setCollections: (collections: Collection[]) => void;
  setEnvironments: (environments: Environment[]) => void;
  setWorkspace: (workspace: Workspace) => void;
  addRequest: (request: Request) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  deleteRequest: (id: string) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  setAuthSessions: (sessions: AuthSession[]) => void;
  addAuthSession: (session: AuthSession) => void;
  updateAuthSession: (id: string, updates: Partial<AuthSession>) => void;
  deleteAuthSession: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedRequestId: null,
  selectedCollectionId: null,
  activeEnvironmentId: null,
  requests: [],
  collections: [],
  environments: [],
  workspace: null,
  authSessions: [],

  setSelectedRequest: (id) => set({ selectedRequestId: id }),
  setSelectedCollection: (id) => set({ selectedCollectionId: id }),
  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
  setRequests: (requests) => set({ requests }),
  setCollections: (collections) => set({ collections }),
  setEnvironments: (environments) => set({ environments }),
  setWorkspace: (workspace) => set({ workspace }),

  addRequest: (request) =>
    set((state) => ({ requests: [...state.requests, request] })),
  updateRequest: (id, updates) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  deleteRequest: (id) =>
    set((state) => ({ requests: state.requests.filter((r) => r.id !== id) })),

  addCollection: (collection) =>
    set((state) => ({ collections: [...state.collections, collection] })),
  updateCollection: (id, updates) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  deleteCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),

  setAuthSessions: (sessions) => set({ authSessions: sessions }),
  addAuthSession: (session) =>
    set((state) => ({ authSessions: [...state.authSessions, session] })),
  updateAuthSession: (id, updates) =>
    set((state) => ({
      authSessions: state.authSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteAuthSession: (id) =>
    set((state) => ({
      authSessions: state.authSessions.filter((s) => s.id !== id),
    })),
}));
