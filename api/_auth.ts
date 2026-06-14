import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function verifyUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: error?.message || 'Unauthorized user' };
  }
  return { user, error: null };
}

export async function checkRateLimit(
  userId: string, 
  actionType: 'analysis' | 'recommend' | 'review', 
  cooldownSeconds: number
): Promise<{ allowed: boolean; waitTime?: number }> {
  const columnName = actionType === 'analysis' 
    ? 'last_analysis_at' 
    : actionType === 'recommend' 
      ? 'last_recommend_at' 
      : 'last_review_at';

  // Query the user profile timestamp
  const { data, error } = await supabase
    .from('profiles')
    .select(columnName)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error(`Failed to fetch rate limit timestamp for ${userId}:`, error);
    // Safe default: allow request if DB query fails, but log it
    return { allowed: true };
  }

  const lastRequestStr = (data as any)?.[columnName];
  if (lastRequestStr) {
    const lastRequest = new Date(lastRequestStr).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - lastRequest) / 1000;
    
    if (elapsedSeconds < cooldownSeconds) {
      return { 
        allowed: false, 
        waitTime: Math.ceil(cooldownSeconds - elapsedSeconds) 
      };
    }
  }

  // Update the database timestamp to now
  await supabase
    .from('profiles')
    .update({ [columnName]: new Date().toISOString() })
    .eq('id', userId);

  return { allowed: true };
}

export function sanitizeText(text: string, maxLength = 50): string {
  if (!text) return '';
  
  // Strip common prompt injection trigger words/phrases
  let cleaned = text
    .replace(/(ignore\s+previous|ignore\s+all|system\s+command|you\s+are\s+now|override|developer\s+mode|jailbreak|pretend\s+to)/gi, '')
    .trim();
    
  return cleaned.slice(0, maxLength);
}
