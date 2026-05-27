/**
 * Auth helpers: server-side email validation via Edge Function
 * Replaces direct RPC calls to check_email_status and check_email_role
 * (which have been moved to private schema for security)
 */

import { emailSchema } from './validators';

export interface EmailCheckResponse {
  status?: string; // available, pending_verification, verified
  role?: string; // conductor, garage
  error?: string;
}

/**
 * Check email status: available | pending_verification | verified
 * Calls the Edge Function /functions/check-email-availability
 * @param email Email address to check
 * @param supabaseUrl Supabase project URL (from env)
 * @returns Email status or error
 */
export async function checkEmailStatus(
  email: string,
  supabaseUrl: string
): Promise<EmailCheckResponse> {
  try {
    // Validate email format first
    const validated = emailSchema.parse(email);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/check-email-availability?email=${encodeURIComponent(validated)}&type=status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[checkEmailStatus] HTTP ${response.status}`);
      return { error: 'Email validation failed' };
    }

    const data = (await response.json()) as EmailCheckResponse;
    return data;
  } catch (err) {
    console.error('[checkEmailStatus] Error:', err);
    return { error: 'Failed to check email availability' };
  }
}

/**
 * Check email role: returns the role (conductor|garage) if exists
 * Calls the Edge Function /functions/check-email-availability
 * @param email Email address to check
 * @param supabaseUrl Supabase project URL (from env)
 * @returns Role (conductor|garage) or null if not found
 */
export async function checkEmailRole(
  email: string,
  supabaseUrl: string
): Promise<EmailCheckResponse> {
  try {
    // Validate email format first
    const validated = emailSchema.parse(email);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/check-email-availability?email=${encodeURIComponent(validated)}&type=role`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[checkEmailRole] HTTP ${response.status}`);
      return { error: 'Email validation failed' };
    }

    const data = (await response.json()) as EmailCheckResponse;
    return data;
  } catch (err) {
    console.error('[checkEmailRole] Error:', err);
    return { error: 'Failed to check email role' };
  }
}
