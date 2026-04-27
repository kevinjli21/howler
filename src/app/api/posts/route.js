import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse FormData
  const formData = await req.formData();
  const content = formData.get('content');
  const categoryId = formData.get('category_id');
  const file = formData.get('image');

  let imageUrl = null;

  // 3. Handle File Upload (if exists)
  if (file && file.size > 0) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

  // 4. Insert into Database
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