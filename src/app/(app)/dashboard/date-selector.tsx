"use client";

import { useRouter } from "next/navigation";

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DateSelector({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();

  function goTo(date: string) {
    router.push(`/dashboard?date=${date}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => goTo(shiftDate(selectedDate, -1))}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-white"
        aria-label="Dia anterior"
      >
        ←
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => goTo(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      />
      <button
        onClick={() => goTo(shiftDate(selectedDate, 1))}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-white"
        aria-label="Próximo dia"
      >
        →
      </button>
    </div>
  );
}
