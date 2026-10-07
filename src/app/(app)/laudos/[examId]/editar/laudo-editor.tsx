"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { LaudoShell } from "@/components/laudo-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PromptDialog } from "@/components/prompt-dialog";
import { StatusBadge } from "@/components/status-badge";
import type { ExamWithPatient, Profile } from "@/lib/database.types";
import {
  revertToDraft,
  saveExamAsTemplate,
  saveLaudoContent,
  signLaudo,
} from "../actions";

export function LaudoEditor({
  exam,
  profile,
}: {
  exam: ExamWithPatient;
  profile: Profile;
}) {
  const router = useRouter();
  const [contentHtml, setContentHtml] = useState(exam.content_html ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);
  const [promptSaveAsTemplate, setPromptSaveAsTemplate] = useState(false);
  const [templateSavedMessage, setTemplateSavedMessage] = useState<
    string | null
  >(null);

  const isSigned = exam.status === "signed";
  const isAdmin = profile.role === "admin";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveLaudoContent(exam.id, contentHtml);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlock() {
    setConfirmUnlock(false);
    try {
      await revertToDraft(exam.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reabrir laudo.");
    }
  }

  async function handleSaveAsTemplate(name: string) {
    setPromptSaveAsTemplate(false);
    setError(null);
    try {
      if (dirty) {
        await saveLaudoContent(exam.id, contentHtml);
        setDirty(false);
      }
      await saveExamAsTemplate(exam.id, name);
      setTemplateSavedMessage(`Modelo "${name}" salvo com sucesso.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar modelo.",
      );
    }
  }

  async function handleSign() {
    setConfirmSign(false);
    setSigning(true);
    setError(null);
    try {
      if (dirty) {
        await saveLaudoContent(exam.id, contentHtml);
        setDirty(false);
      }
      await signLaudo(exam.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao assinar.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {exam.patient.full_name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={exam.status} />
            {dirty && (
              <span className="text-xs text-amber-600">
                Alterações não salvas
              </span>
            )}
          </div>
        </div>

        <div className="no-print flex items-center gap-2">
          <a
            href={`/laudos/${exam.id}/imprimir`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
          >
            Imprimir
          </a>
          <a
            href={`/api/laudos/${exam.id}/pdf`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
          >
            Baixar PDF
          </a>
          {!isSigned && (
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
          {!isSigned && isAdmin && (
            <button
              onClick={() => setPromptSaveAsTemplate(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
            >
              Salvar como modelo
            </button>
          )}
          {!isSigned && isAdmin && (
            <button
              onClick={() => setConfirmSign(true)}
              disabled={signing}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {signing ? "Assinando..." : "Assinar laudo"}
            </button>
          )}
        </div>
      </div>

      {isSigned && (
        <div className="no-print flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            Este laudo já está assinado. Editar o conteúdo removerá a
            assinatura e ele precisará ser assinado novamente.
          </span>
          <button
            onClick={() => setConfirmUnlock(true)}
            className="ml-4 shrink-0 rounded-md border border-amber-400 px-3 py-1 text-xs font-medium hover:bg-amber-100"
          >
            Editar laudo
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {templateSavedMessage && (
        <p className="no-print text-sm text-emerald-600">
          {templateSavedMessage}
        </p>
      )}

      <LaudoShell
        exam={exam}
        body={
          <RichTextEditor
            content={contentHtml}
            editable={!isSigned}
            onChange={(html) => {
              setContentHtml(html);
              setDirty(true);
            }}
          />
        }
      />

      <ConfirmDialog
        open={confirmUnlock}
        title="Editar laudo assinado?"
        description="Isso vai remover a assinatura atual. O laudo voltará para o status 'em edição' e precisará ser assinado novamente."
        confirmLabel="Remover assinatura e editar"
        danger
        onConfirm={handleUnlock}
        onCancel={() => setConfirmUnlock(false)}
      />

      <ConfirmDialog
        open={confirmSign}
        title="Assinar laudo"
        description="Confirma a assinatura digital deste laudo? Depois de assinado, qualquer edição removerá a assinatura."
        confirmLabel="Assinar"
        onConfirm={handleSign}
        onCancel={() => setConfirmSign(false)}
      />

      <PromptDialog
        open={promptSaveAsTemplate}
        title="Salvar como novo modelo"
        description="O texto atual deste laudo vai virar um modelo padrão, disponível para qualquer paciente. Dê um nome para esse modelo."
        placeholder='Ex: "Vigília e sono adulto"'
        confirmLabel="Salvar modelo"
        onConfirm={handleSaveAsTemplate}
        onCancel={() => setPromptSaveAsTemplate(false)}
      />
    </div>
  );
}
