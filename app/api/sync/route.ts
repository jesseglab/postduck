import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncToCloud, syncFromCloud } from "@/lib/sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { direction } = await request.json();

    if (direction === "to-cloud") {
      await syncToCloud(session.user.id);
      return NextResponse.json({ success: true, message: "Synced to cloud" });
    } else if (direction === "from-cloud") {
      await syncFromCloud(session.user.id);
      return NextResponse.json({ success: true, message: "Synced from cloud" });
    } else {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
