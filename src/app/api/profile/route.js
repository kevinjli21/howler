import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch user metadata profile row matching the username string
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, campus:campus_id(name)')
      .eq('username', username)
      .maybeSingle(); // Prevents crashing if the username doesn't exist

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch their public timeline posts including counts and categories
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, 
        content, 
        image_url, 
        posted_at,
        user_id,
        profiles (full_name, avatar_url, username),
        categories (category_name, color),
        comments (count),
        likes:likes (count)
      `)
      .eq('user_id', profile.id)
      .order('posted_at', { ascending: false });

    if (postsError) throw postsError;

    return NextResponse.json({ profile, posts });
  } catch (error) {
    console.error("Public profile fetch failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}