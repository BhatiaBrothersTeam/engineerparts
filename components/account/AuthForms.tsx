"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Script from "next/script";
import { useAuth } from "@/components/providers/AuthProvider";
import { CUSTOMER_TYPES, safeRedirect, validPassword, type AuthResponse } from "@/lib/account";
import type { WooCountry } from "@/lib/woocommerce";
import { Logo } from "@/components/Logo";
import { IconTile } from "@/components/ui/IconTile";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

async function authRequest(action: string, body: Record<string, unknown>): Promise<AuthResponse> {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as AuthResponse;
  if (!response.ok) throw new Error(data.error || "Unable to complete this request.");
  return data;
}

export function LoginForm({ redirectTo, verified, reset }: { redirectTo?: string; verified?: boolean; reset?: boolean }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authRequest("login", { email, password, remember });
      await refreshUser();
      router.replace(safeRedirect(redirectTo));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Incorrect email or password.");
      setSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="Customer account" title="Sign in" description="Access your orders, enquiries and saved account details.">
      {verified ? <Status>Thanks, your email is verified. You can sign in now.</Status> : null}
      {reset ? <Status>Your password has been updated. Sign in with your new password.</Status> : null}
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Field label="Email address" htmlFor="login-email">
          <input id="login-email" type="email" autoComplete="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <PasswordInput id="login-password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
            Remember me
          </label>
          <Link href="/forgot-password" className="link-underline text-sm font-semibold text-brand-700">Forgot password?</Link>
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
      </form>
      <AuthFooter>New to EngineerParts? <Link href="/register" className="font-semibold text-brand-700 link-underline">Create account</Link></AuthFooter>
    </AuthCard>
  );
}

interface RegisterState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  password: string;
  confirmPassword: string;
  jobTitle: string;
  department: string;
  companyWebsite: string;
  country: string;
  vatNumber: string;
  customerType: string;
}

const EMPTY_REGISTER: RegisterState = {
  firstName: "", lastName: "", email: "", phone: "", company: "", password: "", confirmPassword: "",
  jobTitle: "", department: "", companyWebsite: "", country: "AE", vatNumber: "", customerType: "",
};

export function RegisterForm({ countries }: { countries: WooCountry[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_REGISTER);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaContainer = useRef<HTMLDivElement>(null);
  const captchaWidget = useRef<string | null>(null);
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const update = (key: keyof RegisterState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const passwordReady = validPassword(form.password);

  function renderCaptcha() {
    if (!captchaContainer.current || !captchaSiteKey) return;
    if (!window.turnstile) {
      setError("CAPTCHA verification could not be loaded. Please refresh and try again.");
      return;
    }
    if (captchaWidget.current) window.turnstile.remove(captchaWidget.current);
    captchaWidget.current = window.turnstile.render(captchaContainer.current, {
      sitekey: captchaSiteKey,
      callback: (token) => {
        setCaptchaToken(token);
        setError("");
      },
      "expired-callback": () => {
        setCaptchaToken("");
        setError("CAPTCHA verification expired. Please verify again.");
      },
      "error-callback": () => {
        setCaptchaToken("");
        setError("CAPTCHA verification failed to load. Please refresh and try again.");
      },
    });
  }

  useEffect(() => () => {
    if (captchaWidget.current && window.turnstile) window.turnstile.remove(captchaWidget.current);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!passwordReady) return setError("Password must be at least 8 characters and contain letters and numbers.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (!captchaToken) return setError("Complete the CAPTCHA verification before creating your account.");
    setSubmitting(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = form;
      await authRequest("register", { ...payload, captchaToken });
      router.push(`/verify-email?sent=1&email=${encodeURIComponent(form.email)}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your account. Please try again.");
      setCaptchaToken("");
      if (captchaWidget.current && window.turnstile) window.turnstile.reset(captchaWidget.current);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="Trade customer" title="Create an account" description="Create an Engineerparts account for faster purchasing and account services." wide>
      {captchaSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderCaptcha} onError={() => setError("CAPTCHA verification could not be loaded. Please refresh and try again.")} /> : null}
      <form onSubmit={submit} className="mt-7">
        <SectionLabel>Your details</SectionLabel>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="first-name"><input id="first-name" className="field" autoComplete="given-name" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required /></Field>
          <Field label="Last name" htmlFor="last-name"><input id="last-name" className="field" autoComplete="family-name" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required /></Field>
          <Field label="Email address" htmlFor="register-email"><input id="register-email" type="email" className="field" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></Field>
          <Field label="Mobile number" htmlFor="register-phone"><input id="register-phone" type="tel" className="field" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></Field>
          <div className="sm:col-span-2"><Field label="Company name" htmlFor="company"><input id="company" className="field" autoComplete="organization" value={form.company} onChange={(event) => update("company", event.target.value)} required /></Field></div>
        </div>

        <SectionLabel className="mt-6">Security</SectionLabel>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="register-password"><PasswordInput id="register-password" value={form.password} onChange={(value) => update("password", value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="new-password" /></Field>
          <Field label="Confirm password" htmlFor="confirm-password"><input id="confirm-password" type={showPassword ? "text" : "password"} className="field" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} required /></Field>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs" aria-live="polite">
          <span className={`h-1.5 flex-1 rounded-full transition-colors ${form.password.length >= 8 ? "bg-emerald-500" : "bg-navy-100"}`} />
          <span className={`h-1.5 flex-1 rounded-full transition-colors ${passwordReady ? "bg-emerald-500" : "bg-navy-100"}`} />
          <span className="whitespace-nowrap text-steel-600">{passwordReady ? "Password meets requirements" : "8+ characters with letters and numbers"}</span>
        </div>

        <details className="group mt-7 rounded-md border border-navy-100 bg-navy-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-bold text-navy-900">
            Optional business details
            <svg className="h-4 w-4 shrink-0 text-steel-500 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="grid gap-4 border-t border-navy-100 p-4 sm:grid-cols-2">
            <Field label="Job title" htmlFor="job-title"><input id="job-title" className="field" autoComplete="organization-title" value={form.jobTitle} onChange={(event) => update("jobTitle", event.target.value)} /></Field>
            <Field label="Department" htmlFor="department"><input id="department" className="field" value={form.department} onChange={(event) => update("department", event.target.value)} /></Field>
            <Field label="Company website" htmlFor="company-website"><input id="company-website" type="url" className="field" autoComplete="url" value={form.companyWebsite} onChange={(event) => update("companyWebsite", event.target.value)} /></Field>
            <Field label="Country" htmlFor="country"><select id="country" className="field" autoComplete="country" value={form.country} onChange={(event) => update("country", event.target.value)}>{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></Field>
            <Field label="VAT / TRN number" htmlFor="vat-number"><input id="vat-number" className="field" value={form.vatNumber} onChange={(event) => update("vatNumber", event.target.value)} /></Field>
            <Field label="Customer type" htmlFor="customer-type"><select id="customer-type" className="field" value={form.customerType} onChange={(event) => update("customerType", event.target.value)}><option value="">Select customer type</option>{CUSTOMER_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
          </div>
        </details>

        <div className="mt-6" aria-label="CAPTCHA verification">
          {captchaSiteKey
            ? <div ref={captchaContainer} />
            : <p role="alert" className="flex items-start gap-2 rounded-md border border-signal-200 bg-signal-50 px-4 py-3 text-sm font-semibold text-signal-700"><AlertIcon />Account registration verification is unavailable. Please try again later.</p>}
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting || !captchaSiteKey || !captchaToken}>{submitting ? "Creating account..." : "Create account"}</button>
      </form>
      <AuthFooter>Already registered? <Link href="/login" className="font-semibold text-brand-700 link-underline">Sign in</Link></AuthFooter>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const data = await authRequest("forgot-password", { email });
      setMessage(data.message ?? "If an account exists, password reset instructions have been sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send reset instructions.");
    } finally { setSubmitting(false); }
  }

  return (
    <AuthCard eyebrow="Account recovery" title="Reset your password" description="Enter your account email. We will send a secure reset link if an account exists.">
      {message ? (
        <Confirmation icon={<MailIcon />}>{message}</Confirmation>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-5">
          <Field label="Email address" htmlFor="forgot-email">
            <input id="forgot-email" type="email" autoComplete="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <FormError message={error} />
          <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? "Sending..." : "Send reset instructions"}</button>
        </form>
      )}
      <AuthFooter><Link href="/login" className="font-semibold text-brand-700 link-underline">Back to sign in</Link></AuthFooter>
    </AuthCard>
  );
}

export function ResetPasswordForm({ resetKey, login }: { resetKey?: string; login?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!resetKey || !login) return setError("This password reset link is invalid or incomplete.");
    if (!validPassword(password)) return setError("Password must be at least 8 characters and contain letters and numbers.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSubmitting(true);
    try { await authRequest("reset-password", { key: resetKey, login, password }); router.replace("/login?reset=1"); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to reset your password."); setSubmitting(false); }
  }

  return (
    <AuthCard eyebrow="Account security" title="Choose a new password" description="Use at least 8 characters with a combination of letters and numbers.">
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Field label="New password" htmlFor="new-password">
          <PasswordInput id="new-password" value={password} onChange={setPassword} visible={visible} onToggle={() => setVisible((value) => !value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" htmlFor="confirm-new-password">
          <input id="confirm-new-password" type={visible ? "text" : "password"} autoComplete="new-password" className="field" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        </Field>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? "Updating password..." : "Update password"}</button>
      </form>
    </AuthCard>
  );
}

export function VerifyEmailForm({ token, email, sent }: { token?: string; email?: string; sent?: boolean }) {
  const [state, setState] = useState<"working" | "success" | "waiting" | "error">(sent ? "waiting" : "working");
  const [message, setMessage] = useState(sent ? "Account created. Check your email for a verification link before signing in." : "Verifying your email...");
  const started = useRef(false);

  useEffect(() => {
    if (sent || started.current) return;
    started.current = true;
    if (!token || !email) { setState("error"); setMessage("This verification link is invalid or incomplete."); return; }
    authRequest("verify-email", { token, email }).then((data) => { setState("success"); setMessage(data.message ?? "Email verified."); }).catch((caught) => { setState("error"); setMessage(caught instanceof Error ? caught.message : "Unable to verify this email."); });
  }, [email, sent, token]);

  async function resend() {
    if (!email) return;
    try { const data = await authRequest("resend-verification", { email }); setState("waiting"); setMessage(data.message ?? "A new verification email has been sent."); }
    catch (caught) { setState("error"); setMessage(caught instanceof Error ? caught.message : "Unable to resend verification."); }
  }

  const icon = state === "success" ? <CheckIcon /> : state === "working" ? <SpinnerIcon /> : state === "error" ? <AlertIcon /> : <MailIcon />;

  return (
    <AuthCard eyebrow="Email verification" title={state === "success" ? "Email verified" : state === "error" ? "Verification problem" : "Check your email"} description="">
      <Confirmation icon={icon} tone={state === "error" ? "error" : "default"}>{message}</Confirmation>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {state === "success" ? <Link href="/login?verified=1" className="btn-primary flex-1">Continue to sign in</Link> : <button type="button" className="btn-outline flex-1" onClick={resend} disabled={!email || state === "working"}>Resend verification</button>}
        <Link href="/login" className="btn-outline flex-1">Back to sign in</Link>
      </div>
    </AuthCard>
  );
}

function AuthCard({ eyebrow, title, description, wide = false, children }: { eyebrow: string; title: string; description: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>
      <div className="mb-7 flex justify-center">
        <Logo compact />
      </div>
      <div className={`card ${wide ? "p-6 sm:p-9" : "p-6 sm:p-8"}`}>
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow text-brand-700">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold text-navy-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-sm text-sm leading-6 text-steel-600">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthFooter({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 border-t border-navy-100 pt-5 text-center text-sm text-steel-600">{children}</p>;
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-wide text-steel-500 ${className}`}>{children}</p>;
}

function Confirmation({ icon, children, tone = "default" }: { icon: ReactNode; children: ReactNode; tone?: "default" | "error" }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 text-center">
      {tone === "error"
        ? <span className="icon-tile bg-signal-50 text-signal-600" aria-hidden="true">{icon}</span>
        : <IconTile>{icon}</IconTile>}
      <p className="text-sm leading-6 text-steel-600">{children}</p>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="field-label">{label}</label>{children}</div>;
}

function PasswordInput({ id, value, onChange, visible, onToggle, autoComplete = "current-password" }: { id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; autoComplete?: "current-password" | "new-password" }) {
  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} className="field pr-11" value={value} onChange={(event) => onChange(event.target.value)} required />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-steel-500 hover:text-brand-700"
        aria-label={`${visible ? "Hide" : "Show"} password`}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-signal-200 bg-signal-50 px-4 py-3 text-sm font-semibold text-signal-700">
      <AlertIcon />
      <span>{message}</span>
    </p>
  );
}

function Status({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mb-1 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
      <span className="mt-0.5 shrink-0 text-emerald-600"><CheckIcon /></span>
      <span>{children}</span>
    </p>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3.5 3.5l17 17M10.6 10.7a2.6 2.6 0 0 0 3.7 3.6M7.3 7.4C5 8.9 3.3 11 2.5 12c0 0 3.5 6.5 9.5 6.5 1.7 0 3.2-.5 4.5-1.2M16.8 16.9c2.1-1.5 3.7-3.9 4.7-4.9 0 0-1.4-2.6-3.9-4.5M9.9 5.8c.7-.2 1.4-.3 2.1-.3 6 0 9.5 6.5 9.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 9v4.5M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 3.9 2.7 17a1.8 1.8 0 0 0 1.6 2.7h15.4a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-5 w-5 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}
