#!/usr/bin/env python3
"""
Master data pipeline orchestrator
Runs all data fetching and consolidation steps
"""

import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SCRIPTS = [
    ("fetch_earthquake_data.py", "Fetching historical earthquake data (1900-present)..."),
    ("fetch_solar_data.py", "Fetching historical solar activity data..."),
    ("consolidate_data.py", "Consolidating and indexing all data..."),
]

def run_script(script_name: str, description: str) -> bool:
    """Run a Python script"""
    print(f"\n{'='*70}")
    print(f"📦 {description}")
    print(f"{'='*70}")
    
    script_path = SCRIPT_DIR / script_name
    
    if not script_path.exists():
        print(f"❌ Error: {script_name} not found at {script_path}")
        return False
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=SCRIPT_DIR,
            capture_output=False
        )
        
        if result.returncode == 0:
            print(f"[OK] {script_name} completed successfully")
            return True
        else:
            print(f"[ERROR] {script_name} failed with exit code {result.returncode}")
            return False
    
    except Exception as e:
        print(f"[ERROR] Error running {script_name}: {e}")
        return False

def main():
    print(f"\n[START] EM Data Pipeline Orchestrator")
    print(f"{'='*70}")
    print(f"This will fetch all historical earthquake and solar data")
    print(f"and prepare it for visualization integration.")
    print(f"{'='*70}")
    print(f"\n[WAIT] Starting data pipeline...\n")
    
    results = []
    for script, description in SCRIPTS:
        success = run_script(script, description)
        results.append((script, success))
        
        if not success:
            print(f"\n⚠️  Pipeline halted at {script}")
            print(f"Earlier operations may have completed successfully.")
            break
    
    # Summary
    print(f"\n{'='*70}")
    print(f"[SUMMARY] Pipeline Summary")
    print(f"{'='*70}")
    
    for script, success in results:
        status = "[OK]" if success else "[FAIL]"
        print(f"{status} {script}")
    
    all_success = all(success for _, success in results)
    
    if all_success:
        print(f"\n[OK] All data successfully fetched and consolidated!")
        print(f"   Historical data is ready for visualization.")
        print(f"   Next: Integrate data loader into frontend views.")
    else:
        print(f"\n[WARNING] Some steps failed. Check output above for details.")
    
    print(f"\n{'='*70}\n")

if __name__ == "__main__":
    main()
