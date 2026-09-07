import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/initDatabase";

export async function GET() {
  await initializeDatabase();
  return NextResponse.json({ success: true });
}
