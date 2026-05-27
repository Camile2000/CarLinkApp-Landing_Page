import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Type definitions
interface CheckEmailRequest {
  email: string;
  type: "status" | "role";
}

interface CheckEmailResponse {
  status?: string; // available, pending_verification, verified
  role?: string; // conductor, garage
  error?: string;
}

// Helper: Rate limiting with simple in-memory store
// In production, use Redis or Supabase storage for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number = 10, windowSeconds: number = 60): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Validate email format (basic)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

serve(async (req: Request) => {
  // === CORS Headers ===
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // === Rate Limiting ===
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (!checkRateLimit(clientIp, 10, 60)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // === Parse Query Parameters ===
    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.toLowerCase().trim();
    const type = url.searchParams.get("type") || "status";

    if (!email || !["status", "role"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid parameters: email and type (status|role)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // === Initialize Supabase Client with service_role ===
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // === Call Private Functions ===
    let result: CheckEmailResponse = {};

    if (type === "status") {
      const { data, error } = await supabase.rpc("check_email_status", {
        p_email: email,
      });

      if (error) {
        console.error("Error calling check_email_status:", error);
        return new Response(JSON.stringify({ error: "Failed to check email status" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      result.status = data || "available";
    } else if (type === "role") {
      const { data, error } = await supabase.rpc("check_email_role", {
        p_email: email,
      });

      if (error) {
        console.error("Error calling check_email_role:", error);
        return new Response(JSON.stringify({ error: "Failed to check email role" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      result.role = data || null;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
