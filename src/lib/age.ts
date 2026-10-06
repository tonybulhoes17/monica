/** Idade em anos completos de `birthDate` na data de referência `onDate` (exame). */
export function calculateAge(birthDate: string | Date, onDate: string | Date = new Date()): number {
  const birth = new Date(birthDate);
  const ref = new Date(onDate);

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
