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

    return NextResponse.json(message);
  } catch (error) {
    return dbErrorResponse(error);
  }
}
