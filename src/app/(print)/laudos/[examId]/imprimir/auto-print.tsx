"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Dispara a caixa de diálogo de impressão do navegador ao abrir a página,
 *  exceto quando é o Puppeteer renderizando para gerar o PDF (?pdf=1). */
export function AutoPrint() {
  const searchParams = useSearchParams();
  const isPdfRender = searchParams.get("pdf") === "1";

  useEffect(() => {
    if (isPdfRender) return;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [isPdfRender]);

  return null;
}
