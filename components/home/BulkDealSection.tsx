"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads";
import { customerErrorMessage, validateCustomerFields } from "@/lib/customer-feedback";

interface BulkForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  requirement: string;
  quantity: string;
  message: string;
}

const EMPTY: BulkForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  requirement: "",
  quantity: "",
  message: "",
};

export function BulkDealSection() {
  const [form, setForm] = useState<BulkForm>(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  function update<K extends keyof BulkForm>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const validation = validateCustomerFields([["Name", form.name], ["Company name", form.company], ["Email address", form.email, "email", 254]]);
    if (validation) {
      setError(validation);
      return;
    }
    setState("sending");
    try {
      const lead = await submitLead({
        lead_type: "bulk_deal",
        company: form.company,
        contact: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        budget: form.quantity,
        message: [form.requirement, form.message].filter(Boolean).join("\n"),
        source: "home_bulk_deal",
      });
      setReference(lead.lead_id);
      setState("done");
    } catch (error) {
      setState("idle");
      setError(customerErrorMessage(error, "We could not confirm your bulk enquiry. Try again shortly, or contact sales by phone or WhatsApp."));
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <p className="eyebrow text-brand-600">Bulk quantities &amp; complete lots</p>
        <h2 className="text-h2 mt-2 text-navy-900">
          Looking for volume or multiple products?
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-steel-600 sm:text-base">
          Send your requirements and the product references you are interested in. The team can
          follow up with the information currently available.
        </p>
        <dl className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            ["Product references", "Include the relevant SKU or part number."],
            ["Required quantity", "Tell us how many units you need."],
            ["Contact details", "Provide an email address for the response."],
          ].map(([title, copy]) => (
            <div key={title}>
              <dt className="text-sm font-bold text-navy-900">{title}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-steel-600">{copy}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-card border border-navy-200 bg-white p-6 shadow-lift">
        {state === "done" ? (
          <div>
            <p className="text-lg font-bold text-navy-900">Bulk enquiry received</p>
            <p className="mt-2 text-sm text-steel-600">
              Reference <span className="font-mono font-semibold text-navy-900">{reference}</span>. Our
              clearance desk will come back to you with availability and pricing.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY);
                setState("idle");
              }}
              className="btn-outline mt-5"
            >
              Send another enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <p className="text-xs text-steel-600 sm:col-span-2">Fields marked * are required.</p>
            <DarkField label="Name" value={form.name} onChange={(v) => update("name", v)} required />
            <DarkField label="Company" value={form.company} onChange={(v) => update("company", v)} required />
            <DarkField label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <DarkField label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <DarkField label="Country" value={form.country} onChange={(v) => update("country", v)} />
            <DarkField
              label="Approx. quantity / budget"
              value={form.quantity}
              onChange={(v) => update("quantity", v)}
              placeholder="Enter the required quantity or budget"
            />
            <div className="sm:col-span-2">
              <DarkField
                label="Product, category or lot reference"
                value={form.requirement}
                onChange={(v) => update("requirement", v)}
                placeholder="Enter a product type, SKU or reference"
              />
            </div>
            <label className="sm:col-span-2">
              <span className="field-label text-steel-300">Message</span>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Delivery location, timescales, inspection requirements."
                className="w-full rounded-md border border-navy-200 bg-navy-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-steel-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </label>
            {error ? (
              <p className="sm:col-span-2 rounded-md border border-signal-200 bg-signal-50 px-4 py-3 text-sm font-semibold text-signal-700">
                {error}
              </p>
            ) : null}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={state === "sending"} className="btn-primary">
                {state === "sending" ? "Sending..." : "Submit Bulk Enquiry"}
              </button>
              <span className="text-[11px] text-steel-600">
                No obligation. We will confirm what is genuinely available.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DarkField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="field-label text-navy-700">
        {label}
        {required ? <span className="text-brand-600"> *</span> : null}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-navy-200 bg-navy-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-steel-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
    </label>
  );
}
