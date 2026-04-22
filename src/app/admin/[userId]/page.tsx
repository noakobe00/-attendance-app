import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  calcMinutes,
  formatDuration,
  formatMonthJa,
  formatTime,
  monthRangeTokyo,
  parseMonth,
  shiftMonth,
  toYmdTokyo,
} from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const { month: monthParam } = await searchParams;
  const month = parseMonth(monthParam);
  const { start, end } = monthRangeTokyo(month);

  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!worker || worker.role !== "WORKER") notFound();

  const records = await prisma.timeRecord.findMany({
    where: {
      userId,
      clockIn: { gte: start, lt: end },
    },
    orderBy: { clockIn: "asc" },
  });

  type RecordItem = { id: string; clockIn: Date; clockOut: Date | null };
  const byDay = new Map<string, RecordItem[]>();
  for (const r of records) {
    const ymd = toYmdTokyo(r.clockIn);
    const list = byDay.get(ymd) ?? [];
    list.push({ id: r.id, clockIn: r.clockIn, clockOut: r.clockOut });
    byDay.set(ymd, list);
  }

  const days = Array.from(byDay.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const monthTotal = records.reduce(
    (sum, r) => sum + calcMinutes(r.clockIn, r.clockOut),
    0
  );

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <nav className="mb-4 text-sm">
        <Link
          href={`/admin?month=${month}`}
          className="text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← 一覧に戻る
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{worker.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {worker.email}
        </p>
      </header>

      <section className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={`/admin/${userId}?month=${prevMonth}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← {formatMonthJa(prevMonth)}
        </Link>
        <div className="text-center">
          <p className="text-lg font-semibold">{formatMonthJa(month)}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            月合計 {formatDuration(monthTotal)}
          </p>
        </div>
        <Link
          href={`/admin/${userId}?month=${nextMonth}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {formatMonthJa(nextMonth)} →
        </Link>
      </section>

      {days.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          この月の打刻はありません
        </p>
      ) : (
        <ul className="space-y-3">
          {days.map(([ymd, shifts]) => {
            const dayTotal = shifts.reduce(
              (sum, s) => sum + calcMinutes(s.clockIn, s.clockOut),
              0
            );
            const hasOpen = shifts.some((s) => s.clockOut === null);
            return (
              <li
                key={ymd}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="font-semibold">{ymd}</p>
                  <p className="text-sm">
                    <span className="font-semibold">
                      {formatDuration(dayTotal)}
                    </span>
                    {hasOpen && (
                      <span className="ml-2 text-xs text-amber-600">
                        (退勤打刻なしあり)
                      </span>
                    )}
                  </p>
                </div>
                <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                  {shifts.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 py-1.5"
                    >
                      <span className="flex-1">
                        出勤 {formatTime(s.clockIn)} 〜{" "}
                        {s.clockOut ? (
                          `退勤 ${formatTime(s.clockOut)}`
                        ) : (
                          <span className="text-amber-600">未退勤</span>
                        )}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {s.clockOut
                          ? formatDuration(calcMinutes(s.clockIn, s.clockOut))
                          : "—"}
                      </span>
                      <Link
                        href={`/admin/record/${s.id}/edit`}
                        className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        編集
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
