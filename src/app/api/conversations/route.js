import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (partError) return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  if (!participations?.length) return NextResponse.json([]);

  const convoIds = participations.map(p => p.conversation_id);

  const [othersRes, convosRes, lastMsgsRes] = await Promise.all([
    supabase
      .from('conversation_participants')
      .select('conversation_id, profiles(id, full_name, username, avatar_url)')
      .in('conversation_id', convoIds)
      .neq('user_id', user.id),
    supabase
      .from('conversations')
      .select('id, last_message_at')
      .in('id', convoIds)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('direct_messages')
      .select('conversation_id, content, sender_id')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })
      .limit(Math.max(convoIds.length * 3, 30)),
  ]);

  if (othersRes.error || convosRes.error) {
    return NextResponse.json({ error: 'Failed to load conversation data' }, { status: 500 });
  }

  const lastMsgMap = {};
  (lastMsgsRes.data || []).forEach(msg => {
    if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = msg;
  });

  const result = (convosRes.data || []).map(convo => {
    const other = othersRes.data?.find(o => o.conversation_id === convo.id);
    return {
      id: convo.id,
      last_message_at: convo.last_message_at,
      other_user: other?.profiles || null,
      last_message: lastMsgMap[convo.id] || null,
    };
  }).filter(c => c.other_user !== null);

  return NextResponse.json(result);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { other_user_id } = await request.json();
  if (!other_user_id) return NextResponse.json({ error: 'other_user_id is required' }, { status: 400 });
  if (other_user_id === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

  const { data, error } = await supabase.rpc('get_or_create_dm', { other_user_id });
  if (error) {
    console.error('get_or_create_dm error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }

  return NextResponse.json({ conversation_id: data });
}
