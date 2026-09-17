import { ArrowLeft, ArrowRight, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patientCountries } from "@/lib/booking/countries";

export type BookingDetails = { name: string; email: string; phoneCountryCode: string; phoneNumber: string; country: string };

interface BookingDetailsFormProps { details: BookingDetails; onChange: (details: BookingDetails) => void; onBack: () => void; onContinue: () => void; }

export function BookingDetailsForm({ details, onChange, onBack, onContinue }: BookingDetailsFormProps) {
  const valid = details.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(details.email.trim()) && /^\+\d{1,4}$/.test(details.phoneCountryCode) && /^[0-9\s().-]{5,20}$/.test(details.phoneNumber.trim()) && patientCountries.some((country) => country.code === details.country);
  return (
    <section aria-labelledby="details-step-title" className="space-y-6">
      <div><p className="text-sm font-medium text-muted-foreground">Step 3 of 4</p><h2 id="details-step-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">A few details</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Just the essentials needed to prepare your appointment. No account is required.</p></div>
      <div className="grid gap-5 rounded-2xl border bg-background p-5 sm:p-6">
        <div className="grid gap-2"><Label htmlFor="booking-name"><UserRound aria-hidden="true" className="size-4" /> Full name</Label><Input id="booking-name" autoComplete="name" value={details.name} onChange={(event) => onChange({ ...details, name: event.target.value })} placeholder="Your name" aria-required="true" /></div>
        <div className="grid gap-2"><Label htmlFor="booking-email"><Mail aria-hidden="true" className="size-4" /> Email address</Label><Input id="booking-email" type="email" autoComplete="email" value={details.email} onChange={(event) => onChange({ ...details, email: event.target.value })} placeholder="you@example.com" aria-required="true" /><p className="text-xs leading-5 text-muted-foreground">We’ll use this for appointment details and future management links.</p></div>
        <div className="grid gap-2"><Label htmlFor="booking-country">Country</Label><select id="booking-country" autoComplete="country" value={details.country} onChange={(event) => { const selected = patientCountries.find((country) => country.code === event.target.value); onChange({ ...details, country: event.target.value, phoneCountryCode: selected?.dialCode ?? details.phoneCountryCode }); }} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" aria-required="true"><option value="">Select your country</option>{patientCountries.map((country) => <option key={country.code} value={country.code}>{country.name} ({country.dialCode})</option>)}</select></div>
        <div className="grid gap-2"><Label htmlFor="booking-phone"><Phone aria-hidden="true" className="size-4" /> Phone number</Label><div className="grid grid-cols-[minmax(7rem,9rem)_1fr] gap-2"><select id="booking-phone-country" aria-label="Phone country code" value={details.phoneCountryCode} onChange={(event) => onChange({ ...details, phoneCountryCode: event.target.value })} className="h-11 rounded-lg border border-input bg-background px-2 text-sm" aria-required="true"><option value="">Code</option>{patientCountries.map((country) => <option key={`${country.code}-phone`} value={country.dialCode}>{country.dialCode} · {country.name}</option>)}</select><Input id="booking-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={details.phoneNumber} onChange={(event) => onChange({ ...details, phoneNumber: event.target.value })} placeholder="Phone number" aria-required="true" /></div><p className="text-xs leading-5 text-muted-foreground">Select the country code, then enter your phone number without the country code.</p></div>
      </div>
      <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">Please avoid sharing clinical or sensitive information in this form. Scheduling only needs your contact details.</div>
      <div className="flex flex-col-reverse justify-between gap-3 border-t pt-6 sm:flex-row"><Button variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back</Button><Button size="lg" disabled={!valid} onClick={onContinue}>Review booking <ArrowRight aria-hidden="true" /></Button></div>
    </section>
  );
}
