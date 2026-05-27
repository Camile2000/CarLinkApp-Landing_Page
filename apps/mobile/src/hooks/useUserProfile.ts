import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@carlink/shared/supabase/client';
import type { UserProfile } from '@carlink/shared';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(userId: string | undefined): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('users')
      .select('id, full_name, role, city, language, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (err) {
      setError(err.message);
      setProfile(null);
    } else {
      setProfile(data as UserProfile);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, loading, error, refetch: fetch };
}
