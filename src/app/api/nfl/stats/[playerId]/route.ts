import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Note: In Next.js API routes, process.env automatically reads from your .env.local file.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function GET(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = params.playerId;

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    console.log(`Fetching data for player: ${playerId}`);

    // Fetch the player's general info and their game stats in one query
    const { data, error } = await supabase
      .from('players')
      .select(`
        full_name,
        position,
        team,
        game_stats (
          season,
          week,
          game_date,
          stats
        )
      `)
      .eq('player_id', playerId)
      .single(); // .single() returns one object instead of an array

    if (error) {
      console.error('Supabase error:', error.message);
      return NextResponse.json({ error: `Player not found or database error: ${error.message}` }, { status: 404 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}