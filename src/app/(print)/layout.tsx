import { requireProfile } from "@/lib/auth";

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile();
  return <div className="bg-slate-100 py-8">{children}</div>;
}
