import { NextResponse } from "next/server";
import { listQueueItems } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const items = await listQueueItems(status);
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
