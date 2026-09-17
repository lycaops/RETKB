import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const send = (res, status, body) => res.status(status).json(body);

const getPayload = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'method_not_allowed' });
  }

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return send(res, 500, { error: 'server_configuration_error' });
  }

  const authorization = req.headers.authorization;
  if (!authorization) {
    return send(res, 401, { error: 'unauthorized' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerError } = await userClient.auth.getUser();
  if (callerError || !callerData.user) {
    return send(res, 401, { error: 'unauthorized' });
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, is_disabled')
    .eq('id', callerData.user.id)
    .maybeSingle();

  if (profileError || callerProfile?.role !== 'admin' || callerProfile.is_disabled) {
    return send(res, 403, { error: 'admin_only' });
  }

  const payload = getPayload(req.body);
  if (!payload) {
    return send(res, 400, { error: 'invalid_json' });
  }

  const action = typeof payload.action === 'string' ? payload.action : 'create';
  const userId = typeof payload.user_id === 'string' ? payload.user_id : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : null;
  const role = typeof payload.role === 'string' ? payload.role : 'viewer';
  const branchId = typeof payload.branch_id === 'string' && payload.branch_id ? payload.branch_id : null;
  const zoneId = typeof payload.zone_id === 'string' && payload.zone_id ? payload.zone_id : null;

  if (action === 'delete') {
    if (!userId || userId === callerData.user.id) {
      return send(res, 400, { error: 'valid_non_self_user_id_required' });
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return send(res, 400, { error: error.message || 'user_deletion_failed' });
    return send(res, 200, { deleted: true, user_id: userId });
  }

  if (action === 'disable') {
    if (!userId || userId === callerData.user.id) {
      return send(res, 400, { error: 'valid_non_self_user_id_required' });
    }

    const { error } = await adminClient
      .from('profiles')
      .update({ is_disabled: payload.is_disabled === true })
      .eq('id', userId);
    if (error) return send(res, 400, { error: error.message || 'profile_update_failed' });
    return send(res, 200, { updated: true, user_id: userId });
  }

  if (action === 'update') {
    if (!userId || !email || !email.includes('@')) {
      return send(res, 400, { error: 'valid_user_id_and_email_required' });
    }
    if (!['admin', 'branch_user', 'zone_user', 'viewer'].includes(role)) {
      return send(res, 400, { error: 'invalid_role' });
    }
    if (role === 'branch_user' && !branchId) {
      return send(res, 400, { error: 'branch_required' });
    }
    if (role === 'zone_user' && !zoneId) {
      return send(res, 400, { error: 'zone_required' });
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      email,
      user_metadata: fullName ? { full_name: fullName } : {},
    });
    if (authError) return send(res, 400, { error: authError.message || 'user_update_failed' });

    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ email, full_name: fullName, role, branch_id: branchId, zone_id: zoneId })
      .eq('id', userId);
    if (profileUpdateError) {
      return send(res, 500, { error: profileUpdateError.message || 'profile_update_failed' });
    }
    return send(res, 200, { updated: true, user_id: userId });
  }

  if (action !== 'create') {
    return send(res, 400, { error: 'invalid_action' });
  }
  if (!email || !email.includes('@') || password.length < 6) {
    return send(res, 400, { error: 'valid_email_and_password_required' });
  }
  if (!['admin', 'branch_user', 'zone_user', 'viewer'].includes(role)) {
    return send(res, 400, { error: 'invalid_role' });
  }
  if (role === 'branch_user' && !branchId) {
    return send(res, 400, { error: 'branch_required' });
  }
  if (role === 'zone_user' && !zoneId) {
    return send(res, 400, { error: 'zone_required' });
  }

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (createError || !createdUser.user) {
    return send(res, 400, { error: createError?.message || 'user_creation_failed' });
  }

  const authUid = createdUser.user.id;
  const { error: profileUpsertError } = await adminClient.from('profiles').upsert(
    {
      id: authUid,
      email,
      full_name: fullName,
      role,
      branch_id: branchId,
      zone_id: zoneId,
      is_disabled: false,
    },
    { onConflict: 'id' },
  );

  if (profileUpsertError) {
    await adminClient.auth.admin.deleteUser(authUid);
    return send(res, 500, { error: profileUpsertError.message || 'profile_creation_failed' });
  }

  return send(res, 201, {
    user: { id: authUid, email },
    profile: { role, branch_id: branchId, zone_id: zoneId },
  });
}
