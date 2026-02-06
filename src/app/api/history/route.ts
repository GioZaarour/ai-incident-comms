import { NextResponse } from "next/server";
import { listIncidentsWithEvents } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const incidents = await listIncidentsWithEvents();
    return NextResponse.json(incidents);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
