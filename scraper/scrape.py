import sys
import json
import nfl_data_py as nfl

def get_player_weekly_stats():
    try:
        df = nfl.import_weekly_data([2024])
        stats_json = df.to_json(orient='records')
        
        # Print markers around the JSON output
        print("---JSON_START---")
        print(stats_json)
        print("---JSON_END---")

    except Exception as e:
        print(f"An error occurred in the Python script: {e}", file=sys.stderr)

if __name__ == "__main__":
    get_player_weekly_stats()