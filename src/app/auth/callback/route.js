import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    let data, error;
    try {
      ({ data, error } = await supabase.auth.exchangeCodeForSession(code));
    } catch (err) {
      console.error('exchangeCodeForSession failed:', err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    if (!error && data.user) {
      const user = data.user;
      
      // 1. Generate Username 
      const username = user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 5)}`;

      // 2. Sync Avatar Logic
      const googleUrl = user.user_metadata?.avatar_url;
      let finalAvatarPath = null;

      if (googleUrl) {
        try {
          const imageRes = await fetch(googleUrl);
          if (imageRes.ok) {
            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `${user.id}.png`;

            const { error: storageError } = await supabase.storage
              .from('avatars')
              .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true,
              });

            if (!storageError) {
              finalAvatarPath = fileName;
              console.log("Avatar uploaded successfully.");
            }
          }
        } catch (err) {
          console.error("Avatar sync failed:", err);
        }
      }

      // 3. Update Profile Table (Username AND Avatar)
      // We use an update object that conditionally includes the avatar if successful
      const updateData = { 
        username: username,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name 
      };
      
      if (finalAvatarPath) {
        updateData.avatar_url = finalAvatarPath;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update failed:", updateError);
      } else {
        console.log("Profile (username and avatar) updated successfully.");
      }

      revalidatePath('/', 'layout');
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}