import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;  // note: await here, because params is a Promise

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('full_name, position, team')
      .eq('player_id', playerId)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const { data: gameStats, error: gameStatsError } = await supabase
      .from('game_stats')
      .select('season, week, game_date, stats')
      .eq('player_id', playerId);

    if (gameStatsError) {
      return NextResponse.json(
        { error: `Error fetching game stats: ${gameStatsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      full_name: player.full_name,
      position: player.position,
      team: player.team,
      game_stats: gameStats ?? [],
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
