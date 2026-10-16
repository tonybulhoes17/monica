"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteInstitution } from "./actions";

export function DeleteInstitutionButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    try {
      await deleteInstitution(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Excluir
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir instituição?"
        description={`"${name}" será removida. Exames já vinculados a ela não são apagados — só ficam sem instituição associada.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
