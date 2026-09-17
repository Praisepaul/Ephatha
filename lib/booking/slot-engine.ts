import type { AvailabilityRule } from "@/lib/config/availability";
import { calculateAvailabilityWindows } from "@/lib/booking/availability-engine";
import { findBookingConflicts, type BookingConflictCheck } from "@/lib/booking/conflict-engine";
import type { BookableSlot, BookingConflict, BookingConstraints, BookingWindow, SlotGenerationRequest, SlotGenerationResult } from "@/lib/booking/slot-types";
import { addMinutes } from "@/lib/booking/time-utils";

function validateConstraints(constraints: BookingConstraints): void {
  const values: Array<[string, number]> = [["Minimum notice minutes", constraints.minimumNoticeMinutes], ["Maximum advance days", constraints.maximumAdvanceDays], ["Slot interval minutes", constraints.slotIntervalMinutes], ["Buffer before minutes", constraints.bufferBeforeMinutes], ["Buffer after minutes", constraints.bufferAfterMinutes]];
  for (const [name, value] of values) if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative finite number.`);
  if (constraints.slotIntervalMinutes <= 0) throw new Error("Slot interval minutes must be greater than zero.");
  if (!Number.isInteger(constraints.slotIntervalMinutes)) throw new Error("Slot interval minutes must be a whole number.");
  if (!Number.isInteger(constraints.maximumAdvanceDays)) throw new Error("Maximum advance days must be a whole number.");
}

function validateRequest(request: SlotGenerationRequest): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.date)) throw new Error(`Invalid booking date: ${request.date}.`);
  if (!request.timezone.trim()) throw new Error("Booking timezone is required.");
  if (Number.isNaN(request.service.durationMinutes) || request.service.durationMinutes <= 0) throw new Error("Service duration must be greater than zero.");
  if (!Number.isInteger(request.service.durationMinutes)) throw new Error("Service duration must be a whole number.");
  validateConstraints(request.constraints);
}

function isWithinBookingHorizon(slotStart: Date, request: SlotGenerationRequest): boolean {
  const now = request.now ?? new Date();
  const minimumStart = addMinutes(now, request.constraints.minimumNoticeMinutes);
  const maximumStart = addMinutes(now, request.constraints.maximumAdvanceDays * 24 * 60);
  return slotStart >= minimumStart && slotStart <= maximumStart;
}

function getMinutesInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

function isWithinPatientBookingWindow(slotStart: Date, slotEnd: Date, window: BookingWindow): boolean {
  const start = window.patientBookingStartTimeIST;
  const end = window.patientBookingEndTimeIST;
  if (!start || !end) return true;

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  if (startMinutes === endMinutes) return true;

  const slotStartMinutes = getMinutesInTimezone(slotStart, "Asia/Kolkata");
  const slotEndMinutes = getMinutesInTimezone(slotEnd, "Asia/Kolkata");

  if (startMinutes < endMinutes) return slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes;
  return (slotStartMinutes >= startMinutes && slotEndMinutes <= 24 * 60) || (slotStartMinutes >= 0 && slotEndMinutes <= endMinutes);
}

function createSlotsFromWindow(window: BookingWindow, request: SlotGenerationRequest): BookableSlot[] {
  const slots: BookableSlot[] = [];
  let slotStart = new Date(window.start);
  while (true) {
    const slotEnd = addMinutes(slotStart, request.service.durationMinutes);
    if (slotEnd > window.end) break;
    if (isWithinBookingHorizon(slotStart, request) && isWithinPatientBookingWindow(slotStart, slotEnd, window)) {
      const candidate: BookingConflictCheck = { start: slotStart, end: slotEnd, bufferBeforeMinutes: request.constraints.bufferBeforeMinutes, bufferAfterMinutes: request.constraints.bufferAfterMinutes };
      if (findBookingConflicts(candidate, request.conflicts).length === 0) {
        slots.push({ start: new Date(slotStart), end: new Date(slotEnd), timezone: request.timezone, serviceId: request.service.id });
      }
    }
    slotStart = addMinutes(slotStart, request.constraints.slotIntervalMinutes);
  }
  return slots;
}

export function generateBookableSlots(request: SlotGenerationRequest, rules: AvailabilityRule[]): SlotGenerationResult {
  validateRequest(request);
  const availabilityWindows = calculateAvailabilityWindows(request, rules);
  const slots = availabilityWindows.flatMap((window) => createSlotsFromWindow(window, request));
  return { date: request.date, timezone: request.timezone, slots };
}

export function filterBookableSlotsByConflicts(slots: BookableSlot[], conflicts: BookingConflict[], constraints: BookingConstraints): BookableSlot[] {
  validateConstraints(constraints);
  return slots.filter((slot) => findBookingConflicts({ start: slot.start, end: slot.end, bufferBeforeMinutes: constraints.bufferBeforeMinutes, bufferAfterMinutes: constraints.bufferAfterMinutes }, conflicts).length === 0);
}
