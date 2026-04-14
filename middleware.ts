import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── BLOCKLIST ────────────────────────────────────────────────────────────────

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
  try {
    const ua = (request.headers.get('user-agent') ?? '').toLowerCase()

    // Regra 1 e 2: allowlist e UA vazio passam livremente
    if (!ALLOWED_BOTS.some(b => ua.includes(b)) && ua.trim()) {
      // Regra 3: UA na blocklist → bloqueia
      if (BOT_BLOCKLIST.some(b => ua.includes(b))) {
        return new NextResponse('Acesso negado.', {
          status: 403,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      }
    }
  } catch {
    // Fail-safe: em caso de erro as regras de bloqueio são ignoradas
  }

  // ── Lógica de Autenticação Supabase ───────────────────────────────────────
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
