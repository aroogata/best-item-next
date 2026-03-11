import { NextRequest, NextResponse } from 'next/server'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  const username = process.env.BEST_ITEM_ADMIN_USER || ''
  const password = process.env.BEST_ITEM_ADMIN_PASSWORD || ''

  if (!username || !password) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.next()
    }
    return serviceUnavailable()
  }

  if (!verifyBasicAuth(request, username, password)) {
    return unauthorized()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
