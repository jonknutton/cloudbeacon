#!/usr/bin/env python3
"""
Data consolidation and indexing
Merges earthquake and solar data, creates indexed lookup for fast queries
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any

DATA_DIR = Path(__file__).parent.parent / "data"
QUAKE_DIR = DATA_DIR / "earthquakes"
SOLAR_DIR = DATA_DIR / "solar"

def load_json_files(directory: Path) -> List[Dict[str, Any]]:
    """Load all JSON files from a directory and merge"""
    all_data = []
    json_files = sorted(directory.glob("*.json"))
    
    for json_file in json_files:
        if json_file.name == "metadata.json":
            continue
        
        print(f"  Loading {json_file.name}...", end=" ")
        try:
            with open(json_file) as f:
                data = json.load(f)
                if isinstance(data, list):
                    all_data.extend(data)
                    print(f" {len(data)} records")
                else:
                    print(" Invalid format")
        except Exception as e:
            print(f" Error: {e}")
    
    return all_data

def consolidate_earthquakes() -> Dict[str, Any]:
    """Consolidate earthquake data"""
    print("\n[DATA] Consolidating earthquake data...")
    
    quake_dir = QUAKE_DIR
    
    # If user manually downloaded CSVs, convert them
    csv_files = list(quake_dir.glob("*.csv"))
    if csv_files:
        print(f"  Found {len(csv_files)} CSV file(s), converting...")
        import csv
        
        all_features = []
        for csv_file in csv_files:
            with open(csv_file) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        feature = {
                            "type": "Feature",
                            "properties": {
                                "mag": float(row.get("magnitude", 0)),
                                "place": row.get("place", ""),
                                "time": row.get("time", ""),
                                "tsunami": row.get("tsunami", 0),
                                "felt": row.get("felt"),
                            },
                            "geometry": {
                                "type": "Point",
                                "coordinates": [
                                    float(row.get("longitude", 0)),
                                    float(row.get("latitude", 0)),
                                    float(row.get("depth", 0))
                                ]
                            }
                        }
                        all_features.append(feature)
                    except (ValueError, KeyError):
                        continue
        
        # Save as JSON
        output_file = quake_dir / "earthquakes_consolidated.json"
        with open(output_file, "w") as f:
            json.dump(all_features, f, indent=2)
        print(f"   Converted {len(all_features)} events to {output_file.name}")
    
    # Load existing JSON files
    features = load_json_files(quake_dir)
    
    # Sort by timestamp
    features.sort(key=lambda x: x.get("properties", {}).get("time", ""))
    
    # Generate stats
    if features:
        times = [f.get("properties", {}).get("time", "") for f in features if f.get("properties", {}).get("time")]
        mags = [f.get("properties", {}).get("mag", 0) for f in features if f.get("properties", {}).get("mag")]
        
        stats = {
            "total_events": len(features),
            "date_range": {
                "start": times[0] if times else None,
                "end": times[-1] if times else None
            },
            "magnitude_range": {
                "min": min(mags) if mags else 0,
                "max": max(mags) if mags else 0,
                "median": sorted(mags)[len(mags)//2] if mags else 0
            }
        }
    else:
        stats = {"total_events": 0}
    
    return {
        "data": features,
        "stats": stats
    }

def consolidate_solar() -> Dict[str, Any]:
    """Consolidate solar data"""
    print("\n[DATA] Consolidating solar activity data...")
    
    all_data = {}
    
    # Load each solar metric separately
    for metric_file in SOLAR_DIR.glob("*.json"):
        if metric_file.name == "metadata.json":
            continue
        
        metric_name = metric_file.stem.replace("noaa_", "").replace("silso_", "")
        print(f"  Loading {metric_name}...", end=" ")
        
        try:
            with open(metric_file) as f:
                data = json.load(f)
                all_data[metric_name] = data
                print(f" {len(data)} records")
        except Exception as e:
            print(f" Error: {e}")
    
    return {
        "data": all_data,
        "stats": {
            "metrics": list(all_data.keys()),
            "total_records": sum(len(v) for v in all_data.values())
        }
    }

def create_index():
    """Create searchable indices"""
    print("\n[SEARCH] Creating search indices...")
    
    # Earthquake time index
    quake_data = consolidate_earthquakes()
    quake_features = quake_data["data"]
    
    quake_index = {}
    for i, feature in enumerate(quake_features):
        time_str = feature.get("properties", {}).get("time", "")
        if time_str:
            try:
                date_key = time_str[:10]  # YYYY-MM-DD
                if date_key not in quake_index:
                    quake_index[date_key] = []
                quake_index[date_key].append(i)
            except:
                pass
    
    # Save earthquake consolidated data
    output_file = QUAKE_DIR / "earthquakes_consolidated.json"
    with open(output_file, "w") as f:
        json.dump(quake_features, f, indent=2)
    print(f"   Earthquakes: {output_file.name}")
    
    # Save earthquake index
    index_file = QUAKE_DIR / "earthquakes_index.json"
    with open(index_file, "w") as f:
        json.dump(quake_index, f)
    print(f"   Earthquake index: {len(quake_index)} unique dates")
    
    # Solar data consolidation
    solar_data = consolidate_solar()
    
    output_file = SOLAR_DIR / "solar_consolidated.json"
    with open(output_file, "w") as f:
        json.dump(solar_data["data"], f, indent=2)
    print(f"   Solar data: {output_file.name}")
    
    # Master metadata
    metadata = {
        "created": datetime.now().isoformat(),
        "earthquakes": {
            "file": "earthquakes_consolidated.json",
            "index_file": "earthquakes_index.json",
            **quake_data["stats"]
        },
        "solar": {
            "file": "solar_consolidated.json",
            **solar_data["stats"]
        }
    }
    
    metadata_file = DATA_DIR / "index_metadata.json"
    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"   Master index: {metadata_file.name}")

def main():
    print(f"\n[SYNC] Data Consolidation & Indexing")
    print(f"{'='*60}")
    print(f"Data directory: {DATA_DIR}")
    print(f"{'='*60}")
    
    create_index()
    
    print(f"\n[OK] Consolidation complete!")
    print(f"  Ready for visualization integration")

if __name__ == "__main__":
    main()
