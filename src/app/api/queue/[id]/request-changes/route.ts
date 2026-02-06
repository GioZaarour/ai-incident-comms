import { NextResponse } from "next/server";
import {
  getIncidentUpdate,
  updateIncidentUpdate,
  createEvent,
} from "@/lib/supabase/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approver_name, change_feedback } = body;

    if (!approver_name || !change_feedback) {
      return NextResponse.json(
        { error: "approver_name and change_feedback are required" },
        { status: 400 }
      );
    }

    const update = await getIncidentUpdate(id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    await updateIncidentUpdate(id, {
      status: "changes_requested",
      change_feedback,
    });

    await createEvent({
      incident_id: update.incident_id,
      update_id: id,
      type: "changes_requested",
      actor: approver_name,
      payload_json: { feedback: change_feedback },
    });

    return NextResponse.json({ status: "changes_requested" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
