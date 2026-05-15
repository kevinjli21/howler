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

// --- GET HANDLER ---
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
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
        likes(count)
      `)
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
    const content = formData.get('content');
    const categoryId = formData.get('category_id');
    const file = formData.get('image');

    // Text Validation
    if (filter.check(content)) {
      return NextResponse.json({ error: 'Inappropriate content detected.' }, { status: 400 });
    }

    let imageUrl = null;

    // Image Validation & Upload
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // SafeSearch Scan
      const [result] = await visionClient.safeSearchDetection(buffer);
      const detections = result.safeSearchAnnotation;
      console.log(`Adult: ${detections.adult}`);
      console.log(`Spoof: ${detections.spoof}`);
      console.log(`Medical: ${detections.medical}`);
      console.log(`Violence: ${detections.violence}`);
      const isUnsafe = 
        detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
        detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' || detections.adult === 'POSSIBLE';

      if (isUnsafe) {
        return NextResponse.json({ error: 'Image violates safety guidelines.' }, { status: 400 });
      }

      // Storage Upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, buffer, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    // Database Insert
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