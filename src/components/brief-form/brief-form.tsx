"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { briefSchema, type BriefFormValues } from "@/lib/shared/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SeveritySelect } from "./severity-select";
import { LifecycleSelect } from "./lifecycle-select";
import { ComponentSelector } from "./component-selector";
import { ScopeField } from "./scope-field";
import { Loader2 } from "lucide-react";

interface BriefFormProps {
  existingIncidentId?: string;
  lastPublishedUpdate?: string | null;
}

export function BriefForm({
  existingIncidentId,
  lastPublishedUpdate,
}: BriefFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BriefFormValues>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      severity: undefined,
      lifecycle_state: undefined,
      affected_components: [],
      customer_impact: "",
      scope: "all",
      scope_criterion: "",
      start_time: "",
      detection_time: "",
      mitigation_status: "",
      customer_action_required: "",
      next_update_eta: "",
      internal_notes: "",
      existing_incident_id: existingIncidentId,
      submitter_name: "",
    },
  });

  const lifecycleState = watch("lifecycle_state");
  const scope = watch("scope");

  const onSubmit = async (data: BriefFormValues) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error || "Submission failed");
        return;
      }

      router.push("/queue");
    } catch {
      setServerError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {lastPublishedUpdate && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4">
            <p className="mb-1 text-xs font-semibold uppercase text-blue-400">
              Last Published Update
            </p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {lastPublishedUpdate}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Your Name *</Label>
          <Input
            placeholder="e.g., Jane Doe"
            {...register("submitter_name")}
          />
          {errors.submitter_name && (
            <p className="text-xs text-destructive">
              {errors.submitter_name.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Severity *</Label>
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <SeveritySelect
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
          {errors.severity && (
            <p className="text-xs text-destructive">
              {errors.severity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Lifecycle Status *</Label>
          <Controller
            name="lifecycle_state"
            control={control}
            render={({ field }) => (
              <LifecycleSelect
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
          {errors.lifecycle_state && (
            <p className="text-xs text-destructive">
              {errors.lifecycle_state.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Affected Components *</Label>
        <Controller
          name="affected_components"
          control={control}
          render={({ field }) => (
            <ComponentSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.affected_components?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Customer Impact *</Label>
        <Textarea
          placeholder="Describe what customers are experiencing..."
          rows={3}
          {...register("customer_impact")}
        />
        {errors.customer_impact && (
          <p className="text-xs text-destructive">
            {errors.customer_impact.message}
          </p>
        )}
      </div>

      <Controller
        name="scope"
        control={control}
        render={({ field }) => (
          <ScopeField
            scope={field.value}
            scopeCriterion={watch("scope_criterion") ?? ""}
            onScopeChange={(v) => {
              field.onChange(v);
              if (v === "all") setValue("scope_criterion", "");
            }}
            onCriterionChange={(v) => setValue("scope_criterion", v)}
            error={errors.scope_criterion?.message}
          />
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Time *</Label>
          <Input type="datetime-local" {...register("start_time")} />
          {errors.start_time && (
            <p className="text-xs text-destructive">
              {errors.start_time.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Detection Time *</Label>
          <Input type="datetime-local" {...register("detection_time")} />
          {errors.detection_time && (
            <p className="text-xs text-destructive">
              {errors.detection_time.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mitigation Status *</Label>
        <Textarea
          placeholder="What actions are being taken (customer-safe terms)..."
          rows={2}
          {...register("mitigation_status")}
        />
        {errors.mitigation_status && (
          <p className="text-xs text-destructive">
            {errors.mitigation_status.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Customer Action Required</Label>
        <Input
          placeholder='Usually "none"'
          {...register("customer_action_required")}
        />
      </div>

      {lifecycleState !== "resolved" && (
        <div className="space-y-2">
          <Label>Next Update ETA *</Label>
          <Input
            placeholder="e.g., 30 minutes, 2024-01-15 14:00 UTC"
            {...register("next_update_eta")}
          />
          {errors.next_update_eta && (
            <p className="text-xs text-destructive">
              {errors.next_update_eta.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Internal Notes
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
            Internal Only
          </span>
        </Label>
        <Textarea
          placeholder="Context for internal use only — never externalized..."
          rows={3}
          {...register("internal_notes")}
          className="border-amber-500/20"
        />
      </div>

      {serverError && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Brief"
        )}
      </Button>
    </form>
  );
}
