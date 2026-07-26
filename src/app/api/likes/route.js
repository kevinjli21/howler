import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isValidUUID, dbErrorResponse } from '@/utils/apiError';

export async function POST(req) {
  try {
    const supabase = await createClient();

    // 1. Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the post_id from the incoming request body
    const { post_id } = await req.json();
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }
    if (!isValidUUID(post_id)) {
      return NextResponse.json({ error: 'Invalid post_id.' }, { status: 400 });
    }

    // 3. Call the Postgres function we created in the database
    const { data, error } = await supabase.rpc('toggle_post_like', {
      target_post_id: post_id,
      target_user_id: user.id
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return dbErrorResponse(error);
  }
}