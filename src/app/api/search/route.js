import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) return NextResponse.json({ profiles: [], posts: [] });

  const supabase = await createClient();
  // Escape ilike wildcards so a literal '%' or '_' in the user's query is
  // matched literally instead of acting as a SQL wildcard.
  const escapedQuery = query.replace(/[%_]/g, (c) => `\\${c}`);
  const searchKeyword = `%${escapedQuery}%`;

  const [profilesRes, postsRes] = await Promise.all([
    // 1. Search User Profiles
    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.${searchKeyword},full_name.ilike.${searchKeyword}`)
      .limit(5),

    // 2. Search Posts (Now returning categories for the UI badges)
    supabase
      .from('posts')
      .select(`
        id, 
        content, 
        image_url, 
        posted_at, 
        profiles(full_name, username, avatar_url, campus:campus_id(name)),
        categories(category_name, color)
      `)
      .ilike('content', searchKeyword)
      .order('posted_at', { ascending: false })
      .limit(10)
  ]);

  return NextResponse.json({
    profiles: profilesRes.data || [],
    posts: postsRes.data || []
  });
}