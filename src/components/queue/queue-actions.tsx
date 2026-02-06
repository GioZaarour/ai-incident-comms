"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, MessageSquare, RotateCcw, Loader2 } from "lucide-react";
import type { UpdateStatus } from "@/lib/shared/constants";

interface QueueActionsProps {
  updateId: string;
  status: UpdateStatus;
  onAction: () => void;
}

type ActionType = "approve" | "deny" | "request-changes" | "retry";

export function QueueActions({ updateId, status, onAction }: QueueActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("approve");
  const [approverName, setApproverName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const openDialog = (type: ActionType) => {
    setActionType(type);
    setApproverName("");
    setReason("");
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!approverName) return;
    setLoading(true);

    try {
      const endpoint = `/api/queue/${updateId}/${actionType}`;
      const body: Record<string, string> = { approver_name: approverName };

      if (actionType === "deny") body.denial_reason = reason;
      if (actionType === "request-changes") body.change_feedback = reason;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Action failed");
        return;
      }

      setDialogOpen(false);
      onAction();
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const showApprove = status === "awaiting_approval";
  const showDeny = status === "awaiting_approval";
  const showRequestChanges = status === "awaiting_approval";
  const showRetry = status === "publish_failed";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {showApprove && (
          <Button
            size="sm"
            onClick={() => openDialog("approve")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="mr-1 h-4 w-4" />
            Approve & Publish
          </Button>
        )}
        {showRequestChanges && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDialog("request-changes")}
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Request Changes
          </Button>
        )}
        {showDeny && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => openDialog("deny")}
          >
            <X className="mr-1 h-4 w-4" />
            Deny
          </Button>
        )}
        {showRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDialog("retry")}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Retry Publish
          </Button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionType === "request-changes"
                ? "Request Changes"
                : actionType === "retry"
                  ? "Retry Publish"
                  : actionType}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Name *</Label>
              <Input
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="e.g., Jane Doe"
              />
            </div>
            {(actionType === "deny" || actionType === "request-changes") && (
              <div className="space-y-2">
                <Label>
                  {actionType === "deny" ? "Denial Reason *" : "Feedback *"}
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionType === "deny"
                      ? "Reason for denial..."
                      : "What changes are needed..."
                  }
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                loading ||
                !approverName ||
                ((actionType === "deny" || actionType === "request-changes") &&
                  !reason)
              }
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
