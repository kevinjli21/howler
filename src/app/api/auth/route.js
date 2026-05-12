import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ authenticated: false, message: "Not logged in" }, { status: 401 });
  }

  // 2. Fetch the specific profile data from the 'profiles' table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('avatar_url, full_name, username') // Fetch whatever fields you need
    .eq('id', user.id)
    .single(); // Since ID is unique, we expect exactly one row

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    // You can decide if you want to fail or just return the auth data without the avatar
  }

  return NextResponse.json({
    authenticated: true,
    email: user.email,
    id: user.id,
    // 3. Return the avatar_url from the PROFILES table
    avatar_url: profile?.avatar_url || null,
    full_name: profile?.full_name || user.user_metadata?.name,
    username: profile?.username || null
  });
}