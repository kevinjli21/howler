import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user;
      const googleUrl = user.user_metadata?.avatar_url;

      if (googleUrl) {
        try {
          // 1. Fetch the image from Google
          const imageRes = await fetch(googleUrl);
          if (imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. Upload to your 'avatar' bucket
            // Path: public/avatar/user_id.png
            const fileName = `${user.id}.png`;
            const { error: storageError } = await supabase.storage
              .from('avatar')
              .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true 
              });

            if (!storageError) {
              await supabase
                .from('profiles')
                .update({ avatar_url: fileName })
                .eq('id', user.id);
            }
          }
        } catch (err) {
          console.error("Avatar sync failed:", err);
        }
      }
      // --- END AVATAR LOGIC ---

      revalidatePath('/', 'layout');
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}