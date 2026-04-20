import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log("CALLBACK HIT - Code present:", !!code);

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("AUTH EXCHANGE ERROR:", error.message);
    } else {
      console.log("AUTH EXCHANGE SUCCESS - User:", data.user?.email);
    }
    if (!error) {
      revalidatePath('/', 'layout') 
    
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}