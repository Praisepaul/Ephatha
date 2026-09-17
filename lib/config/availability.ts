export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type AvailabilityRule = { id: string; dayOfWeek: DayOfWeek; startTime: string; endTime: string; timezone: string; active: boolean; patientBookingStartTimeIST?: string; patientBookingEndTimeIST?: string; };
export type AvailabilityExceptionType = "unavailable" | "unavailable-hours" | "custom-hours";
export type AvailabilityException = { id: string; date: string; startTime?: string; endTime?: string; reason?: string; type: AvailabilityExceptionType; };

export const availabilityRules: AvailabilityRule[] = [
  { id: "monday-morning", dayOfWeek: "monday", startTime: "09:00", endTime: "12:00", timezone: "Asia/Kolkata", active: true },
  { id: "monday-afternoon", dayOfWeek: "monday", startTime: "14:00", endTime: "17:00", timezone: "Asia/Kolkata", active: true },
  { id: "tuesday-morning", dayOfWeek: "tuesday", startTime: "09:00", endTime: "12:00", timezone: "Asia/Kolkata", active: true },
  { id: "tuesday-afternoon", dayOfWeek: "tuesday", startTime: "14:00", endTime: "17:00", timezone: "Asia/Kolkata", active: true },
  { id: "wednesday-morning", dayOfWeek: "wednesday", startTime: "09:00", endTime: "12:00", timezone: "Asia/Kolkata", active: true },
  { id: "wednesday-afternoon", dayOfWeek: "wednesday", startTime: "14:00", endTime: "17:00", timezone: "Asia/Kolkata", active: true },
  { id: "thursday-morning", dayOfWeek: "thursday", startTime: "09:00", endTime: "12:00", timezone: "Asia/Kolkata", active: true },
  { id: "thursday-afternoon", dayOfWeek: "thursday", startTime: "14:00", endTime: "17:00", timezone: "Asia/Kolkata", active: true },
  { id: "friday-morning", dayOfWeek: "friday", startTime: "09:00", endTime: "12:00", timezone: "Asia/Kolkata", active: true },
  { id: "friday-afternoon", dayOfWeek: "friday", startTime: "14:00", endTime: "17:00", timezone: "Asia/Kolkata", active: true },
];
export const availabilityExceptions: AvailabilityException[] = [];
const validDays = new Set<DayOfWeek>(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
function isValidTime(time: string) { if (!/^\d{2}:\d{2}$/.test(time)) return false; const [hours, minutes] = time.split(":").map(Number); return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59; }
function isValidTimezone(timezone: string) { try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return true; } catch { return false; } }

export function validateAvailabilityRule(rule: AvailabilityRule): string | null {
  if (!rule.id.trim()) return "An availability rule must have an id.";
  if (!validDays.has(rule.dayOfWeek)) return "Please select a valid day.";
  if (!isValidTime(rule.startTime) || !isValidTime(rule.endTime)) return "Availability times must use a valid HH:MM format.";
  if (!rule.timezone.trim()) return "Please provide a timezone.";
  if (!isValidTimezone(rule.timezone.trim())) return "Please provide a valid IANA timezone.";
  const patientStart = rule.patientBookingStartTimeIST?.trim();
  const patientEnd = rule.patientBookingEndTimeIST?.trim();
  if ((patientStart && !patientEnd) || (!patientStart && patientEnd)) return "India booking visibility requires both a start and end time.";
  if (patientStart && !isValidTime(patientStart)) return "India booking visibility start time must use HH:MM format.";
  if (patientEnd && !isValidTime(patientEnd)) return "India booking visibility end time must use HH:MM format.";
  return null;
}

export function isAvailabilityException(exception: AvailabilityException): boolean { return exception.type === "unavailable" || exception.type === "unavailable-hours" || exception.type === "custom-hours"; }
export function isFullDayException(exception: AvailabilityException): boolean { return exception.type === "unavailable"; }
export function isPartialDayException(exception: AvailabilityException): boolean { return (exception.type === "unavailable-hours" || exception.type === "custom-hours") && Boolean(exception.startTime && exception.endTime); }
function isValidDateString(date: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false; const [year, month, day] = date.split("-").map(Number); const parsedDate = new Date(Date.UTC(year, month - 1, day)); return parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day; }
export function validateAvailabilityException(exception: AvailabilityException): string | null {
  if (!exception.id.trim()) return "An availability exception must have an id.";
  if (!isValidDateString(exception.date)) return "Availability exception date must be a valid YYYY-MM-DD date.";
  if (!isAvailabilityException(exception)) return "Invalid availability exception type.";
  if (exception.type === "unavailable-hours" || exception.type === "custom-hours") {
    if (!exception.startTime || !exception.endTime) return "An hours-based exception requires both a start time and an end time.";
    if (!isValidTime(exception.startTime) || !isValidTime(exception.endTime)) return "Exception times must use a valid HH:MM format.";
    if (exception.startTime >= exception.endTime) return "Exception end time must be later than start time.";
  }
  return null;
}
