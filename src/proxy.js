import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { apiLimiter, writeLimiter, getClientIdentifier, rateLimitedResponse } from '@/utils/rateLimit'

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Token refresh poke
  const { data: { user } } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(request, user?.id)
    const limiter = MUTATING_METHODS.includes(request.method) ? writeLimiter : apiLimiter
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      return rateLimitedResponse({ limit, remaining, reset })
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}