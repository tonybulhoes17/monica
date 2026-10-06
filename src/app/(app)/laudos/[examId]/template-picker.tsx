"use client";

import { useState } from "react";
import type { ReportTemplate } from "@/lib/database.types";
import { startLaudoWithTemplate } from "./actions";

export function TemplatePicker({
  examId,
  templates,
}: {
  examId: string;
  templates: ReportTemplate[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handlePick(templateId: string) {
    setLoadingId(templateId);
    try {
      await startLaudoWithTemplate(examId, templateId);
    } catch {
      setLoadingId(null);
    }
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <li key={t.id}>
          <button
            onClick={() => handlePick(t.id)}
            disabled={loadingId !== null}
            className="w-full rounded-md border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingId === t.id ? "Carregando..." : t.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
