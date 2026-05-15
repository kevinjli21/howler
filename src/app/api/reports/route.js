import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, reason } = await req.json();

  const { error } = await supabase
    .from('reports')
    .insert([{ 
      post_id, 
      report_creator_id: user.id, 
      report_reason: reason
    }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}