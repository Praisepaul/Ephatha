import type { ObjectId } from "mongodb";

export const appointmentStatuses = ["confirmed", "cancelled", "completed", "no_show"] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];
export const googleCalendarSyncStatuses = ["pending", "synced", "failed", "not_connected"] as const;
export type GoogleCalendarSyncStatus = (typeof googleCalendarSyncStatuses)[number];

export type AppointmentDocument = {
  _id?: ObjectId;
  confirmationToken: string;
  idempotencyKey: string;
  status: AppointmentStatus;
  service: { id: string; name: string; durationMinutes: number; online: boolean; inPerson: boolean };
  patient: { name: string; email: string; phoneCountryCode?: string; phoneNumber?: string; country?: string };
  startAt: Date;
  endAt: Date;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  googleCalendar?: { eventId?: string; syncStatus: GoogleCalendarSyncStatus; lastSyncedAt?: Date; lastSyncError?: string };
  googleMeet?: { joinUrl?: string };
};

export type AppointmentPublicView = {
  confirmationToken: string;
  status: AppointmentStatus;
  service: AppointmentDocument["service"];
  patientName: string;
  patientEmail: string;
  patientPhoneCountryCode?: string;
  patientPhoneNumber?: string;
  patientCountry?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt: string;
  cancelledAt?: string;
  googleMeet?: { joinUrl?: string };
};

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && appointmentStatuses.includes(value as AppointmentStatus);
}
