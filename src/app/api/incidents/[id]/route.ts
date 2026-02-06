import { NextResponse } from "next/server";
import {
  getIncident,
  listUpdatesForIncident,
  listEventsForIncident,
} from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await getIncident(id);
    if (!incident) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updates, events] = await Promise.all([
      listUpdatesForIncident(id),
      listEventsForIncident(id),
    ]);

    return NextResponse.json({
      ...incident,
      incident_updates: updates,
      events,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
