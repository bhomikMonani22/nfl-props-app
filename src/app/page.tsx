'use client'; 

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Data Structures ---
interface Player {
  player_id: string;
  full_name: string;
}
interface GameStat {
    week: number;
    stats: { passing_yards?: number; };
}
interface PlayerStats {
  full_name: string;
  position: string;
  team: string;
  game_stats: GameStat[];
}
interface Odd {
    home_team: string;
    away_team: string;
    bookmakers: { markets: { key: string; outcomes: { name: string; point?: number; }[]; }[]; }[];
}

// --- Main Dashboard Component ---
export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // States for data and UI
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [odds, setOdds] = useState<Odd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- This is the new authentication logic ---
  useEffect(() => {
    async function getUserAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // If no user, redirect to login page
        return;
      }
      setUser(session.user);

      // Fetch initial data only after confirming user is logged in
      try {
        const [playerRes, oddsRes] = await Promise.all([
          fetch('/api/nfl/players'),
          fetch('/api/nfl/odds')
        ]);
        const playerData = await playerRes.json();
        const oddsData = await oddsRes.json();
        
        setPlayers(playerData);
        setOdds(oddsData);

        if (playerData.length > 0) {
          setSelectedPlayerId(playerData[0].player_id);
        } else {
            setIsLoading(false);
        }
      } catch (e) {
        setError('Failed to load initial data.');
        setIsLoading(false);
      }
    }
    getUserAndData();
  }, [supabase, router]);
  
  // --- This useEffect is still needed to fetch stats when the player selection changes ---
  useEffect(() => {
    if (!selectedPlayerId || !user) return; // Don't fetch if no player is selected or user is not loaded yet
    async function fetchPlayerStats() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/nfl/stats/${selectedPlayerId}`);
        if (!response.ok) throw new Error('Failed to fetch player stats');
        const data = await response.json();
        setPlayerStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlayerStats();
  }, [selectedPlayerId, user]);
  
  // --- New logout function ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- "The Magic": Data Analysis (remains the same) ---
  let hitRateData = null;
  const propLine = 280.5;
  if (playerStats) {
      const totalGames = playerStats.game_stats.length;
      const gamesOver = playerStats.game_stats.filter(g => g.stats.passing_yards && g.stats.passing_yards > propLine).length;
      const gamesUnder = totalGames - gamesOver;
      const hitPercentage = totalGames > 0 ? (gamesOver / totalGames) * 100 : 0;
      hitRateData = { over: gamesOver, under: gamesUnder, percentage: hitPercentage.toFixed(0), pieData: [{ name: 'Over', value: gamesOver }, { name: 'Under', value: gamesUnder }] };
  }
  const chartData = playerStats?.game_stats.filter(game => game.stats?.passing_yards != null).map(game => ({ name: `Wk ${game.week}`, 'Passing Yards': game.stats.passing_yards }));
  const COLORS = ['#ea580c', '#6b7280'];

  // --- UI Rendering ---
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Authenticating...</div>;
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-black text-white">
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">NFL Dashboard</h1>
        <button onClick={handleLogout} className="bg-orange-600 text-white font-bold py-2 px-4 rounded-full hover:bg-orange-500 transition">Log Out</button>
      </div>
      
      {/* The rest of your dashboard UI remains the same */}
      <div className="w-full max-w-md mb-8">
        <label htmlFor="player-select" className="block text-sm font-medium text-gray-400 mb-2">Select Player</label>
        <select id="player-select" value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="w-full bg-gray-900 border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-orange-600" disabled={!players.length}>
          {players.map((player) => (<option key={player.player_id} value={player.player_id}>{player.full_name}</option>))}
        </select>
      </div>
      <div className="w-full max-w-6xl p-4 sm:p-6 bg-gray-950 rounded-2xl border border-gray-800">
        {isLoading && <p className="text-center">Loading stats...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {playerStats && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">{playerStats.full_name}</h2>
              <p className="text-md sm:text-lg text-gray-400 mb-6">{playerStats.position} - {playerStats.team}</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-black p-4 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-semibold mb-4 text-orange-500 text-center">Passing Yards Trend (2024 Season)</h3>
                      <div style={{ width: '100%', height: 300 }}><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="name" stroke="#9ca3af" /><YAxis stroke="#9ca3af" /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} /><Legend /><Line type="monotone" dataKey="Passing Yards" stroke="#ea580c" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-gray-800 flex flex-col justify-center items-center">
                      <h3 className="text-lg font-semibold text-orange-500 text-center">Hit Rate vs. Line ({propLine})</h3>
                      {hitRateData && (<><div style={{ width: '100%', height: 180 }}><ResponsiveContainer><PieChart><Pie data={hitRateData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">{hitRateData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} /></PieChart></ResponsiveContainer></div><p className="text-4xl font-bold mt-4">{hitRateData.percentage}%</p><p className="text-gray-400">Over in {hitRateData.over} of {hitRateData.over + hitRateData.under} games</p></>)}
                  </div>
              </div>
            </div>
        )}
      </div>
    </main>
  );
}