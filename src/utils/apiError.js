import { NextResponse } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Maps a Supabase/Postgres error to a clean client-facing response and logs
// the full error server-side, so internal schema/constraint details never
// reach the client.
export function dbErrorResponse(error) {
  console.error(error);

  if (error?.code === '22P02') {
    // invalid_text_representation, e.g. a malformed UUID
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (error?.code === '23503') {
    // foreign_key_violation, e.g. a post_id/conversation_id that doesn't exist
    return NextResponse.json({ error: 'The item you referenced no longer exists.' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
