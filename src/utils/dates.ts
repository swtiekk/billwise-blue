export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-14" -> [2026, 9, 14] (parsed by hand so time zones can't shift the day). */
export function splitISO(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string): Date {
  const p = splitISO(iso);
  return p ? new Date(p[0], p[1] - 1, p[2]) : new Date();
}

export function daysUntil(iso: string): number {
  const p = splitISO(iso);
  if (!p) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(p[0], p[1] - 1, p[2]).getTime() - today.getTime()) / 86400000);
}

/** "Sep 14" */
export function formatShort(iso: string | null | undefined): string {
  const p = iso ? splitISO(iso) : null;
  return p ? `${MONTHS_SHORT[p[1] - 1]} ${p[2]}` : "No due date";
}

/** "Sep 14, 2026" */
export function formatLong(iso: string | null | undefined): string {
  const p = iso ? splitISO(iso) : null;
  return p ? `${MONTHS_SHORT[p[1] - 1]} ${p[2]}, ${p[0]}` : "";
}

/** "September 2026" */
export function monthYear(iso: string | null | undefined): string {
  const p = iso ? splitISO(iso) : null;
  return p ? `${MONTHS_LONG[p[1] - 1]} ${p[0]}` : "";
}
