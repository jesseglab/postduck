"use client";

import { useEffect } from "react";
import { useLocalDB } from "@/hooks/use-local-db";
import { MainLayout } from "@/components/layout/main-layout";

export default function Home() {
  const { isInitialized } = useLocalDB();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <MainLayout />;
}
