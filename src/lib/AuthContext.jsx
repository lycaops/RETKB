import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import supabase from '@/api/supabaseClient';
import { safeReturnTo } from '@/lib/authReturnTo';

const AuthContext = createContext();

async function fetchProfile(uid) {
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, is_disabled, branch_id, zone_id, created_at, updated_at, branches:branch_id(name, code), zones:zone_id(name, code)',
    )
    .eq('id', uid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    is_disabled: data.is_disabled,
    branch_id: data.branch_id,
    zone_id: data.zone_id,
    branch_name: data.branches?.name || null,
    zone_name: data.zones?.name || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ id: 'retailer-incentive-app', public_settings: {} });

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthError(null);
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }
      setUser(session.user);
      setIsAuthenticated(!!session.user);
      setIsLoadingAuth(true);
      const p = await fetchProfile(session.user.id);
      if (!p) {
        setAuthError({
          type: 'user_not_registered',
          message: 'User not registered for this app. Ask an admin to assign a profile.',
        });
      } else if (p.is_disabled) {
        setAuthError({
          type: 'user_not_registered',
          message: 'Your account has been disabled. Contact the administrator.',
        });
      }
      setProfile(p);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const session = sessionData?.session;
      setIsLoadingPublicSettings(false);

      if (!session) {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      setUser(session.user);
      setIsAuthenticated(true);
      const p = await fetchProfile(session.user.id);
      if (!p) {
        setAuthError({
          type: 'user_not_registered',
          message: 'User not registered for this app. Ask an admin to assign a profile.',
        });
      } else if (p.is_disabled) {
        setAuthError({
          type: 'user_not_registered',
          message: 'Your account has been disabled. Contact the administrator.',
        });
      }
      setProfile(p);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'Failed to load app',
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    await checkAppState();
  }, [checkAppState]);

  const signIn = useCallback(async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const resendOtp = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email, token) => {
    const { error, data } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (error) throw error;
    return data;
  }, []);

  const resetPasswordRequest = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  }, []);

  const updateUserPassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = '/login';
      }
    });
  }, []);

  const navigateToLogin = useCallback(() => {
    const dest = '/login?returnTo=' + encodeURIComponent(safeReturnTo());
    window.location.href = dest;
  }, []);

  const mergedUser = profile
    ? { ...(user || {}), role: profile.role, profile, email: profile.email || user?.email }
    : user || null;

  return (
    <AuthContext.Provider
      value={{
        user: mergedUser,
        profile,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
        signIn,
        signUp,
        resendOtp,
        verifyOtp,
        resetPasswordRequest,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
