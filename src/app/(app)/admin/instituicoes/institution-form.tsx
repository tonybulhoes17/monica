"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Institution } from "@/lib/database.types";
import { createInstitution, updateInstitution } from "./actions";

export function InstitutionForm({
  institution,
}: {
  institution?: Institution;
}) {
  const router = useRouter();
  const [name, setName] = useState(institution?.name ?? "");
  const [address, setAddress] = useState(institution?.address ?? "");
  const [headerLines, setHeaderLines] = useState(
    institution?.header_lines ?? "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      let logoUrl: string | null = institution?.logo_url ?? null;

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

      if (institution) {
        await updateInstitution(institution.id, {
          name,
          address,
          headerLines,
          logoUrl,
        });
        setSaved(true);
      } else {
        await createInstitution({ name, address, headerLines, logoUrl });
        setName("");
        setAddress("");
        setHeaderLines("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="mt-1 flex items-center gap-3">
            {institution?.logo_url && (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50">
                <Image
                  src={institution.logo_url}
                  alt={institution.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>
          {institution?.logo_url && (
            <p className="mt-1 text-xs text-slate-400">
              Deixe em branco para manter a logo atual.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Endereço
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          placeholder="Ex: Av. Tancredo Neves, 1632, sala 101 — Caminho das Árvores, Salvador - BA"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">
          Aparece pequeno no rodapé do laudo impresso.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Texto do cabeçalho (ao lado da logo)
        </label>
        <textarea
          value={headerLines}
          onChange={(e) => setHeaderLines(e.target.value)}
          rows={3}
          placeholder={
            "SECRETARIA MUNICIPAL DE SAÚDE\nIGH - INSTITUTO DE GESTÃO E HUMANIZAÇÃO\nPOLICLÍNICA FRANCISCO MARTINS DA SILVA"
          }
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-400">
          Uma linha por linha. Deixe em branco para usar o texto padrão
          (&quot;Neurofisiologia Clínica / Eletroencefalograma Digital
          (EEG) / Vídeo-Eletroencefalograma (Vídeo-EEG)&quot;).
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Instituição salva.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting
          ? "Salvando..."
          : institution
            ? "Salvar alterações"
            : "Adicionar instituição"}
      </button>
    </form>
  );
}
