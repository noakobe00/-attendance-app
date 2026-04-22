const TZ = "Asia/Tokyo";

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

export function formatDateJa(d: Date): string {
  return dateFmt.format(d);
}

export function toYmdTokyo(d: Date): string {
  return ymdFmt.format(d);
}

export function startOfDayTokyo(d: Date): Date {
  const ymd = toYmdTokyo(d);
  return new Date(`${ymd}T00:00:00+09:00`);
}

export function endOfDayTokyo(d: Date): Date {
  const ymd = toYmdTokyo(d);
  return new Date(`${ymd}T23:59:59.999+09:00`);
}

export function calcMinutes(clockIn: Date, clockOut: Date | null): number {
  if (!clockOut) return 0;
  return Math.max(0, Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function currentMonthTokyo(): string {
  const ymd = toYmdTokyo(new Date());
  return ymd.slice(0, 7);
}

export function parseMonth(input: string | undefined): string {
  if (input && /^\d{4}-\d{2}$/.test(input)) return input;
  return currentMonthTokyo();
}

export function monthRangeTokyo(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(
    `${month}-01T00:00:00+09:00`
  );
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  const end = new Date(
    `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`
  );
  return { start, end };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}`;
}

export function formatMonthJa(month: string): string {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

const dtLocalFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function toDateTimeLocalTokyo(d: Date): string {
  const parts = Object.fromEntries(
    dtLocalFmt.formatToParts(d).map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fromDateTimeLocalTokyo(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  const d = new Date(`${input}:00+09:00`);
  return isNaN(d.getTime()) ? null : d;
}

