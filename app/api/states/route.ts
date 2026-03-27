import { getAllStates } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const states = getAllStates();
  return NextResponse.json(states);
}
