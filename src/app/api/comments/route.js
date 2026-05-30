import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { AllProfanity } from 'allprofanity';
import config from '@/utils/allprofanity/allprofanity.config.json';

const MAX_COMMENT_LIMIT = 280;

// FETCH COMMENTS FOR A POST
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles(full_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE A NEW COMMENT OR REPLY
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id, content, parent_id } = await req.json();
    const cleanContent = content?.trim() || '';

    if (!cleanContent) return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    if (cleanContent.length > MAX_COMMENT_LIMIT) {
      return NextResponse.json({ error: `Comment must be under ${MAX_COMMENT_LIMIT} characters.` }, { status: 400 });
    }

    const filter = AllProfanity.fromConfig(config);
    if (filter.check(cleanContent)) {
      return NextResponse.json({ error: 'Inappropriate content detected in comment.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id,
        user_id: user.id,
        content: cleanContent,
        parent_id: parent_id || null
      }])
      .select(`*, profiles(full_name, username, avatar_url)`)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE A COMMENT
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}