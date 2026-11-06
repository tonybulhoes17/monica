"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteSecretaryButton({
  id,
  fullName,
}: {
  id: string;
  fullName: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirmOpen(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/secretarias/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erro ao excluir.");
      }
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
        title="Excluir secretária?"
        description={`"${fullName}" perde o acesso ao sistema e sai da lista. Pacientes e exames que ela já lançou não são apagados — continuam mostrando ela como responsável.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
