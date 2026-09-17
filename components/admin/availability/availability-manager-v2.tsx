"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityRuleForm } from "@/components/admin/availability/availability-rule-form";
import { AvailabilityExceptionForm } from "@/components/admin/availability/availability-exception-form";
import { AvailabilityQuickTools } from "@/components/admin/availability/availability-quick-tools";
import { AvailabilityRulesListV2 } from "@/components/admin/availability/availability-rules-list-v2";
import { AvailabilityExceptionsListV2 } from "@/components/admin/availability/availability-exceptions-list-v2";
import type { AvailabilityException, AvailabilityRule } from "@/lib/config/availability";

interface AvailabilityManagerV2Props { initialRules: AvailabilityRule[]; initialExceptions: AvailabilityException[]; }

export function AvailabilityManagerV2({ initialRules, initialExceptions }: AvailabilityManagerV2Props) {
  const [rules, setRules] = useState(initialRules);
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [editingRule, setEditingRule] = useState<AvailabilityRule>();
  const [editingException, setEditingException] = useState<AvailabilityException>();
  const [showNewRule, setShowNewRule] = useState(false);
  const [showNewException, setShowNewException] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const newRuleFormRef = useRef<HTMLDivElement | null>(null);
  const newExceptionFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (!showNewRule) return; requestAnimationFrame(() => newRuleFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }, [showNewRule]);
  useEffect(() => { if (!showNewException) return; requestAnimationFrame(() => newExceptionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }, [showNewException]);

  async function save(nextRules: AvailabilityRule[], nextExceptions: AvailabilityException[]) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules: nextRules, exceptions: nextExceptions }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't save availability.");
      setRules(data.rules); setExceptions(data.exceptions); close();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Couldn't save availability."); }
    finally { setBusy(false); }
  }

  function close() { setEditingRule(undefined); setEditingException(undefined); setShowNewRule(false); setShowNewException(false); }

  function saveRules(nextRulesFromForm: AvailabilityRule[]) {
    const replacingId = editingRule?.id;
    const remainingRules = replacingId ? rules.filter((rule) => rule.id !== replacingId) : rules;
    for (const rule of nextRulesFromForm) {
      const collision = remainingRules.find((existing) => existing.dayOfWeek === rule.dayOfWeek && existing.startTime === rule.startTime && existing.endTime === rule.endTime && existing.timezone === rule.timezone && existing.patientBookingStartTimeIST === rule.patientBookingStartTimeIST && existing.patientBookingEndTimeIST === rule.patientBookingEndTimeIST && existing.id !== rule.id);
      if (collision) { setError(`${rule.dayOfWeek.charAt(0).toUpperCase()}${rule.dayOfWeek.slice(1)} already has this availability window.`); return; }
    }
    const next = [...remainingRules];
    for (const rule of nextRulesFromForm) {
      const index = next.findIndex((existing) => existing.id === rule.id);
      if (index >= 0) next[index] = rule; else next.push(rule);
    }
    void save(next, exceptions);
  }

  function saveException(item: AvailabilityException) {
    const next = [...exceptions];
    const index = next.findIndex((exception) => exception.id === item.id);
    if (index >= 0) next[index] = item; else next.push(item);
    void save(rules, next);
  }

  return <div className="space-y-10">
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    <AvailabilityQuickTools rules={rules} exceptions={exceptions} busy={busy} onApply={(nextExceptions) => void save(rules, nextExceptions)} />
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Weekly availability</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Set your normal recurring hours. You can apply the same hours to several days at once.</p></div><Button type="button" onClick={() => { close(); setShowNewRule(true); }}><Plus className="size-4" />Add availability</Button></div>
      <AvailabilityRulesListV2 rules={rules} editingId={editingRule?.id} onEdit={(rule) => { setError(""); setEditingRule(rule); setShowNewRule(false); }} onSetActive={(id, active) => void save(rules.map((rule) => rule.id === id ? { ...rule, active } : rule), exceptions)} onDelete={(id) => void save(rules.filter((rule) => rule.id !== id), exceptions)} busy={busy} renderEditor={(rule) => <AvailabilityRuleForm key={rule.id} initialRule={rule} onCancel={close} onSubmitRules={saveRules} />} />
      {showNewRule && <div ref={newRuleFormRef} className="scroll-mt-24"><Card className="mt-4"><CardHeader><CardTitle>Add availability</CardTitle></CardHeader><CardContent><AvailabilityRuleForm onCancel={close} onSubmitRules={saveRules} /></CardContent></Card></div>}
    </section>
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Date-specific changes</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Use a specific date when a day differs from your normal weekly schedule. These changes take priority over recurring hours.</p></div><Button type="button" variant="outline" onClick={() => { close(); setShowNewException(true); }}><Plus className="size-4" />Add exception</Button></div>
      <AvailabilityExceptionsListV2 exceptions={exceptions} editingId={editingException?.id} onEdit={(item) => { setError(""); setEditingException(item); setShowNewException(false); }} onDelete={(id) => void save(rules, exceptions.filter((exception) => exception.id !== id))} busy={busy} renderEditor={(item) => <AvailabilityExceptionForm key={item.id} initialException={item} onCancel={close} onSubmit={saveException} />} />
      {showNewException && <div ref={newExceptionFormRef} className="scroll-mt-24"><Card className="mt-4"><CardHeader><CardTitle>Add exception</CardTitle></CardHeader><CardContent><AvailabilityExceptionForm onCancel={close} onSubmit={saveException} /></CardContent></Card></div>}
    </section>
  </div>;
}
