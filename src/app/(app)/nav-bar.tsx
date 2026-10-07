"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/database.types";
import clsx from "clsx";

export function NavBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Painel" },
    { href: "/pacientes/novo", label: "Novo paciente" },
    ...(profile.role === "admin"
      ? [
          { href: "/admin/secretarias", label: "Secretárias" },
          { href: "/admin/modelos", label: "Modelos de laudo" },
          { href: "/admin/instituicoes", label: "Instituições" },
        ]
      : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Laudos de EEG</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-slate-600 hover:text-slate-900",
                  pathname.startsWith(link.href) && "font-medium text-slate-900",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{profile.full_name}</span>
          <button
            onClick={handleSignOut}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
