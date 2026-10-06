import { requireProfile } from "@/lib/auth";
import { NavBar } from "./nav-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar profile={profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
