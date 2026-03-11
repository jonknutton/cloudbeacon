📥 HOW TO DOWNLOAD 2024 GENERAL ELECTION DATA FROM PARLIAMENT
============================================================

ROOT CAUSE OF PREVIOUS ISSUE:
=============================

Your electionresults.csv only contained elections up to 2024 BY-ELECTIONS (Feb-May),
not the July 4, 2024 GENERAL ELECTION.

By-elections are special elections in a single constituency when:
- An MP retires or dies
- A seat becomes vacant unexpectedly

The General Election is the national election where ALL 650 constituencies vote.

Your CSV had these 2024 entries (by-elections):
- Kingswood By-election (Feb 15)
- Wellingborough By-election (Feb 15)  
- Rochdale By-election (Feb 29)
- Blackpool South By-election (May 2)

But it was MISSING:
- July 4, 2024 General Election (ALL 650 constituencies)
  This is what you actually need!

HOW TO GET THE RIGHT FILE:
===========================

METHOD 1: Parliament's Official Data Portal (BEST - OPEN LICENSE)
-----------------------------------------------------------------

1. Go to: https://data.parliament.uk/

2. Look for "Elections" section or search "2024 General Election"

3. Find "Election Results" (should look like):
   "Election Results: 4 July 2024 General Election"

4. Download as CSV format

5. Save the file in your cloudbeacon/ folder

   Suggested name: electionresults_2024.csv
   
   OR just replace: electionresults.csv

KEY: The file should be labeled as July 4, 2024 (or 4/7/2024)
     NOT by-elections

FILE SHOULD CONTAIN:
====================

Approximately 650-670 rows (one per UK constituency)
Plus 1 header row

Columns should include (exact names may vary):
✓ Constituency
✓ Party / Winner (or similar)
✓ Electorate size (number of voters eligible)
✓ Votes cast
✓ Majority (winner's vote margin)
✓ Election date/label (should show July 2024 or 2024-07)

EXAMPLE FIRST FEW ROWS:
=======================

Assuming CSV structure similar to:
uri, constituency, election, electorate, majority, result, votes_cast

"http://...", "Aldershot", "July 2024 General Election", "71234", "4567", "Lab Gain", "42123"
"http://...", "Aldridge-Brownhills", "July 2024 General Election", "62341", "6234", "Con Hold", "38456"
...

METADATA CHECK:
===============

When you open the CSV, verify:

1. File size should be ~100-150 KB (significant data)
   If it's < 10 KB, it's probably just headers or old data

2. Line count: Run in terminal to check:
   
   Windows PowerShell:
   (Get-Content electionresults_2024.csv | Measure-Object -Line).Lines
   
   Or just open in Excel and count rows

3. Look for "2024" or "July" in most election labels
   If you only see 2010, 2015, 2017, 2019, that's the wrong file

ALTERNATIVE SOURCES (if Parliament site changes):
==================================================

- BBC Election Results: https://www.bbc.com/news/election_2024
- Electoral Commission: https://www.electoralcommission.org.uk/
- Wikipedia UK General Election 2024 (has complete results table)

However, PARLIAMENT'S OFFICIAL DATA is best because:
✓ Open license (reusable)
✓ Government official source
✓ Structured data (CSV)
✓ Machine-readable
✓ Updated regularly

ONCE YOU HAVE THE FILE:
=======================

1. Save as: electionresults_2024.csv
   (must be in same folder as governance.html)

2. Go back to IMPORT_2024_ELECTIONS_QUICK_START.md

3. Follow the import steps:
   - Open governance.html
   - Go to console
   - Run: importElectionData2024()

4. Click OK at the confirmation dialog

5. Watch it import all 650 constituencies!

TROUBLESHOOTING DOWNLOAD:
=========================

If Parliament site seems to have changed:
- Try: data.parliament.uk/open/Elections
- Look for CSV/download option
- Check if there's an API endpoint listed
- Otherwise, search "Parliament election data 2024 CSV"

If CSV doesn't work:
- Verify you saved the RIGHT file (not 2019 election!)
- Check filename: must be "electionresults_2024.csv"
- Verify it's in cloudbeacon/ folder
- Open in text editor to check contents (should have 650+ lines)

EXPECTED RESULT:
================

After successful import, governance.html Leaders tab will show:
✓ Parliament Composition with 650 colored circles (real party data)
✓ Actual May 2024 General Election results
✓ Real constituency names and winning parties
✓ No red error messages or sample data fallbacks

Questions? Check IMPORT_2024_ELECTIONS_QUICK_START.md for step-by-step import.
