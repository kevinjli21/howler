import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  // 1. Create a "blank" response based on the request
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
          // 2. Teleport the cookies into the current request 
          // so your API routes can see them immediately
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // 3. Update the response so the browser saves the cookies
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

  // 4. IMPORTANT: This "poke" triggers the setAll logic above
  // to refresh the session if it's expired.
  await supabase.auth.getUser()

  return response;
}

export const config = {
  // This matcher makes sure the proxy runs on your API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}