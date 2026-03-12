/**
 * IMPROVED Election Data Importer for 2024 General Election
 * Works with Parliament CSV data for July 4, 2024 General Election
 */

async function importElectionData2024() {
  console.log("🚀 Starting 2024 General Election Data Import");
  
  // Step 1: Verify Firestore is accessible
  if (!window.db) {
    console.error("❌ Firestore not initialized!");
    console.log("⚠️ Make sure you're running this in governance.html context");
    console.log("⚠️ Firebase must be imported and db must be available globally");
    return;
  }
  
  console.log("✅ Firestore connected");
  
  // Step 2: Load CSV from file
  try {
    const response = await fetch('/electionresults_2024.csv');
    if (!response.ok) throw new Error("CSV file not found: electionresults_2024.csv");
    const csvText = await response.text();
    console.log("✓ CSV loaded successfully");
    
    const records = parseCSVFor2024Election(csvText);
    console.log(`✓ Parsed ${records.length} records`);
    
    if (records.length === 0) {
      console.error("❌ No 2024 General Election records found in CSV!");
      console.log("⚠️ Make sure CSV contains July 2024 General Election entries");
      return;
    }
    
    // Step 3: Preview and confirm
    console.log("\n📊 Preview of records to import:");
    records.slice(0, 5).forEach(r => {
      console.log(`  • ${r.constituency} (${r.party}) - Majority: ${r.majority}`);
    });
    console.log(`  ... and ${records.length - 5} more\n`);
    
    const proceed = confirm(`Ready to import ${records.length} 2024 election records to Firestore. Continue?`);
    if (!proceed) {
      console.log("❌ Import cancelled by user");
      return;
    }
    
    // Step 4: Import to Firestore in batches
    await importRecordsToFirestore(records);
    console.log("✅ Import complete!");
    
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

/**
 * Parse CSV specifically looking for July 2024 General Election data
 * Handles multiple column layouts
 */
function parseCSVFor2024Election(csvText) {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 2) return [];
  
  const header = parseCSVLine(lines[0]);
  const columnMap = identifyColumns(header);
  
  if (!columnMap.constituency || !columnMap.party) {
    console.warn("⚠️ Could not identify constituency or party columns");
    console.log("Headers found:", header);
    return [];
  }
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    
    // Check if this is a 2024 General Election record
    const electionLabel = values[columnMap.election]?.toLowerCase() || "";
    
    // Accept multiple 2024 General Election formats:
    // "July 2024 General Election", "2024 General Election", "2024-07 General Election"
    const is2024General = (
      (electionLabel.includes("2024") && electionLabel.includes("general")) ||
      (electionLabel.includes("july 2024")) ||
      (electionLabel.includes("04 july 2024")) ||
      (electionLabel.includes("2024-07"))
    ) && !electionLabel.includes("by-election");
    
    if (!is2024General) continue;
    
    // Extract record data
    const record = {
      constituency: values[columnMap.constituency]?.trim() || "",
      party: parseParty(values[columnMap.party]?.trim() || ""),
      election: values[columnMap.election]?.trim() || "July 2024 General Election",
      electorate: parseInt(values[columnMap.electorate]) || 0,
      votes: parseInt(values[columnMap.votes]) || 0,
      majority: parseInt(values[columnMap.majority]) || 0,
      turnout: values[columnMap.turnout] ? `${values[columnMap.turnout]}%` : "N/A",
      result: values[columnMap.result]?.trim() || "",
      is2024: true  // ← Flag for governance.js filtering
    };
    
    if (record.constituency) {
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Parse CSV line properly handling quoted fields
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
 * Identify column positions from CSV header
 */
function identifyColumns(header) {
  const headerLower = header.map(h => h.toLowerCase());
  
  return {
    constituency: headerLower.findIndex(h => h.includes("constituency") || h.includes("name")),
    party: headerLower.findIndex(h => h.includes("party") || h.includes("winner") || h.includes("result")),
    election: headerLower.findIndex(h => h.includes("election")),
    electorate: headerLower.findIndex(h => h.includes("electorate")),
    votes: headerLower.findIndex(h => h.includes("votes") || h.includes("votes cast")),
    majority: headerLower.findIndex(h => h.includes("majority")),
    turnout: headerLower.findIndex(h => h.includes("turnout")),
    result: headerLower.findIndex(h => h.includes("result"))
  };
}

/**
 * Parse party from various formats:
 * "Lab", "Lab Hold", "Lab Gain", "Labour", "Conservative", "Con", etc.
 */
function parseParty(input) {
  if (!input) return "Unknown";
  
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
    "wpb": "Independent"  // Workers Party of Britain counted as Independent
  };
  
  // Extract abbreviation (first 3-4 chars before "Hold", "Gain", etc)
  const parts = input.split(/\s+/);
  const firstPart = parts[0].toLowerCase().substring(0, 4);
  
  return partyMap[firstPart] || "Unknown";
}

/**
 * Import records to Firestore in batches of 500
 */
async function importRecordsToFirestore(records) {
  const batchSize = 500;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = window.db.batch();
    const subset = records.slice(i, Math.min(i + batchSize, records.length));
    const collection = window.db.collection('election_results');  // ← Matches governance.js lookup
    
    subset.forEach(record => {
      const docRef = collection.doc(record.constituency);
      batch.set(docRef, record);
    });
    
    try {
      await batch.commit();
      console.log(`✓ Imported ${Math.min(i + batchSize, records.length)}/${records.length} records`);
    } catch (error) {
      console.error(`❌ Batch import failed at record ${i}:`, error);
      throw error;
    }
  }
}

// ===========================================
// HOW TO USE IN BROWSER CONSOLE:
// ===========================================
/*

1. Open governance.html in your browser
2. Go to Console (F12, then Console tab)
3. First, check if Firestore is initialized:
   
   console.log(window.db);  // Should show Firestore instance, not undefined

4. If Firestore shows up, run the import:
   
   importElectionData2024();

5. When prompted, click OK to proceed with import

6. Watch the console for progress messages

TROUBLESHOOTING:
================

If you see "❌ Firestore not initialized":
  • Make sure governance.html has Firebase imported
  • Check governance.js for Firebase initialization code
  • Try refreshing the page and running again

If columns aren't found correctly:
  • Check your CSV headers match expected names
  • Run: console.log(parseCSVLine(csvLines[0])) 
  • Report the actual column names

If no 2024 records found:
  • Verify CSV contains "July 2024 General Election" or similar text
  • Check election label format in CSV
  • Run: grep "2024" yourfile.csv

*/
