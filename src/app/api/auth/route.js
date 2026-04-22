import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // This is the moment of truth for your backend routing
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ authenticated: false, message: "Not logged in" }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    email: user.email,
    name: user.user_metadata?.name,
    id: user.id,
    image: user.user_metadata?.image,
    avatar: user.user_metadata?.avatar_url
  });
}