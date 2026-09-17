import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: "server_configuration_error" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerError } = await userClient.auth.getUser();
  if (callerError || !callerData.user) {
    return json({ error: "unauthorized" }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role, is_disabled")
    .eq("id", callerData.user.id)
    .maybeSingle();

  if (profileError || callerProfile?.role !== "admin" || callerProfile.is_disabled) {
    return json({ error: "admin_only" }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : null;
  const role = typeof payload.role === "string" ? payload.role : "viewer";
  const branchId = typeof payload.branch_id === "string" && payload.branch_id ? payload.branch_id : null;
  const zoneId = typeof payload.zone_id === "string" && payload.zone_id ? payload.zone_id : null;

  if (!email || !email.includes("@") || password.length < 6) {
    return json({ error: "valid_email_and_password_required" }, 400);
  }
  if (!["admin", "branch_user", "zone_user", "viewer"].includes(role)) {
    return json({ error: "invalid_role" }, 400);
  }
  if (role === "branch_user" && !branchId) {
    return json({ error: "branch_required" }, 400);
  }
  if (role === "zone_user" && !zoneId) {
    return json({ error: "zone_required" }, 400);
  }

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (createError || !createdUser.user) {
    return json({ error: createError?.message || "user_creation_failed" }, 400);
  }

  const authUid = createdUser.user.id;
  const { error: profileUpsertError } = await adminClient.from("profiles").upsert(
    {
      id: authUid,
      email,
      full_name: fullName,
      role,
      branch_id: branchId,
      zone_id: zoneId,
      is_disabled: false,
    },
    { onConflict: "id" },
  );

  if (profileUpsertError) {
    await adminClient.auth.admin.deleteUser(authUid);
    return json({ error: profileUpsertError.message || "profile_creation_failed" }, 500);
  }

  return json({ user: { id: authUid, email }, profile: { role, branch_id: branchId, zone_id: zoneId } }, 201);
});
