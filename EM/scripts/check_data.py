#!/usr/bin/env python3
import json
from pathlib import Path

data_dir = Path('../data/earthquakes')
files = sorted(data_dir.glob('*.json'))
print(f'Downloaded files: {len(files)}')
for f in files:
    print(f'  {f.name}')
    # Check file size
    size_mb = f.stat().st_size / (1024 * 1024)
    print(f'    Size: {size_mb:.2f} MB')
    try:
        with open(f) as file:
            data = json.load(file)
            if data and len(data) > 0 and 'features' in data:
                features = data.get('features', [])
                print(f'    -> {len(features)} events')
                if features:
                    latest_time = features[-1].get('properties', {}).get('time', '?')
                    print(f'    -> Latest: {latest_time}')
    except Exception as e:
        print(f'    Error reading: {e}')
