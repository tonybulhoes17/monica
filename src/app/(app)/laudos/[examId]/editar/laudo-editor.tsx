"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { LaudoShell } from "@/components/laudo-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PromptDialog } from "@/components/prompt-dialog";
import { StatusBadge } from "@/components/status-badge";
import type { ExamWithPatient, Institution, Profile } from "@/lib/database.types";
import {
  revertToDraft,
  saveExamAsTemplate,
  saveLaudoContent,
  signLaudo,
  updateExamInstitution,
} from "../actions";

export interface VidasStatus {
  configured: boolean;
  connected: boolean;
  expiresAt: string | null;
}

export function LaudoEditor({
  exam,
  profile,
  vidasStatus,
  qrCodeDataUrl,
  institutions,
}: {
  exam: ExamWithPatient;
  profile: Profile;
  vidasStatus: VidasStatus;
  qrCodeDataUrl?: string | null;
  institutions: Institution[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vidasConnectedJustNow = searchParams.get("vidas_connected") === "1";
  const vidasError = searchParams.get("vidas_error");
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
  const [institutionId, setInstitutionId] = useState(
    exam.institution_id ?? "",
  );
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [institutionError, setInstitutionError] = useState<string | null>(
    null,
  );

  const isSigned = exam.status === "signed";
  const isAdmin = profile.role === "admin";

  async function handleInstitutionChange(value: string) {
    setInstitutionId(value);
    setSavingInstitution(true);
    setInstitutionError(null);
    try {
      await updateExamInstitution(exam.id, value || null);
      router.refresh();
    } catch (err) {
      setInstitutionError(
        err instanceof Error ? err.message : "Erro ao trocar instituição.",
      );
    } finally {
      setSavingInstitution(false);
    }
  }

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
      // redirect() dentro da server action (ex: precisa reautorizar no
      // Vidas) lança um erro especial do Next.js que precisa propagar,
      // não ser tratado como falha de assinatura.
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
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
            href={`/api/laudos/${exam.id}/pdf?inline=1`}
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

      {isAdmin && (
        <div className="no-print flex items-center gap-2 text-xs text-slate-600">
          <label htmlFor="institution-select" className="font-medium">
            Instituição (local do exame):
          </label>
          <select
            id="institution-select"
            value={institutionId}
            disabled={isSigned || savingInstitution}
            onChange={(e) => handleInstitutionChange(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
          >
            <option value="">Nenhuma</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
          {savingInstitution && <span>Salvando...</span>}
          {isSigned && (
            <span>
              Laudo assinado — reabra para edição para trocar a instituição.
            </span>
          )}
          {institutionError && (
            <span className="text-red-600">{institutionError}</span>
          )}
        </div>
      )}

      {vidasStatus.configured && !isSigned && (
        <div className="no-print flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          {vidasStatus.connected ? (
            <span>
              Vidas conectado
              {vidasStatus.expiresAt && (
                <>
                  {" "}
                  até{" "}
                  {new Date(vidasStatus.expiresAt).toLocaleString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
              .
            </span>
          ) : (
            <span>Vidas não conectado — será pedido ao clicar em Assinar.</span>
          )}
          <a
            href={`/api/vidas/authorize?returnTo=${encodeURIComponent(`/laudos/${exam.id}/editar`)}`}
            className="font-medium text-slate-900 underline"
          >
            {vidasStatus.connected ? "Reconectar" : "Conectar agora"}
          </a>
        </div>
      )}

      {vidasConnectedJustNow && (
        <p className="no-print text-sm text-emerald-600">
          Conectado ao Vidas com sucesso.
        </p>
      )}
      {vidasError && (
        <p className="no-print text-sm text-red-600">
          Falha ao conectar ao Vidas ({vidasError}). Tente novamente.
        </p>
      )}

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
        qrCodeDataUrl={qrCodeDataUrl}
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
