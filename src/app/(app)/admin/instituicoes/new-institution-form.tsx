"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createInstitution } from "./actions";

export function NewInstitutionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let logoUrl: string | null = null;

      if (file) {
        const supabase = createClient();
        const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("institution-logos")
          .upload(path, file);

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage
          .from("institution-logos")
          .getPublicUrl(path);
        logoUrl = data.publicUrl;
      }

      await createInstitution({ name, logoUrl });

      setName("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nome da instituição
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Logo (cabeçalho do laudo)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Salvando..." : "Adicionar instituição"}
        </button>
      </div>
      {error && (
        <p className="sm:col-span-3 text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
