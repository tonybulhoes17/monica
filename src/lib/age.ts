interface AgeBreakdown {
  years: number;
  months: number;
}

/** Anos e meses completos entre `birthDate` e a data de referência `onDate` (exame). */
function calculateAgeBreakdown(
  birthDate: string | Date,
  onDate: string | Date = new Date(),
): AgeBreakdown {
  const birth = new Date(birthDate);
  const ref = new Date(onDate);

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  if (!Number.isFinite(years) || years < 0) {
    return { years: 0, months: 0 };
  }

  return { years, months };
}

/** Idade em anos completos (número) — usada quando só o valor numérico importa. */
export function calculateAge(
  birthDate: string | Date,
  onDate: string | Date = new Date(),
): number {
  return calculateAgeBreakdown(birthDate, onDate).years;
}

/**
 * Idade para exibição no laudo/cadastro: "N anos" a partir de 2 anos
 * completos; abaixo disso, "N ano(s) e M mes(es)" (ou só meses), seguindo o
 * padrão usado nos laudos da Dra. Monica para lactentes/crianças pequenas.
 */
export function formatAge(
  birthDate: string | Date,
  onDate: string | Date = new Date(),
): string {
  const { years, months } = calculateAgeBreakdown(birthDate, onDate);

  if (years >= 2) {
    return `${years} anos`;
  }
  if (years === 1) {
    return months === 0 ? "1 ano" : `1 ano e ${months} ${months === 1 ? "mês" : "meses"}`;
  }
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}
