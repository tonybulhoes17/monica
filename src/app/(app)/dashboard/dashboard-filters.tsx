"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Institution } from "@/lib/database.types";
import { ALL_DATES, STATUS_ALL, STATUS_PENDING } from "./constants";

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DashboardFilters({
  selectedDate,
  name,
  institutionId,
  status,
  institutions,
}: {
  /** Data no formato YYYY-MM-DD, ou ALL_DATES quando o filtro foi limpo. */
  selectedDate: string;
  name: string;
  institutionId: string;
  status: string;
  institutions: Institution[];
}) {
  const router = useRouter();
  const [nameInput, setNameInput] = useState(name);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAllDates = selectedDate === ALL_DATES;

  function navigate(next: {
    date?: string;
    name?: string;
    institution?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    const date = next.date ?? selectedDate;
    const n = next.name ?? name;
    const inst = next.institution ?? institutionId;
    const st = next.status ?? status;
    if (date) params.set("date", date);
    if (n) params.set("name", n);
    if (inst) params.set("institution", inst);
    if (st) params.set("status", st);
    router.push(`/dashboard?${params.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (nameInput === name) return;
    debounceRef.current = setTimeout(() => {
      navigate({ name: nameInput });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameInput]);

  const inputClasses =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors focus:border-[#002060]/40 focus:outline-none focus:ring-2 focus:ring-[#002060]/10";
  const iconButtonClasses =
    "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
        <button
          onClick={() => navigate({ status: STATUS_PENDING })}
          className={clsxStatus(status === STATUS_PENDING)}
        >
          Pendentes
        </button>
        <button
          onClick={() => navigate({ status: STATUS_ALL })}
          className={clsxStatus(status !== STATUS_PENDING)}
        >
          Todos
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate({ date: shiftDate(selectedDate, -1) })}
          disabled={isAllDates}
          className={iconButtonClasses}
          aria-label="Dia anterior"
        >
          ←
        </button>
        <input
          type="date"
          value={isAllDates ? "" : selectedDate}
          onChange={(e) => navigate({ date: e.target.value })}
          className={inputClasses}
        />
        <button
          onClick={() => navigate({ date: shiftDate(selectedDate, 1) })}
          disabled={isAllDates}
          className={iconButtonClasses}
          aria-label="Próximo dia"
        >
          →
        </button>
        {isAllDates ? (
          <span className="px-1 text-xs text-slate-400">Todas as datas</span>
        ) : (
          <button
            onClick={() => navigate({ date: ALL_DATES })}
            className="px-1 text-xs text-slate-400 underline decoration-dotted underline-offset-2 transition-colors hover:text-slate-600"
          >
            Limpar data
          </button>
        )}
      </div>

      <input
        type="text"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        placeholder="Buscar por nome..."
        className={inputClasses}
      />
      <select
        value={institutionId}
        onChange={(e) => navigate({ institution: e.target.value })}
        className={inputClasses}
      >
        <option value="">Todas as instituições</option>
        {institutions.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function clsxStatus(active: boolean): string {
  return [
    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
    active ? "bg-[#002060] text-white shadow-sm" : "text-slate-500 hover:text-slate-900",
  ].join(" ");
}
