import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isValidUUID, dbErrorResponse } from '@/utils/apiError';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id, reason } = await req.json();

    if (!isValidUUID(post_id)) {
      return NextResponse.json({ error: 'Invalid post_id.' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Please select a reason for the report.' }, { status: 400 });
    }

    // Prevent the same user from spamming repeat reports on the same post.
    const { data: existing, error: existingError } = await supabase
      .from('reports')
      .select('id')
      .eq('post_id', post_id)
      .eq('report_creator_id', user.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({ error: 'You have already reported this post.' }, { status: 409 });
    }

    const { error } = await supabase
      .from('reports')
      .insert([{
        post_id,
        report_creator_id: user.id,
        report_reason: reason.trim()
      }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
