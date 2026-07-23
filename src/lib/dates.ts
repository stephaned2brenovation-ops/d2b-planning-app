export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  const off = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t.getTime() - first.getTime()) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ddmm(d: Date): string {
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

// Renvoie les 7 dates (lundi→dimanche) de la semaine contenant `ref`.
export function weekDays(ref: Date): Date[] {
  const m = mondayOf(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(m);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function weekLabel(ref: Date): string {
  const m = mondayOf(ref);
  const e = new Date(m);
  e.setDate(e.getDate() + 6);
  return `Semaine ${isoWeek(m)} · du ${ddmm(m)} au ${ddmm(e)}/${e.getFullYear()}`;
}

// "2026-06-15" -> Date locale
export function parseISO(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
}
