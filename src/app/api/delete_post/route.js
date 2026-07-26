import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { dbErrorResponse } from '@/utils/apiError';

export async function DELETE(req) {
  try {
    const supabase = await createClient();
    
    // 1. Verify User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });
    }

    // 2. Look up the post's image (if any) before deleting the row, so we
    // can clean it up from Storage too — otherwise it stays publicly
    // reachable forever after the post is gone.
    const { data: existingPost } = await supabase
      .from('posts')
      .select('image_url')
      .eq('id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    // 3. Delete the post (Matches post ID AND current user's ID)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id); // Ultimate safety mechanism

    if (deleteError) throw deleteError;

    if (existingPost?.image_url) {
      const path = existingPost.image_url.split('/posts/').pop();
      if (path) {
        const { error: storageError } = await supabase.storage.from('posts').remove([path]);
        if (storageError) console.error('Failed to remove post image from Storage:', storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}