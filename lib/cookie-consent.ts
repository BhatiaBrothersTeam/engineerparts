export type CookieConsent = "accepted" | "rejected";

export const COOKIE_CONSENT_STORAGE_KEY = "engineerparts_cookie_consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "engineerparts:open-cookie-settings";

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(value: CookieConsent): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  } catch {
    // The current page still honours the choice when storage is unavailable.
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === "accepted";
}
