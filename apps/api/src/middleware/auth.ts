import 'dotenv/config';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken } from '../lib/auth';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
  
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

  if (!supabase) {
    res.status(503).json({ error: 'Authentication service is not configured' });
    return;
  }

  try {
    const { data, error } = await (supabase.auth as any).getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (err: any) {
    console.error('Auth verification error:', err);
    res.status(500).json({ error: err.message || 'Authentication error' });
  }
};