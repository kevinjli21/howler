import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { AllProfanity } from 'allprofanity';
import config from '@/utils/allprofanity/allprofanity.config.json';

const MAX_BIO_LIMIT = 160;

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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) { 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bio, campus_id } = await request.json();
  const safeBio = bio || ''; // Fallback to safe string check if bio is null/undefined

  // --- BIO CHARACTER LIMIT VALIDATION ---
  if (safeBio.length > MAX_BIO_LIMIT) {
    return NextResponse.json({ 
      error: `Bio is too long! Please keep it under ${MAX_BIO_LIMIT} characters (Current: ${safeBio.length}).` 
    }, { status: 400 });
  }

  // Text Profanity Filter Check
  const filter = AllProfanity.fromConfig(config);
  if (filter.check(safeBio)) {
    return NextResponse.json({ error: 'Inappropriate content detected in bio.' }, { status: 400 });
  }

  // Update Database Execution
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
        bio: safeBio,
        campus_id 
    })
    .eq('id', user.id)
    .select(`*, campus(name)`) 
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}