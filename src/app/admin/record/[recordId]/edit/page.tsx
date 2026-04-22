import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDateJa, toDateTimeLocalTokyo } from "@/lib/time";
import { EditRecordForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  await requireAdmin();
  const { recordId } = await params;

  const record = await prisma.timeRecord.findUnique({
    where: { id: recordId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) notFound();

  const backHref = `/admin/${record.user.id}`;

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <nav className="mb-4 text-sm">
        <Link
          href={backHref}
          className="text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← {record.user.name} さんの詳細に戻る
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">打刻を編集</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {record.user.name} さん / 元の出勤日: {formatDateJa(record.clockIn)}
        </p>
      </header>

      <EditRecordForm
        recordId={record.id}
        backHref={backHref}
        defaultClockIn={toDateTimeLocalTokyo(record.clockIn)}
        defaultClockOut={
          record.clockOut ? toDateTimeLocalTokyo(record.clockOut) : ""
        }
      />
    </main>
  );
}
