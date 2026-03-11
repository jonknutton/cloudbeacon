#!/usr/bin/env python3
"""
Solar activity data fetcher from multiple sources
Downloads historical solar indices (sunspots, Kp, Dst, flares, etc.)
"""

import requests
import json
from datetime import datetime
from pathlib import Path
from io import StringIO
import urllib.request

DATA_DIR = Path(__file__).parent.parent / "data" / "solar"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def fetch_silso_sunspots():
    """
    Download SILSO sunspot data (1610-present)
    Source: Sunspot Index and Long-term Solar Observations
    """
    print("Fetching SILSO sunspot data (1610-present)...", end=" ")
    
    url = "https://www.sidc.be/SILSO/DATA/SN_m_tot_V2.0.txt"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Parse space-separated values
        events = []
        for line in response.text.strip().split('\n'):
            parts = line.split()
            if len(parts) >= 4:
                try:
                    year, month, decimal_year, sunspot_number, uncertainty = map(float, parts[:5])
                    events.append({
                        "date": f"{int(year)}-{int(month):02d}-01",
                        "timestamp": datetime(int(year), max(1, int(month)), 1).isoformat(),
                        "sunspot_number": sunspot_number,
                        "uncertainty": uncertainty,
                        "metric": "sunspot_count"
                    })
                except ValueError:
                    continue
        
        output_file = DATA_DIR / "silso_sunspots.json"
        with open(output_file, "w") as f:
            json.dump(events, f, indent=2)
        
        print(f" {len(events)} records")
        return events
        
    except Exception as e:
        print(f" Error: {e}")
        return []

def fetch_noaa_kp_index():
    """
    Download NOAA Kp (planetary K-index) data (1932-present)
    Source: NOAA Space Weather Prediction Center
    """
    print("Fetching NOAA Kp index (1932-present)...", end=" ")
    
    url = "https://www.swpc.noaa.gov/ftpdir/indices/old_indices/kp1932-now.txt"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        events = []
        for line in response.text.strip().split('\n'):
            line = line.strip()
            if not line or line.startswith(':'):
                continue
            
            try:
                # Format: YYYY MM DD HH ... Kp values
                parts = line.split()
                if len(parts) < 3:
                    continue
                
                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                
                # 8 Kp values per day (3-hourly)
                if len(parts) >= 11:
                    kp_values = parts[3:11]
                    avg_kp = sum(float(k) for k in kp_values) / len(kp_values)
                    
                    events.append({
                        "date": f"{year}-{month:02d}-{day:02d}",
                        "timestamp": datetime(year, month, day).isoformat(),
                        "kp_index": avg_kp,
                        "kp_daily_values": [float(k) for k in kp_values],
                        "metric": "kp_index"
                    })
            except (ValueError, IndexError):
                continue
        
        output_file = DATA_DIR / "noaa_kp_index.json"
        with open(output_file, "w") as f:
            json.dump(events, f, indent=2)
        
        print(f" {len(events)} records")
        return events
        
    except Exception as e:
        print(f" Error: {e}")
        return []

def fetch_noaa_dst_index():
    """
    Download NOAA Dst (disturbance storm time) index (1957-present)
    Source: Kyoto University / NOAA
    """
    print("Fetching NOAA Dst index (1957-present)...", end=" ")
    
    url = "https://www.swpc.noaa.gov/ftpdir/indices/old_indices/dst1957-now.txt"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        events = []
        for line in response.text.strip().split('\n'):
            line = line.strip()
            if not line or line.startswith(':'):
                continue
            
            try:
                parts = line.split()
                if len(parts) < 3:
                    continue
                
                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                
                # Dst values for the day
                if len(parts) >= 11:
                    dst_values = [int(d) for d in parts[3:11] if d != '9999']
                    if dst_values:
                        avg_dst = sum(dst_values) / len(dst_values)
                        
                        events.append({
                            "date": f"{year}-{month:02d}-{day:02d}",
                            "timestamp": datetime(year, month, day).isoformat(),
                            "dst_index": avg_dst,
                            "dst_daily_values": dst_values,
                            "metric": "dst_index"
                        })
            except (ValueError, IndexError):
                continue
        
        output_file = DATA_DIR / "noaa_dst_index.json"
        with open(output_file, "w") as f:
            json.dump(events, f, indent=2)
        
        print(f" {len(events)} records")
        return events
        
    except Exception as e:
        print(f" Error: {e}")
        return []

def fetch_f107_index():
    """
    Download F10.7 (solar radio flux) index (1947-present)
    Source: NOAA
    """
    print("Fetching F10.7 solar radio flux (1947-present)...", end=" ")
    
    url = "https://www.swpc.noaa.gov/ftpdir/indices/old_indices/f107.txt"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        events = []
        for line in response.text.strip().split('\n'):
            line = line.strip()
            if not line or not line[0].isdigit():
                continue
            
            try:
                # Parse F107 format
                year = int(line[0:4])
                month = int(line[4:6])
                day = int(line[6:8])
                f107 = float(line[10:16].strip())
                f107_adj = float(line[30:36].strip()) if len(line) > 36 else f107
                
                events.append({
                    "date": f"{year}-{month:02d}-{day:02d}",
                    "timestamp": datetime(year, month, day).isoformat(),
                    "f107_raw": f107,
                    "f107_adjusted": f107_adj,
                    "metric": "f107_index"
                })
            except (ValueError, IndexError):
                continue
        
        output_file = DATA_DIR / "f107_index.json"
        with open(output_file, "w") as f:
            json.dump(events, f, indent=2)
        
        print(f" {len(events)} records")
        return events
        
    except Exception as e:
        print(f" Error: {e}")
        return []

def create_metadata():
    """Create metadata file with data source info"""
    metadata = {
        "last_updated": datetime.now().isoformat(),
        "sources": {
            "sunspots": {
                "name": "SILSO (Sunspot Index and Long-term Solar Observations)",
                "url": "https://www.sidc.be/SILSO/",
                "coverage": "1610-present",
                "metric": "sunspot_number"
            },
            "kp_index": {
                "name": "NOAA Space Weather Prediction Center",
                "url": "https://www.swpc.noaa.gov/",
                "coverage": "1932-present",
                "metric": "kp_index (planetary K-index, 0-9 scale)"
            },
            "dst_index": {
                "name": "NOAA / Kyoto University",
                "url": "https://www.swpc.noaa.gov/",
                "coverage": "1957-present",
                "metric": "dst_index (disturbance storm time, nT)"
            },
            "f107_index": {
                "name": "NOAA",
                "url": "https://www.swpc.noaa.gov/",
                "coverage": "1947-present",
                "metric": "f107_index (solar radio flux, 10^-22 W/m^2/Hz)"
            }
        },
        "note": "All timestamps are ISO 8601 format. Use 'metric' field to filter data types."
    }
    
    output_file = DATA_DIR / "metadata.json"
    with open(output_file, "w") as f:
        json.dump(metadata, f, indent=2)

def main():
    """Main fetch routine"""
    
    print(f"\n[SUN] NOAA/SILSO Solar Activity Data Fetcher")
    print(f"{'='*60}")
    print(f"Output: {DATA_DIR}")
    print(f"{'='*60}\n")
    
    # Fetch all data sources
    fetch_silso_sunspots()
    fetch_noaa_kp_index()
    fetch_noaa_dst_index()
    fetch_f107_index()
    
    # Create metadata
    create_metadata()
    
    print(f"\n[OK] Fetch complete!")
    print(f"  Files saved to: {DATA_DIR}")
    print(f"  Metadata: {DATA_DIR / 'metadata.json'}")

if __name__ == "__main__":
    main()
