import { toISO } from "./dates";

interface Schedule {
  frequency: string;
  paydayWeekday: number | null;
  payday1: number | null;
  payday2: number | null;
}

/** Same rules as the backend (api/payday.py): weekend paydays move to the Friday before. */
function payDate(year: number, month: number, day: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  const d = new Date(year, month, Math.min(day, last));
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  return d;
}

/** True when the schedule has everything its frequency needs. */
export function scheduleComplete(s: Schedule): boolean {
  if (s.frequency === "Weekly") return s.paydayWeekday != null;
  if (s.frequency === "Monthly") return s.payday1 != null;
  return s.payday1 != null && s.payday2 != null && s.payday1 !== s.payday2;
}

/** Next payday as YYYY-MM-DD, or null while the schedule is incomplete. Used for previews. */
export function nextPaydayISO(s: Schedule, now: Date = new Date()): string | null {
  if (!scheduleComplete(s)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (s.frequency === "Weekly") {
    const mondayBased = (today.getDay() + 6) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + (((s.paydayWeekday as number) - mondayBased + 7) % 7));
    return toISO(next);
  }

  const days = s.frequency === "Monthly" ? [s.payday1 as number] : [s.payday1 as number, s.payday2 as number];
  const candidates: Date[] = [];
  for (const offset of [-1, 0, 1]) {
    for (const d of days) candidates.push(payDate(today.getFullYear(), today.getMonth() + offset, d));
  }
  const upcoming = candidates.filter((c) => c.getTime() >= today.getTime()).sort((a, b) => a.getTime() - b.getTime());
  return upcoming.length ? toISO(upcoming[0]) : null;
}
