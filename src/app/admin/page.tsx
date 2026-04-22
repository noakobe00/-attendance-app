import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import {
  calcMinutes,
  formatDuration,
  formatMonthJa,
  monthRangeTokyo,
  parseMonth,
  shiftMonth,
} from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireAdmin();
  const { month: monthParam } = await searchParams;
  const month = parseMonth(monthParam);
  const { start, end } = monthRangeTokyo(month);

  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      timeRecords: {
        where: { clockIn: { gte: start, lt: end } },
        select: { clockIn: true, clockOut: true },
      },
    },
  });

  const rows = workers.map((w) => {
    const totalMinutes = w.timeRecords.reduce(
      (sum, r) => sum + calcMinutes(r.clockIn, r.clockOut),
      0
    );
    const recordCount = w.timeRecords.length;
    return { id: w.id, name: w.name, email: w.email, totalMinutes, recordCount };
  });

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">管理者ページ</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.name} さん ({user.email})
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ログアウト
          </button>
        </form>
      </header>

      <section className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={`/admin?month=${prevMonth}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← {formatMonthJa(prevMonth)}
        </Link>
        <h2 className="text-lg font-semibold">{formatMonthJa(month)}</h2>
        <Link
          href={`/admin?month=${nextMonth}`}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {formatMonthJa(nextMonth)} →
        </Link>
      </section>

      <section>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            打刻者が登録されていません
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/${r.id}?month=${month}`}
                  className="flex items-center justify-between px-4 py-4 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatDuration(r.totalMinutes)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {r.recordCount} 件の打刻
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
