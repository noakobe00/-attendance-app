"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorker } from "@/lib/dal";

export async function clockIn() {
  const user = await requireWorker();

  const openRecord = await prisma.timeRecord.findFirst({
    where: { userId: user.id, clockOut: null },
  });
  if (openRecord) {
    revalidatePath("/punch");
    return;
  }

  await prisma.timeRecord.create({
    data: { userId: user.id, clockIn: new Date() },
  });
  revalidatePath("/punch");
}

export async function clockOut() {
  const user = await requireWorker();

  const openRecord = await prisma.timeRecord.findFirst({
    where: { userId: user.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!openRecord) {
    revalidatePath("/punch");
    return;
  }

  await prisma.timeRecord.update({
    where: { id: openRecord.id },
    data: { clockOut: new Date() },
  });
  revalidatePath("/punch");
}
