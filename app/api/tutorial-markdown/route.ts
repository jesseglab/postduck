import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "GENERATE-POSTMAN-COLLECTION.md");
    const fileContent = await readFile(filePath, "utf-8");

    return NextResponse.json({ content: fileContent });
  } catch (error) {
    console.error("Error reading markdown file:", error);
    return NextResponse.json(
      { error: "Failed to read markdown file" },
      { status: 500 }
    );
  }
}
