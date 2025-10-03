// src/app/api/nfl/players/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, full_name')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}