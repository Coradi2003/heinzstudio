import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bmtopbbhgyqxvgqsthdq.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_fNL5OibKqmko-SEol7-dUg_Xg7-ZbQA",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'heinz-studio-auth-v1',
        // Força o uso do localStorage no navegador (melhor para PWA)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    }
  )
}
