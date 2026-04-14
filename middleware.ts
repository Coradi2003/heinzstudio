import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  MODO DEBUG — NUNCA BLOQUEIA
// Listas de referência usadas APENAS para diagnóstico via headers de resposta.
// Nenhuma lógica de bloqueio está ativa.
// ─────────────────────────────────────────────────────────────────────────────

const BOT_BLOCKLIST = [
  'scrapy', 'crawler', 'spider', 'scraper',
  'wget', 'python-requests', 'python-urllib', 'python-httpx', 'aiohttp',
  'go-http-client', 'okhttp', 'node-fetch', 'got/',
  'phin', 'superagent', 'needle', 'axios/',
  'zgrab', 'masscan', 'nikto', 'sqlmap', 'nuclei',
  'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'burpsuite',
  'nessus', 'openvas', 'acunetix', 'appscan',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'yandexbot', 'baiduspider', 'rogerbot', 'blexbot', 'exabot',
  'dataprovider', 'linkdexbot', 'spbot', 'seokicks',
  'headlesschrome', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
  'playwright', 'cypress', 'testcafe', 'nightmare',
] as const

const ALLOWED_BOTS = [
  'googlebot', 'google-inspectiontool', 'google-read-aloud',
  'bingbot', 'duckduckbot', 'slurp',
  'whatsapp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'slackbot', 'discordbot', 'telegrambot', 'linkedinbot',
] as const

export async function middleware(request: NextRequest) {
  // ⚠️ DEBUG: captura UA no início — sem bloquear nada
  const _ua = request.headers.get('user-agent') ?? ''
  const _uaLower = _ua.toLowerCase()
  const _debugAllowed = ALLOWED_BOTS.find(b => _uaLower.includes(b)) ?? 'none'
  const _debugBlocked = BOT_BLOCKLIST.find(b => _uaLower.includes(b)) ?? 'none'

  // ── Lógica original intacta ───────────────────────────────────────────────
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bmtopbbhgyqxvgqsthdq.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_fNL5OibKqmko-SEol7-dUg_Xg7-ZbQA",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Rotas protegidas (tudo menos o login)
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Se estiver na tela de login e já logado, vai pro dash
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ⚠️ DEBUG: injeta headers de diagnóstico antes do return final
  // Visíveis no DevTools → Network → response headers de qualquer página
  response.headers.set('x-debug-ua', _ua.slice(0, 250))
  response.headers.set('x-debug-ua-empty', !_ua.trim() ? 'true' : 'false')
  response.headers.set('x-debug-allowed-match', _debugAllowed)
  response.headers.set('x-debug-blocked-match', _debugBlocked)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
