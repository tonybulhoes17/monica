"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteExam } from "../laudos/[examId]/actions";

export function DeleteExamButton({
  examId,
  patientName,
}: {
  examId: string;
  patientName: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    try {
      await deleteExam(examId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        title="Excluir exame"
        className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50"
      >
        Excluir
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir exame?"
        description={`O exame de "${patientName}" será excluído permanentemente, junto com o laudo (se houver) e a assinatura. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
