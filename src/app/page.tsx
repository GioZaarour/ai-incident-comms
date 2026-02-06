"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BriefForm } from "@/components/brief-form/brief-form";
import type { Incident } from "@/lib/supabase/types";

export default function HomePage() {
  const [mode, setMode] = useState<"new" | "update">("new");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIncidents(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) {
      setLastUpdate(null);
      return;
    }
    // Fetch Statuspage incident to get latest update
    const incident = incidents.find((i) => i.id === selectedIncidentId);
    if (!incident?.statuspage_incident_id) {
      setLastUpdate(null);
      return;
    }

    setLoading(true);
    fetch(`/api/statuspage/incidents/${incident.statuspage_incident_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.incident_updates?.length > 0) {
          const latest = data.incident_updates[0];
          setLastUpdate(`[${latest.status}] ${latest.body}`);
        } else {
          setLastUpdate(null);
        }
      })
      .catch(() => setLastUpdate(null))
      .finally(() => setLoading(false));
  }, [selectedIncidentId, incidents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Incident Brief</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill out the incident details below. The AI pipeline will draft and review
          a Statuspage update for approval.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "update")}>
        <TabsList>
          <TabsTrigger value="new">New Incident</TabsTrigger>
          <TabsTrigger value="update">Update Existing</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <BriefForm />
        </TabsContent>

        <TabsContent value="update" className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Incident</label>
            <Select
              value={selectedIncidentId}
              onValueChange={setSelectedIncidentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an active incident..." />
              </SelectTrigger>
              <SelectContent>
                {incidents.map((inc) => (
                  <SelectItem key={inc.id} value={inc.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {inc.severity.toUpperCase()}
                    </span>
                    {inc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIncidentId && (
            <BriefForm
              key={selectedIncidentId}
              existingIncidentId={selectedIncidentId}
              lastPublishedUpdate={loading ? "Loading..." : lastUpdate}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
