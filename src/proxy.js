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
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  // Token refresh poke. A tampered/malformed session cookie can throw here
  // (rather than just returning an auth error) — treat that the same as
  // "no user" instead of crashing the middleware for every request.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const identifier = getClientIdentifier(request, user?.id)
      const limiter = MUTATING_METHODS.includes(request.method) ? writeLimiter : apiLimiter
      const { success, limit, remaining, reset } = await limiter.limit(identifier)

      if (!success) {
        return rateLimitedResponse({ limit, remaining, reset })
      }
    } catch {
      // Redis unavailable (missing env vars in local dev) — skip rate limiting
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}