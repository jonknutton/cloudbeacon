#!/usr/bin/env python3
"""
Bulk earthquake data fetcher from USGS ComCat API
Downloads entire historical record in manageable chunks
"""

import requests
import json
from datetime import datetime, timedelta
from pathlib import Path
import time

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data" / "earthquakes"
DATA_DIR.mkdir(parents=True, exist_ok=True)

USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query"
MIN_MAGNITUDE = 0  # Get all magnitudes
CHUNK_DAYS = 180  # 6 months at a time (avoids 20k limit)
START_DATE = datetime(1900, 1, 1)
END_DATE = datetime.now()

def fetch_earthquakes(start_date, end_date):
    """Fetch earthquakes for a given date range from USGS API"""
    
    params = {
        "format": "geojson",
        "starttime": start_date.isoformat(),
        "endtime": end_date.isoformat(),
        "minmagnitude": MIN_MAGNITUDE,
        "orderby": "time",
        "limit": 20000,  # Max per request
    }
    
    print(f"Fetching: {start_date.date()} to {end_date.date()}...", end=" ")
    
    try:
        response = requests.get(USGS_API, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        count = len(data.get("features", []))
        print(f" {count} events")
        return data.get("features", [])
    except requests.exceptions.RequestException as e:
        print(f" Error: {e}")
        return []

def chunk_date_range(start_date, end_date, chunk_days):
    """Generator to yield date chunks"""
    current = start_date
    while current < end_date:
        chunk_end = min(current + timedelta(days=chunk_days), end_date)
        yield current, chunk_end
        current = chunk_end

def save_data(features, filename):
    """Save earthquake features to JSON file"""
    output_file = DATA_DIR / filename
    with open(output_file, "w") as f:
        json.dump(features, f, indent=2)
    print(f"  -> Saved to {output_file.name} ({len(features)} events)")

def main():
    """Main fetch routine"""
    
    print(f"\n[EARTH] USGS Earthquake Historical Data Fetcher")
    print(f"{'='*60}")
    print(f"Output: {DATA_DIR}")
    print(f"Date range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"Magnitude: >= {MIN_MAGNITUDE}")
    print(f"Chunk size: {CHUNK_DAYS} days")
    print(f"{'='*60}\n")
    
    all_events = []
    chunk_count = 0
    
    # Fetch data in chunks
    for start, end in chunk_date_range(START_DATE, END_DATE, CHUNK_DAYS):
        events = fetch_earthquakes(start, end)
        all_events.extend(events)
        chunk_count += 1
        
        # Save intermediate chunk every 20 chunks (about 10 years)
        if chunk_count % 20 == 0:
            period = f"{start.year}-{end.year}"
            save_data(all_events, f"usgs_earthquakes_{period}.json")
            all_events = []  # Reset for next batch
        
        # Be nice to the API
        time.sleep(0.5)
    
    # Save final chunk
    if all_events:
        period = f"{START_DATE.year}-{END_DATE.year}"
        save_data(all_events, f"usgs_earthquakes_{period}.json")
    
    print(f"\n Fetch complete!")
    print(f"  Total chunks processed: {chunk_count}")
    print(f"  Files saved to: {DATA_DIR}")

if __name__ == "__main__":
    main()
