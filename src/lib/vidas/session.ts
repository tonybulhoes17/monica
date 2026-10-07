import "server-only";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "./crypto";

export interface VidasSession {
  accessToken: string;
  expiresAt: Date;
  certificateAlias: string | null;
}

export async function getActiveVidasSession(
  profileId: string,
): Promise<VidasSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vidas_sessions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt.getTime() <= Date.now()) return null;

  return {
    accessToken: decryptSecret(data.access_token_encrypted),
    expiresAt,
    certificateAlias: data.certificate_alias,
  };
}

export async function saveVidasSession(params: {
  profileId: string;
  accessToken: string;
  expiresAt: Date;
  certificateAlias?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("vidas_sessions").upsert(
    {
      profile_id: params.profileId,
      access_token_encrypted: encryptSecret(params.accessToken),
      expires_at: params.expiresAt.toISOString(),
      certificate_alias: params.certificateAlias ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
  if (error) throw new Error(error.message);
}

export async function clearVidasSession(profileId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("vidas_sessions").delete().eq("profile_id", profileId);
}
