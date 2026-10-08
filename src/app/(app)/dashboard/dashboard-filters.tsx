"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Institution } from "@/lib/database.types";
import { ALL_DATES } from "./constants";

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DashboardFilters({
  selectedDate,
  name,
  institutionId,
  institutions,
}: {
  /** Data no formato YYYY-MM-DD, ou ALL_DATES quando o filtro foi limpo. */
  selectedDate: string;
  name: string;
  institutionId: string;
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
  }) {
    const params = new URLSearchParams();
    const date = next.date ?? selectedDate;
    const n = next.name ?? name;
    const inst = next.institution ?? institutionId;
    if (date) params.set("date", date);
    if (n) params.set("name", n);
    if (inst) params.set("institution", inst);
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate({ date: shiftDate(selectedDate, -1) })}
          disabled={isAllDates}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-white disabled:opacity-40"
          aria-label="Dia anterior"
        >
          ←
        </button>
        <input
          type="date"
          value={isAllDates ? "" : selectedDate}
          onChange={(e) => navigate({ date: e.target.value })}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        />
        <button
          onClick={() => navigate({ date: shiftDate(selectedDate, 1) })}
          disabled={isAllDates}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-white disabled:opacity-40"
          aria-label="Próximo dia"
        >
          →
        </button>
        {isAllDates ? (
          <span className="text-xs text-slate-500">Todas as datas</span>
        ) : (
          <button
            onClick={() => navigate({ date: ALL_DATES })}
            className="text-xs text-slate-500 underline hover:text-slate-700"
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
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
      />
      <select
        value={institutionId}
        onChange={(e) => navigate({ institution: e.target.value })}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
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
