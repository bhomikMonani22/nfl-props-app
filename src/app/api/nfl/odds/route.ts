import axios from 'axios';
import { NextResponse } from 'next/server';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const REGIONS = 'us'; // us, uk, eu, au
const MARKETS = 'h2h,spreads'; // h2h (moneyline), spreads, totals
const SPORT = 'americanfootball_nfl';

export async function GET() {
  if (!ODDS_API_KEY) {
    return NextResponse.json({ error: 'Odds API key is not configured' }, { status: 500 });
  }

  const url = `https://api.the-odds-api.com/v4/sports/${SPORT}/odds/?regions=${REGIONS}&markets=${MARKETS}&apiKey=${ODDS_API_KEY}`;

  try {
    console.log('Fetching data from The Odds API...');
    const response = await axios.get(url);

    if (response.data.length === 0) {
        return NextResponse.json({ message: 'No upcoming games with odds found.' }, { status: 200 });
    }

    // Return the data from the API
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Error fetching odds:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch odds data.' }, { status: 500 });
  }
}