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
    const { approver_name, denial_reason } = body;

    if (!approver_name || !denial_reason) {
      return NextResponse.json(
        { error: "approver_name and denial_reason are required" },
        { status: 400 }
      );
    }

    const update = await getIncidentUpdate(id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    await updateIncidentUpdate(id, {
      status: "denied",
      approved_by: approver_name,
      denial_reason,
    });

    await createEvent({
      incident_id: update.incident_id,
      update_id: id,
      type: "approval_denied",
      actor: approver_name,
      payload_json: { reason: denial_reason },
    });

    return NextResponse.json({ status: "denied" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
