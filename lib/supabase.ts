import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bmtopbbhgyqxvgqsthdq.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_fNL5OibKqmko-SEol7-dUg_Xg7-ZbQA"
  )
}
