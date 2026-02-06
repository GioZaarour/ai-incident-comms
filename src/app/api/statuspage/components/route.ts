import { NextResponse } from "next/server";
import { listComponents } from "@/lib/statuspage/client";

export async function GET() {
  try {
    const components = await listComponents();
    return NextResponse.json(components);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
