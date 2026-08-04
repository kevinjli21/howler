import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query the likes table, and pull the complete post + profile details inside it
    const { data, error } = await supabase
      .from('likes')
      .select(`
        created_at,
        post:posts (
          id,
          content,
          image_url,
          posted_at,
          user_id,
          profiles (full_name, avatar_url, username, campus:campus_id(name)),
          categories (category_name, color),
          comments (count),
          likes:likes (count)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }); // Chronological order of the action

    if (error) throw error;

    // Flatten the array so it returns an array of structured post objects
    const flattenedPosts = data.map(item => ({
      ...item.post,
      user_has_liked: [{ user_id: user.id }] // Force this state so the heart shows up red
    }));

    return NextResponse.json(flattenedPosts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}