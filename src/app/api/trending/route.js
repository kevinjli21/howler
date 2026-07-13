import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select(`
      category_id,
      categories (category_name, color),
      likes:likes(count),
      comments(count)
    `)
    .gte('posted_at', since)
    .not('category_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categoryMap = {};
  for (const post of data) {
    if (!post.category_id || !post.categories) continue;
    const id = post.category_id;
    if (!categoryMap[id]) {
      categoryMap[id] = {
        id,
        category_name: post.categories.category_name,
        color: post.categories.color,
        post_count: 0,
        score: 0,
      };
    }
    const likes = post.likes?.[0]?.count || 0;
    const comments = post.comments?.[0]?.count || 0;
    categoryMap[id].post_count += 1;
    categoryMap[id].score += likes + (comments * 2);
  }

  const trending = Object.values(categoryMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json(trending);
}
