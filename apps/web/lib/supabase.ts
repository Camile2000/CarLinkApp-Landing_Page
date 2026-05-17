import { createSupabaseClient } from '@carlink/shared';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createSupabaseClient({ url, anonKey });
