"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads";
import { IconTile } from "@/components/ui/IconTile";
import { customerErrorMessage, validateCustomerFields } from "@/lib/customer-feedback";

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
    const validation = validateCustomerFields([["Name", form.name], ["Company name", form.company], ["Email address", form.email, "email", 254], ["Phone number", form.phone]]);
    if (validation) {
      setError(validation);
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
      setError(customerErrorMessage(cause, "We could not confirm your enquiry. Try again shortly, or contact sales by phone or WhatsApp."));
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="card p-6 text-center sm:p-10">
        <span className="icon-tile mx-auto h-14 w-14 bg-emerald-50 text-emerald-600" aria-hidden="true">
          <CheckCircleIcon />
        </span>
        <p className="mt-4 text-xl font-extrabold text-navy-900">Enquiry received</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-steel-600">
          Your reference is <span className="font-mono font-semibold text-navy-800">{reference}</span>. The
          clearance desk will respond during the next working day.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="/account/enquiries" className="btn-primary">
            View enquiry dashboard
          </a>
          <a href="/clearance" className="btn-outline">
            Continue browsing
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-4 sm:p-6">
      <div className="flex items-center gap-3 border-b border-navy-100 pb-4">
        <IconTile>
          <MessageIcon />
        </IconTile>
        <div>
          <h2 className="text-h4 text-navy-900">Enquiry details</h2>
          <p className="text-xs text-steel-500">Fields marked * are required.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <select className="field" value={form.enquiryType} onChange={(e) => update("enquiryType", e.target.value as FormState["enquiryType"])} required>
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
      <div className="mt-6 flex flex-col items-start gap-3 border-t border-navy-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="order-2 text-[11px] text-steel-500 sm:order-1">Used only to respond to this enquiry.</p>
        <button type="submit" disabled={state === "sending"} className="btn-primary order-1 w-full sm:order-2 sm:w-auto">
          {state === "sending" ? "Submitting..." : "Submit Enquiry"}
        </button>
      </div>
    </form>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 5h16v11H9l-5 4V5z" strokeLinejoin="round" />
      <path d="M8 9h8M8 12.5h5" strokeLinecap="round" />
    </svg>
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
