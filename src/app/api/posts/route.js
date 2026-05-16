import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { AllProfanity } from 'allprofanity';
import config from '@/utils/allprofanity/allprofanity.config.json';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// 1. Initialize Vision Client once outside the handlers
const visionClient = new ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

// Define a global character limit constant
const MAX_CHAR_LIMIT = 500; 

// --- GET HANDLER ---
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    const page = parseInt(searchParams.get('page') || '1');
    const categoryId = searchParams.get('categoryId'); 
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
        likes:likes(count), 
        user_has_liked:likes(user_id)
      `)
      .eq('user_has_liked.user_id', userId) 
      .order('posted_at', { ascending: false })
      .range(from, to);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST HANDLER ---
export async function POST(req) {
  try {
    const supabase = await createClient();
    const filter = AllProfanity.fromConfig(config);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const content = formData.get('content') || ''; // Fallback to string if empty
    const categoryId = formData.get('category_id');
    const file = formData.get('image');

    // --- CHARACTER LIMIT VALIDATION ---
    if (!content.trim()) {
      return NextResponse.json({ error: 'Post content cannot be empty.' }, { status: 400 });
    }

    if (content.length > MAX_CHAR_LIMIT) {
      return NextResponse.json({ 
        error: `Post is too long! Please keep it under ${MAX_CHAR_LIMIT} characters (Current: ${content.length}).` 
      }, { status: 400 });
    }

    // Text Profanity Validation
    if (filter.check(content)) {
      return NextResponse.json({ error: 'Inappropriate content detected.' }, { status: 400 });
    }

    let imageUrl = null;

    // Image Validation, Rate Limiting & Upload
    if (file && file.size > 0) {
      const THREE_MINUTES_AGO = new Date(Date.now() - 3 * 60 * 1000).toISOString();

      const { count, error: countError } = await supabase
        .from('image_upload_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', THREE_MINUTES_AGO);

      if (countError) throw countError;

      if (count && count >= 3) {
        return NextResponse.json({ 
          error: 'Slow down! You have attempted too many image uploads. Please wait a few minutes.' 
        }, { status: 429 });
      }

      const { error: logError } = await supabase
        .from('image_upload_logs')
        .insert([{ user_id: user.id }]);
        
      if (logError) throw logError;

      const buffer = Buffer.from(await file.arrayBuffer());

      const [result] = await visionClient.safeSearchDetection(buffer);
      const detections = result.safeSearchAnnotation;
      
      console.log(`[Google Vision Executed] Checking image for user ${user.id}`);
      
      const isUnsafe = 
        detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
        detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' || 
        detections.adult === 'POSSIBLE';

      if (isUnsafe) {
        return NextResponse.json({ error: 'Image violates safety guidelines.' }, { status: 400 });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, buffer, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    // Database Insert for the actual post
    const { data, error: dbError } = await supabase
      .from('posts')
      .insert([{ 
        content, 
        category_id: categoryId, 
        image_url: imageUrl, 
        user_id: user.id 
      }]);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}