import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@carlink/shared/supabase/client';
import type { UserProfile } from '@carlink/shared';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfileOnce(uid: string): Promise<{ profile: UserProfile | null; error: boolean }> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, role, city, language, avatar_url, created_at, updated_at')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    console.warn('[auth] fetchProfile error', error.message);
    return { profile: null, error: true };
  }
  return { profile: (data as UserProfile | null) ?? null, error: false };
}

// Retry une fois après 800ms : couvre la course "verifyOtp → trigger handle_new_user".
async function fetchProfileWithRetry(uid: string): Promise<{ profile: UserProfile | null; error: boolean }> {
  const first = await fetchProfileOnce(uid);
  if (first.profile || first.error === false) return first;
  await new Promise((r) => setTimeout(r, 800));
  return fetchProfileOnce(uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const mountedRef = useRef(true);

  const refreshProfile = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setProfile(null);
      setProfileError(false);
      return;
    }
    const { profile: p, error } = await fetchProfileWithRetry(uid);
    if (!mountedRef.current) return;
    setProfile(p);
    setProfileError(error);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, sess: Session | null) => {
        setSession(sess);
        setUser(sess?.user ?? null);

        if (sess?.user) {
          const { profile: p, error } = await fetchProfileWithRetry(sess.user.id);
          if (!mountedRef.current) return;
          setProfile(p);
          setProfileError(error);
        } else {
          setProfile(null);
          setProfileError(false);
        }

        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, profileError, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
