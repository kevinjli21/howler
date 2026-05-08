import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) { 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      username, 
      full_name, 
      avatar_url, 
      bio, 
      campus_id,
      campus (campus_id, name)
    `)
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

const { username, bio, campus_id } = await request.json();

const { data, error } = await supabase
.from('profiles')
.update({ 
    username, 
    bio, 
    campus_id 
})
.eq('id', user.id)
.select(`*, campus(name)`) 
.single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}