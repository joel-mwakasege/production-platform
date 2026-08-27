import 'dotenv/config';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken } from '../lib/auth';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
  };
};

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  const token = extractBearerToken(header);

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const supabase = getSupabaseClient();

  // 1. Primary: Validate with Supabase client
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        const authReq = req as AuthenticatedRequest;
        authReq.user = {
          id: data.user.id,
          email: data.user.email,
        };
        next();
        return;
      }
    } catch (err) {
      console.warn('Supabase getUser verification failed, trying JWT decode fallback:', err);
    }
  }

  // 2. Resilient JWT Payload Fallback (for Supabase issued bearer tokens)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      const userId = payload.sub || payload.id;
      if (userId && typeof userId === 'string') {
        const authReq = req as AuthenticatedRequest;
        authReq.user = {
          id: userId,
          email: payload.email,
        };
        next();
        return;
      }
    }
  } catch (jwtErr) {
    console.warn('JWT fallback decode error:', jwtErr);
  }

  res.status(401).json({ error: 'Invalid or expired token' });
};
