import { requireWorker } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { clockIn, clockOut } from "@/app/actions/punch";
import {
  calcMinutes,
  endOfDayTokyo,
  formatDateJa,
  formatDuration,
  formatTime,
  startOfDayTokyo,
} from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function PunchPage() {
  const user = await requireWorker();
  const now = new Date();
  const dayStart = startOfDayTokyo(now);
  const dayEnd = endOfDayTokyo(now);

  const todayRecords = await prisma.timeRecord.findMany({
    where: {
      userId: user.id,
      clockIn: { gte: dayStart, lte: dayEnd },
    },
    orderBy: { clockIn: "asc" },
  });

  const openRecord = todayRecords.find((r) => r.clockOut === null) ?? null;
  const totalMinutes = todayRecords.reduce(
    (sum, r) => sum + calcMinutes(r.clockIn, r.clockOut),
    0
  );

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">打刻</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.name} さん
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

      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDateJa(now)}
        </p>
        <p className="mt-1 text-sm">
          状態:{" "}
          <span
            className={
              openRecord
                ? "font-semibold text-green-600"
                : "font-semibold text-zinc-500"
            }
          >
            {openRecord ? "勤務中" : "未出勤 / 退勤済"}
          </span>
        </p>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <form action={clockIn}>
          <button
            type="submit"
            disabled={!!openRecord}
            className="w-full rounded-lg bg-green-600 px-4 py-6 text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            出勤
          </button>
        </form>
        <form action={clockOut}>
          <button
            type="submit"
            disabled={!openRecord}
            className="w-full rounded-lg bg-rose-600 px-4 py-6 text-lg font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            退勤
          </button>
        </form>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">本日の打刻履歴</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            合計 {formatDuration(totalMinutes)}
          </p>
        </div>

        {todayRecords.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            まだ打刻がありません
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {todayRecords.map((r) => {
              const minutes = calcMinutes(r.clockIn, r.clockOut);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    出勤 {formatTime(r.clockIn)} 〜{" "}
                    {r.clockOut ? (
                      `退勤 ${formatTime(r.clockOut)}`
                    ) : (
                      <span className="text-green-600">勤務中</span>
                    )}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {r.clockOut ? formatDuration(minutes) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
