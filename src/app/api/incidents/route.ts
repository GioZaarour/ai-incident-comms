import { NextResponse } from "next/server";
import { listActiveIncidents, listAllIncidents } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const incidents = all
      ? await listAllIncidents()
      : await listActiveIncidents();
    return NextResponse.json(incidents);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
