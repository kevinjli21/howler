import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // Select 'id' and 'category_name' specifically
  const { data, error } = await supabase
    .from('categories')
    .select('id, category_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}