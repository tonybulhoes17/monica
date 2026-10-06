"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { createTemplate, updateTemplate } from "./actions";

const PLACEHOLDER_HELP = (
  <p className="text-xs text-slate-500">
    Use os marcadores{" "}
    <code className="rounded bg-slate-100 px-1">{"{{nome_paciente}}"}</code>,{" "}
    <code className="rounded bg-slate-100 px-1">{"{{idade}}"}</code>,{" "}
    <code className="rounded bg-slate-100 px-1">{"{{data_exame}}"}</code>,{" "}
    <code className="rounded bg-slate-100 px-1">{"{{medico_solicitante}}"}</code>,{" "}
    <code className="rounded bg-slate-100 px-1">{"{{comorbidades}}"}</code> e{" "}
    <code className="rounded bg-slate-100 px-1">{"{{medicacoes}}"}</code> no
    texto — eles serão substituídos pelos dados do paciente ao iniciar um
    laudo com este modelo.
  </p>
);

export function TemplateForm({
  template,
}: {
  template?: { id: string; name: string; content_html: string; is_active: boolean };
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [contentHtml, setContentHtml] = useState(
    template?.content_html ?? "<p></p>",
  );
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      if (template) {
        await updateTemplate(template.id, { name, contentHtml, isActive });
        setSaved(true);
      } else {
        await createTemplate({ name, contentHtml });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">
            Nome do modelo
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: "Laudo padrão - EEG de vigília"'
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {template && (
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Ativo
          </label>
        )}
      </div>

      {PLACEHOLDER_HELP}

      <RichTextEditor content={contentHtml} onChange={setContentHtml} />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Modelo salvo.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Salvar modelo"}
      </button>
    </form>
  );
}
