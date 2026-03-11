/**
 * Simple MP Data Loader - Load directly from CSV file
 * No Firestore, no scraping, no Cloud Functions
 * Just parse the CSV and display the data
 */

async function loadMPsFromCSV() {
  console.log("📂 Loading MPs from CSV...");
  
  try {
    // Fetch the CSV file from the same folder
    const response = await fetch('/electionresults.csv');
    if (!response.ok) throw new Error(`Failed to load CSV: ${response.status}`);
    
    const csv = await response.text();
    console.log("✓ CSV loaded");
    
    // Parse into records
    const members = parseElectionCSV(csv);
    
    if (members.length === 0) {
      console.error("❌ No MP records found in CSV");
      return [];
    }
    
    console.log(`✅ Loaded ${members.length} MPs from CSV`);
    
    // Preview
    console.log("📊 First 5 MPs:");
    members.slice(0, 5).forEach(m => {
      console.log(`  • ${m.name} (${m.party})`);
    });
    
    return members;
    
  } catch (error) {
    console.error("❌ Error loading CSV:", error.message);
    return [];
  }
}

/**
 * Parse election results CSV and extract 2024 General Election MPs
 */
function parseElectionCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];
  
  const members = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 6) continue;
    
    // CSV format: uri, constituency, election, electorate, majority, result, votes
    const election = cells[2]?.toLowerCase() || "";
    const constituency = cells[1];
    const resultLabel = cells[5];
    
    // Only include 2024 General Election (not by-elections)
    if (!election.includes("by-election") && (election.includes("2024") || election.includes("july"))) {
      const party = parsePartyFromResult(resultLabel);
      
      if (party && constituency) {
        members.push({
          name: constituency,
          constituency: constituency,
          party: party,
          elected: "4 Jul 2024"
        });
      }
    }
  }
  
  return members;
}

/**
 * Parse party from result label like "Lab Gain", "Con Hold", etc.
 */
function parsePartyFromResult(result) {
  if (!result) return null;
  
  const lower = result.toLowerCase();
  
  const partyMap = {
    "lab": "Labour",
    "con": "Conservative",
    "ld": "Liberal Democrat",
    "snp": "SNP",
    "plc": "Plaid Cymru",
    "pc": "Plaid Cymru",
    "grn": "Green",
    "ind": "Independent",
    "dup": "DUP",
    "sf": "Sinn Féin",
    "sdlp": "SDLP",
    "wpb": "Independent"
  };
  
  for (const [abbr, party] of Object.entries(partyMap)) {
    if (lower.includes(abbr)) return party;
  }
  
  return null;
}

/**
 * Parse CSV line with quote handling
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, ""));
}

/**
 * Display MPs in a table
 */
async function displayMPs() {
  console.log("🚀 Loading MPs...");
  
  const members = await loadMPsFromCSV();
  
  if (members.length === 0) {
    console.log("❌ Could not load MPs");
    return;
  }
  
  // Store in window for governance.js to access
  window.csvMPs = members;
  
  console.log(`✅ Ready! ${members.length} MPs loaded and accessible via window.csvMPs`);
  console.log("   governance.js will use this data automatically when displaying Leaders tab");
}

// =====================================================
// Usage:
// =====================================================
// 1. Open console
// 2. Run: displayMPs()
// 3. Check window.csvMPs for the data
// 4. governance.js will automatically use it
