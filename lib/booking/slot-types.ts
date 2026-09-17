import type { AvailabilityException } from "@/lib/config/availability";
import type { Service } from "@/lib/config/services";

export type BookingInterval = {
  start: Date;
  end: Date;
};

export type BookingConflict = BookingInterval & {
  source: "appointment" | "calendar";
};

export type BookingWindow = BookingInterval & {
  timezone: string;
  patientBookingStartTimeIST?: string;
  patientBookingEndTimeIST?: string;
};

export type BookingConstraints = {
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

export type SlotGenerationRequest = {
  date: string;
  service: Service;
  timezone: string;
  constraints: BookingConstraints;
  availabilityWindows: BookingWindow[];
  exceptions: AvailabilityException[];
  conflicts: BookingConflict[];
  now?: Date;
};

export type BookableSlot = {
  start: Date;
  end: Date;
  timezone: string;
  serviceId: string;
};

export type SlotGenerationResult = {
  date: string;
  timezone: string;
  slots: BookableSlot[];
};
