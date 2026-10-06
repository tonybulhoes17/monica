import { PatientExamForm } from "./patient-exam-form";

export default function NovoPacientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Lançar paciente / exame
      </h1>
      <PatientExamForm />
    </div>
  );
}
