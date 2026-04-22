"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { fromDateTimeLocalTokyo } from "@/lib/time";

export type UpdateRecordState = { error?: string } | undefined;

export async function updateRecord(
  recordId: string,
  _prev: UpdateRecordState,
  formData: FormData
): Promise<UpdateRecordState> {
  await requireAdmin();

  const clockInStr = String(formData.get("clockIn") ?? "");
  const clockOutStr = String(formData.get("clockOut") ?? "");

  const clockIn = fromDateTimeLocalTokyo(clockInStr);
  if (!clockIn) {
    return { error: "出勤日時の形式が正しくありません" };
  }

  let clockOut: Date | null = null;
  if (clockOutStr.trim() !== "") {
    const parsed = fromDateTimeLocalTokyo(clockOutStr);
    if (!parsed) {
      return { error: "退勤日時の形式が正しくありません" };
    }
    if (parsed.getTime() <= clockIn.getTime()) {
      return { error: "退勤日時は出勤日時より後にしてください" };
    }
    clockOut = parsed;
  }

  const record = await prisma.timeRecord.findUnique({
    where: { id: recordId },
    select: { id: true, userId: true },
  });
  if (!record) {
    return { error: "打刻が見つかりません" };
  }

  await prisma.timeRecord.update({
    where: { id: recordId },
    data: { clockIn, clockOut },
  });

  revalidatePath(`/admin/${record.userId}`);
  redirect(`/admin/${record.userId}`);
}

export async function deleteRecord(recordId: string) {
  await requireAdmin();

  const record = await prisma.timeRecord.findUnique({
    where: { id: recordId },
    select: { id: true, userId: true },
  });
  if (!record) redirect("/admin");

  await prisma.timeRecord.delete({ where: { id: recordId } });

  revalidatePath(`/admin/${record.userId}`);
  redirect(`/admin/${record.userId}`);
}
