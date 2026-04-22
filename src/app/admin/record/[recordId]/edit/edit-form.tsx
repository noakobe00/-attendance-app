"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  updateRecord,
  deleteRecord,
  type UpdateRecordState,
} from "@/app/actions/admin-records";

type Props = {
  recordId: string;
  backHref: string;
  defaultClockIn: string;
  defaultClockOut: string;
};

export function EditRecordForm({
  recordId,
  backHref,
  defaultClockIn,
  defaultClockOut,
}: Props) {
  const [state, action, pending] = useActionState<UpdateRecordState, FormData>(
    updateRecord.bind(null, recordId),
    undefined
  );

  async function handleDelete(formData: FormData) {
    if (!confirm("この打刻を削除します。よろしいですか?")) return;
    await deleteRecord(recordId);
    void formData;
  }

  return (
    <>
      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="clockIn" className="block text-sm font-medium">
            出勤日時
          </label>
          <input
            id="clockIn"
            name="clockIn"
            type="datetime-local"
            required
            defaultValue={defaultClockIn}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clockOut" className="block text-sm font-medium">
            退勤日時{" "}
            <span className="text-xs text-zinc-500">
              (空欄で「未退勤」にできます)
            </span>
          </label>
          <input
            id="clockOut"
            name="clockOut"
            type="datetime-local"
            defaultValue={defaultClockOut}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "保存中..." : "保存"}
          </button>
          <Link
            href={backHref}
            className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            キャンセル
          </Link>
        </div>
      </form>

      <form action={handleDelete} className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          className="w-full rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          この打刻を削除する
        </button>
      </form>
    </>
  );
}
