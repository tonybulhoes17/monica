import { requireProfile } from "@/lib/auth";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile();
  // bg-slate-100/py-8 são só pro preview na tela (a folha branca "flutuando"
  // sobre um fundo cinza) — sem as variantes print:, esse fundo e esse
  // respiro apareciam também no PDF de verdade, como uma tarja cinza fina
  // no topo da 1ª página e no fim da última.
  return <div className="bg-slate-100 py-8 print:bg-white print:py-0">{children}</div>;
}
