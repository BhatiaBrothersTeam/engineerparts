"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leads";

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  message: string;
}

const EMPTY: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [adminEmailSent, setAdminEmailSent] = useState(true);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.company.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Please provide your name, company, email, phone and a message.");
      return;
    }
    setState("sending");
    try {
      const lead = await submitLead({
        lead_type: "general_contact",
        company: form.company,
        contact: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        message: form.message,
        source: "contact_page",
      });
      setReference(lead.lead_id);
      setAdminEmailSent(lead.admin_email_sent !== false);
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
        <p className="text-lg font-bold text-emerald-900">Message received</p>
        <p className="mt-2 text-sm text-emerald-800">
          Your reference is <span className="font-mono font-semibold">{reference}</span>. The
          team will respond during the next working day.
        </p>
        {!adminEmailSent ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-signal-700">
            Your message was saved, but the admin email could not be sent. Please contact the
            team and quote your reference.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setAdminEmailSent(true);
            setState("idle");
          }}
          className="btn-navy btn-sm mt-5"
        >
          Send another message
        </button>
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
        <div className="sm:col-span-2">
          <Field label="Message" required>
            <textarea
              rows={5}
              className="field resize-y"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              required
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
          {state === "sending" ? "Sending..." : "Send Message"}
        </button>
        <p className="text-[11px] text-steel-500">Used only to respond to your message.</p>
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
