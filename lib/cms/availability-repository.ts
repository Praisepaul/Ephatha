import { getMongoDb } from "@/lib/db/mongodb";
import { availabilityExceptions as defaultExceptions, availabilityRules as defaultRules, type AvailabilityException, type AvailabilityRule } from "@/lib/config/availability";

const collectionName = "cms_availability";
const documentId = "primary";

type AvailabilityDocument = {
  _id: string;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  updatedAt: Date;
};

function normalizeRules(rules: AvailabilityRule[]) {
  return rules.map((rule) => ({
    ...rule,
    id: rule.id.trim(),
    startTime: rule.startTime.trim(),
    endTime: rule.endTime.trim(),
    timezone: rule.timezone.trim(),
    patientBookingStartTimeIST: rule.patientBookingStartTimeIST?.trim() || undefined,
    patientBookingEndTimeIST: rule.patientBookingEndTimeIST?.trim() || undefined,
  }));
}

function normalizeExceptions(exceptions: AvailabilityException[]) {
  return exceptions.map((exception) => ({ ...exception, id: exception.id.trim(), date: exception.date.trim(), startTime: exception.startTime?.trim(), endTime: exception.endTime?.trim(), reason: exception.reason?.trim() }));
}

export async function getAvailabilityConfiguration(): Promise<{ rules: AvailabilityRule[]; exceptions: AvailabilityException[] }> {
  const document = await (await getMongoDb()).collection<AvailabilityDocument>(collectionName).findOne({ _id: documentId });
  return document ? { rules: normalizeRules(document.rules), exceptions: normalizeExceptions(document.exceptions) } : { rules: normalizeRules(defaultRules), exceptions: normalizeExceptions(defaultExceptions) };
}

export async function saveAvailabilityConfiguration(rules: AvailabilityRule[], exceptions: AvailabilityException[]) {
  const document = { _id: documentId, rules: normalizeRules(rules), exceptions: normalizeExceptions(exceptions), updatedAt: new Date() };
  await (await getMongoDb()).collection<AvailabilityDocument>(collectionName).replaceOne({ _id: documentId }, document, { upsert: true });
  return { rules: document.rules, exceptions: document.exceptions };
}
