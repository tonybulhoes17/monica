import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Ban "permanente" no Supabase Auth — a API não tem um valor literal pra
// "pra sempre", então usamos uma duração bem longa (~100 anos), idioma
// comum pra isso no GoTrue.
const PERMANENT_BAN_DURATION = "876000h";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const { fullName, email, password } = await request.json();

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Nome e e-mail são obrigatórios." },
      { status: 400 },
    );
  }
  if (password && password.length < 8) {
    return NextResponse.json(
      { error: "A nova senha precisa ter ao menos 8 caracteres." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email,
    ...(password ? { password } : {}),
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * "Exclui" a secretária sem apagar o perfil: patients.created_by e
 * exams.created_by exigem um created_by válido pra sempre, então uma
 * exclusão de verdade quebraria (ou, numa versão com "on delete set
 * null", apagaria a autoria dos registros antigos). Em vez disso,
 * desativa — active=false (ver migração 0015) bloqueia o app pela
 * segunda camada em requireProfile(), e o ban no Supabase Auth bloqueia
 * o login em si. Nenhum paciente/exame já lançado é tocado.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();

  const { error: banError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: PERMANENT_BAN_DURATION,
  });
  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ active: false })
    .eq("id", id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
