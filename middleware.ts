import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="best-item admin"',
    },
  })
}

function serviceUnavailable() {
  return new NextResponse('Admin credentials are not configured', {
    status: 503,
  })
}

function verifyBasicAuth(request: NextRequest, username: string, password: string) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Basic ')) {
    return false
  }

  try {
    const decoded = atob(auth.slice(6))
    const separator = decoded.indexOf(':')
    if (separator < 0) return false

    const suppliedUser = decoded.slice(0, separator)
    const suppliedPassword = decoded.slice(separator + 1)

    return suppliedUser === username && suppliedPassword === password
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Supabase セッションリフレッシュ（全リクエスト）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Admin ページの Basic 認証
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const username = process.env.BEST_ITEM_ADMIN_USER || ''
    const password = process.env.BEST_ITEM_ADMIN_PASSWORD || ''

    if (!username || !password) {
      if (process.env.NODE_ENV !== 'production') {
        return supabaseResponse
      }
      return serviceUnavailable()
    }

    if (!verifyBasicAuth(request, username, password)) {
      return unauthorized()
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
