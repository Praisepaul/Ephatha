# Booking timezone guardrails

## Purpose

Ephatha lets patients choose their browser timezone when viewing appointment availability. The booking engine still evaluates each candidate slot against the therapist's persisted availability, MongoDB appointment conflicts, Google Calendar busy time, booking constraints, and an optional India-time patient visibility window.

## Patient-facing timezone display

`components/public/booking/booking-date-time-picker.tsx` shows each slot in the patient's selected timezone and also shows the corresponding India Standard Time (IST).

`components/public/booking/booking-summary.tsx` repeats both times during the final review step.

## India-time visibility window

`lib/config/availability.ts` adds two optional fields to `AvailabilityRule`:

- `patientBookingStartTimeIST`
- `patientBookingEndTimeIST`

The fields are configured in `components/admin/availability/availability-rule-form.tsx` and persisted through `lib/cms/availability-repository.ts`.

The window is a safety guard, not a source of availability. A slot must still exist in the therapist's normal availability and Google Calendar/Mongo conflict checks before it can be shown.

If both fields are empty, no additional India-time restriction applies. If the end time is earlier than the start time, the visibility window crosses midnight. For example, `06:00` to `01:00` means 6:00 AM IST through 1:00 AM IST the following day.

`lib/booking/availability-engine.ts` carries the configured window with each availability window, and `lib/booking/slot-engine.ts` rejects candidate slots outside the configured IST interval. Slots that cross the boundary are rejected unless the complete session remains inside the configured window.

## Important distinction

The patient timezone is only a display/booking-input timezone. It must not be treated as the therapist's working timezone. The India-time guardrail exists specifically so a patient in another timezone cannot select a calendar-free slot that falls outside the therapist's permitted India-time patient window.
