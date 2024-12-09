import { createBrowserClient } from '@supabase/ssr';

export const createClient = (useServiceRole = false) => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole ? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
