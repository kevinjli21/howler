import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { dbErrorResponse } from '@/utils/apiError';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    if (!conversationId) return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });

    const { data: participation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participation) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('id, content, sender_id, created_at, profiles(full_name, avatar_url, username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(messages || []);
  } catch (error) {
    return dbErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: 'conversation_id and content are required' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const { data: participation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!participation) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({ conversation_id, sender_id: user.id, content: content.trim() })
      .select('id, content, sender_id, created_at')
      .single();

    if (error) throw error;

    // Keep the conversation's last_message_at in sync so the inbox list
    // sorts and displays by actual recent activity, not creation time.
    const { data: touched, error: touchError } = await supabase
      .from('conversations')
      .update({ last_message_at: message.created_at })
      .eq('id', conversation_id)
      .select('id');
    if (touchError) {
      console.error('Failed to update conversation last_message_at:', touchError);
    } else if (!touched || touched.length === 0) {
      // Supabase doesn't error when RLS silently blocks an update — it just
      // matches 0 rows. Surface it loudly so this doesn't regress unnoticed.
      console.error(`conversations UPDATE matched 0 rows for id "${conversation_id}" — check the 'conversations' table's UPDATE RLS policy.`);
    }

    return NextResponse.json(message);
  } catch (error) {
    return dbErrorResponse(error);
  }
}
