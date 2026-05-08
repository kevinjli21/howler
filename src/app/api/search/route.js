import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ profiles: [], posts: [] });

  const supabase = await createClient();
  const searchKeyword = `%${query}%`;

    const [profilesRes, postsRes] = await Promise.all([
    supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.${searchKeyword},full_name.ilike.${searchKeyword}`)
        .limit(5),

    supabase
        .from('posts')
        .select(`
        id, 
        content, 
        image_url, 
        posted_at, 
        profiles(full_name, username, avatar_url)
        `) // Added image_url here
        .ilike('content', searchKeyword)
        .order('posted_at', { ascending: false })
        .limit(10)
    ]);

  return NextResponse.json({
    profiles: profilesRes.data || [],
    posts: postsRes.data || []
  });
}