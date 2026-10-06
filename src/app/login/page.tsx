import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Laudos de EEG
          </h1>
          <p className="text-sm text-slate-500">
            {process.env.NEXT_PUBLIC_CLINIC_NAME}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
