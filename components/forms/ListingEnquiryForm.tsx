"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads";

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  enquiryType: "product_enquiry" | "whole_lot_enquiry" | "equipment_enquiry";
  reference: string;
  quantity: string;
  budget: string;
  message: string;
}

const EMPTY: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  enquiryType: "product_enquiry",
  reference: "",
  quantity: "",
  budget: "",
  message: "",
};

const ENQUIRY_TYPES: { value: FormState["enquiryType"]; label: string }[] = [
  { value: "product_enquiry", label: "Product enquiry" },
  { value: "whole_lot_enquiry", label: "Whole lot enquiry" },
  { value: "equipment_enquiry", label: "Equipment enquiry" },
];

export function ListingEnquiryForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.company.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please provide your name, company, email and phone number.");
      return;
    }

    setState("sending");
    try {
      const quantity = form.quantity.trim() ? Number(form.quantity) : undefined;
      if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
        setState("idle");
        setError("Quantity must be a whole number greater than zero.");
        return;
      }
      const lead = await submitLead({
        lead_type: form.enquiryType,
        company: form.company.trim(),
        contact: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        enquiry_type: ENQUIRY_TYPES.find((type) => type.value === form.enquiryType)?.label,
        sku: form.reference.trim() || undefined,
        quantity,
        budget: form.budget.trim() || undefined,
        message: form.message.trim() || undefined,
        source: "enquiry_page",
      });
      setReference(lead.lead_id);
      setState("done");
    } catch (cause) {
      setState("idle");
      setError(
        cause instanceof Error && cause.message !== "Failed to fetch"
          ? cause.message
          : "Something went wrong. Please try again or use WhatsApp.",
      );
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-4 sm:p-6">
        <p className="text-lg font-bold text-emerald-900">Enquiry received</p>
        <p className="mt-2 text-sm text-emerald-800">
          Your reference is <span className="font-mono font-semibold">{reference}</span>. The
          clearance desk will respond during the next working day.
        </p>
        <a href="/account/enquiries" className="btn-outline btn-sm mt-5">
          View enquiry dashboard
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-navy-100 bg-white p-4 shadow-card sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input className="field" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </Field>
        <Field label="Company" required>
          <input className="field" value={form.company} onChange={(e) => update("company", e.target.value)} required />
        </Field>
        <Field label="Email" required>
          <input type="email" className="field" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </Field>
        <Field label="Phone" required>
          <input type="tel" autoComplete="tel" className="field" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
        </Field>
        <Field label="Country">
          <input className="field" value={form.country} onChange={(e) => update("country", e.target.value)} />
        </Field>
        <Field label="Enquiry type" required>
          <select className="field" value={form.enquiryType} onChange={(e) => update("enquiryType", e.target.value as FormState["enquiryType"])}>
            {ENQUIRY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Product / SKU / Lot reference">
          <input
            className="field"
            value={form.reference}
            onChange={(e) => update("reference", e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Quantity required">
          <input
            type="number"
            min={1}
            step={1}
            className="field"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Budget / target price">
          <input
            className="field"
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Message">
            <textarea
              rows={5}
              className="field resize-y"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Tell us about your requirement, delivery location or timescales."
            />
          </Field>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-md border border-signal-200 bg-signal-50 px-4 py-3 text-sm font-semibold text-signal-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "sending"} className="btn-primary w-full sm:w-auto">
          {state === "sending" ? "Submitting..." : "Submit Enquiry"}
        </button>
        <p className="text-[11px] text-steel-500">Used only to respond to this enquiry.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required ? <span className="text-signal-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
