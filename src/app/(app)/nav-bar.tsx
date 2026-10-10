"use client";

import Image from "next/image";
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/branding/logo.png"
                alt="Dra. Monica Seixas"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="font-semibold text-slate-900">Laudos de EEG</span>
          </Link>
          <nav className="flex gap-5 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "relative py-0.5 text-slate-500 transition-colors hover:text-slate-900",
                  pathname.startsWith(link.href) &&
                    "font-medium text-[#002060] after:absolute after:-bottom-[13px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[#002060]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <Link
            href="/pacientes/novo"
            className="rounded-full bg-[#002060] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#001845] hover:shadow"
          >
            + Novo paciente
          </Link>
          <span className="hidden text-slate-500 sm:inline">{profile.full_name}</span>
          <button
            onClick={handleSignOut}
            className="rounded-full border border-transparent px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
