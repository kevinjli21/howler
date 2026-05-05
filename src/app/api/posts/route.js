import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('categoryId'); // New: get category filter
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('posts')
    .select(`
      *, 
      profiles (full_name, avatar_url, username),
      categories (category_name, color),
      comments(count),
      likes(count)
    `)
    .order('posted_at', { ascending: false })
    .range(from, to);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const content = formData.get('content');
  const categoryId = formData.get('category_id');
  const file = formData.get('image');

  let imageUrl = null;

  if (file && file.size > 0) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 413 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, file);

    if (uploadError) {
        console.log('Upload error:', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });        
    }

    const { data: publicUrlData } = supabase.storage.from('posts').getPublicUrl(fileName);
    imageUrl = publicUrlData.publicUrl;
  }

  const { data, error: dbError } = await supabase
    .from('posts')
    .insert([
      { 
        content, 
        category_id: categoryId,
        image_url: imageUrl, 
        user_id: user.id,
        posted_at: new Date().toISOString() 
      }
    ]);

  if (dbError) {
    console.log('Database error:', dbError);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}