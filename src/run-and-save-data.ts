import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runAndProcessData() {
    console.log('🚀 Starting Python script to fetch NFL data...');
    const pythonProcess = spawn(path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'), [path.join(process.cwd(), 'scraper', 'scrape.py')]);

    let rawOutput = '';
    pythonProcess.stdout.on('data', (data) => { rawOutput += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { console.error(`Python Log: ${data}`); });
    
    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            return;
        }
        console.log('✅ Python script finished. Processing and uploading data...');
        
        try {
            // --- NEW LOGIC TO EXTRACT CLEAN JSON ---
            const startMarker = '---JSON_START---';
            const endMarker = '---JSON_END---';

            const startIndex = rawOutput.indexOf(startMarker);
            const endIndex = rawOutput.indexOf(endMarker);

            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Could not find JSON markers in Python script output.');
            }

            const jsonData = rawOutput.substring(startIndex + startMarker.length, endIndex).trim();
            // --- END NEW LOGIC ---

            const allStats: any[] = JSON.parse(jsonData);
            if (!allStats || allStats.length === 0) {
                console.log('No stats returned from Python script. Nothing to upload.');
                return;
            }
            console.log(`Processing ${allStats.length} stat entries...`);

            // The rest of the upload logic is the same...
            const playerUpserts = allStats
                .map(stat => ({ player_id: stat.player_id, full_name: stat.player_display_name, position: stat.position, team: stat.recent_team, sport_id: 1 }))
                .filter((v, i, a) => a.findIndex(t => (t.player_id === v.player_id)) === i && v.player_id);

            const gameStatUpserts = allStats.map(stat => ({
                player_id: stat.player_id,
                season: stat.season,
                week: stat.week,
                game_date: stat.gameday,
                stats: { passing_yards: stat.passing_yards, passing_tds: stat.passing_tds, rushing_yards: stat.rushing_yards, receptions: stat.receptions, receiving_yards: stat.receiving_yards, fantasy_points_ppr: stat.fantasy_points_ppr }
            })).filter(stat => stat.player_id && stat.season && stat.week);
            
            console.log(`Upserting ${playerUpserts.length} unique players and ${gameStatUpserts.length} game stats...`);
            
            const { error: playerError } = await supabase.from('players').upsert(playerUpserts, { onConflict: 'player_id' });
            if (playerError) throw new Error(`Player Upload Error: ${playerError.message}`);
            
            const { error: gameStatError } = await supabase.from('game_stats').upsert(gameStatUpserts, { onConflict: 'player_id, season, week' });
            if (gameStatError) throw new Error(`Game Stat Upload Error: ${gameStatError.message}`);
            
            console.log('🎉 Successfully uploaded all data to Supabase!');

        } catch (e) {
    if (e instanceof Error) {
        console.error('❌ Error processing or uploading data:', e.message);
    } else {
        console.error('❌ An unknown error occurred while processing or uploading data.');
    }
}
    });
}

runAndProcessData();