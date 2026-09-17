"use client";

import { useState } from "react";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type AvailabilityRule, type DayOfWeek, validateAvailabilityRule } from "@/lib/config/availability";

interface AvailabilityRuleFormProps { initialRule?: AvailabilityRule; onCancel?: () => void; onSubmit?: (rule: AvailabilityRule) => void; onSubmitRules?: (rules: AvailabilityRule[]) => void; }
interface AvailabilityRuleFormValues { daysOfWeek: DayOfWeek[]; startTime: string; endTime: string; timezone: string; active: boolean; patientBookingStartTimeIST: string; patientBookingEndTimeIST: string; }
const dayOptions: { value: DayOfWeek; label: string }[] = [{ value: "sunday", label: "Sun" }, { value: "monday", label: "Mon" }, { value: "tuesday", label: "Tue" }, { value: "wednesday", label: "Wed" }, { value: "thursday", label: "Thu" }, { value: "friday", label: "Fri" }, { value: "saturday", label: "Sat" }];
function getBrowserTimezone() { return typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"; }
function getInitialValues(rule?: AvailabilityRule): AvailabilityRuleFormValues { return { daysOfWeek: rule ? [rule.dayOfWeek] : ["monday"], startTime: rule?.startTime ?? "09:00", endTime: rule?.endTime ?? "17:00", timezone: rule?.timezone ?? getBrowserTimezone(), active: rule?.active ?? true, patientBookingStartTimeIST: rule?.patientBookingStartTimeIST ?? "", patientBookingEndTimeIST: rule?.patientBookingEndTimeIST ?? "" }; }
function createRuleId(dayOfWeek: DayOfWeek, startTime: string) { return `${dayOfWeek}-${startTime.replace(":", "")}`; }

export function AvailabilityRuleForm({ initialRule, onCancel, onSubmit, onSubmitRules }: AvailabilityRuleFormProps) {
  const [values, setValues] = useState<AvailabilityRuleFormValues>(getInitialValues(initialRule));
  const [error, setError] = useState("");
  function updateValue<K extends keyof AvailabilityRuleFormValues>(field: K, value: AvailabilityRuleFormValues[K]) { setValues((current) => ({ ...current, [field]: value })); setError(""); }
  function toggleDay(day: DayOfWeek) { setValues((current) => ({ ...current, daysOfWeek: current.daysOfWeek.includes(day) ? current.daysOfWeek.filter((item) => item !== day) : [...current.daysOfWeek, day] })); setError(""); }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.daysOfWeek.length) { setError("Please select at least one day."); return; }
    const rules = values.daysOfWeek.map((dayOfWeek) => ({ id: initialRule?.dayOfWeek === dayOfWeek ? initialRule.id : createRuleId(dayOfWeek, values.startTime), dayOfWeek, startTime: values.startTime, endTime: values.endTime, timezone: values.timezone.trim(), active: values.active, patientBookingStartTimeIST: values.patientBookingStartTimeIST.trim() || undefined, patientBookingEndTimeIST: values.patientBookingEndTimeIST.trim() || undefined }));
    for (const rule of rules) { const validationError = validateAvailabilityRule(rule); if (validationError) { setError(validationError); return; } }
    if (onSubmitRules) { onSubmitRules(rules); return; }
    onSubmit?.(rules[0]);
  }

  return <form onSubmit={handleSubmit} className="space-y-8">
    <div className="space-y-3"><Label>Days</Label><p className="text-sm leading-6 text-muted-foreground">Choose one or more days that share these same hours.</p><div className="flex flex-wrap gap-2 sm:gap-3">{dayOptions.map((day) => { const selected = values.daysOfWeek.includes(day.value); return <button key={day.value} type="button" aria-pressed={selected} aria-label={day.label} onClick={() => toggleDay(day.value)} className={`flex size-11 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-12 ${selected ? "border-black bg-black text-white" : "border-black/15 bg-white text-black hover:border-black hover:bg-black/5"}`}>{day.label}</button>; })}</div></div>
    <div className="grid gap-6 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="availability-start-time">Start time</Label><Input id="availability-start-time" type="time" value={values.startTime} onChange={(event) => updateValue("startTime", event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="availability-end-time">End time</Label><Input id="availability-end-time" type="time" value={values.endTime} onChange={(event) => updateValue("endTime", event.target.value)} required /></div><TimezoneSelect id="availability-timezone" value={values.timezone} onChange={(value) => updateValue("timezone", value)} required className="sm:col-span-2" /></div>
    <div className="rounded-2xl border p-5"><div className="space-y-4"><div><Label>Patient-visible India time window (optional)</Label><p className="mt-1 text-sm leading-6 text-muted-foreground">Use this as an extra safety guard. Slots outside this IST window are hidden from patients even if the calendar says you are free. If the end time is earlier than the start time, the window continues past midnight.</p></div><div className="grid gap-6 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="availability-patient-start-ist">India start time</Label><Input id="availability-patient-start-ist" type="time" value={values.patientBookingStartTimeIST} onChange={(event) => updateValue("patientBookingStartTimeIST", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="availability-patient-end-ist">India end time</Label><Input id="availability-patient-end-ist" type="time" value={values.patientBookingEndTimeIST} onChange={(event) => updateValue("patientBookingEndTimeIST", event.target.value)} /></div></div><p className="text-xs text-muted-foreground">Example: 06:00 → 01:00 allows bookings from 6:00 AM IST through 1:00 AM IST the next day. Leave both fields empty for no additional India-time restriction.</p></div></div>
    <div className="rounded-2xl border p-5"><div className="flex items-center justify-between gap-4"><div><Label htmlFor="availability-active">Active availability</Label><p className="mt-1 text-sm leading-6 text-muted-foreground">Active rules can be used when calculating bookable appointment times.</p></div><Switch id="availability-active" checked={values.active} onCheckedChange={(checked) => updateValue("active", checked)} /></div></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}<Button type="submit">{initialRule ? "Save changes" : "Add availability"}</Button></div>
  </form>;
}
