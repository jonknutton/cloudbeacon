/**
 * Fallback: Import MPs from pre-built list
 * Use this if the Parliament scraper fails
 */

async function importSampleMPs() {
  console.log("🚀 Starting Sample MPs Import (Fallback)");
  
  if (!window.db) {
    console.error("❌ Firestore not initialized!");
    return;
  }
  
  console.log("✅ Firestore connected");
  
  try {
    // This is a representative sample of UK MPs from 2025
    // To get the COMPLETE list, export from:
    // https://members.parliament.uk/members/commons (Manual CSV export)
    const members = [
      { name: "Keir Starmer", party: "Labour", constituency: "Holborn and St Pancras" },
      { name: "Anas Sarwar", party: "Labour", constituency: "Glasgow Central" },
      { name: "Ed Davey", party: "Liberal Democrat", constituency: "Kingston and Surbiton" },
      { name: "John Swinney", party: "SNP", constituency: "Perthshire North" },
      { name: "Beth Winter", party: "Plaid Cymru", constituency: "Dwyfor Meirionnydd" },
      { name: "Richard Foord", party: "Independent", constituency: "Tiverton and Honiton" },
      // TODO: Add all 650+ MPs here
    ];
    
    console.log(`📊 Sample dataset has ${members.length} MPs`);
    console.log("⚠️ This is a SAMPLE. For complete data, use:");
    console.log("   1. Export CSV manually from: https://members.parliament.uk/members/commons");
    console.log("   2. Use importFromCSV() function to import");
    
    const proceed = confirm(`Import ${members.length} sample MPs? (Not recommended for production)`);
    if (!proceed) return;
    
    await importMembersToFirestore(members);
    console.log("✅ Sample import complete!");
    
  } catch (error) {
    console.error("❌ Import failed:", error.message);
  }
}

/**
 * Import MPs from CSV file
 * User should manually export from: https://members.parliament.uk/members/commons
 */
async function importFromCSV(csvText) {
  console.log("🚀 Starting CSV Import");
  
  if (!window.db) {
    console.error("❌ Firestore not initialized!");
    return;
  }
  
  try {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
      throw new Error("CSV appears to be empty");
    }
    
    // Parse CSV
    const members = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 3) continue;
      
      members.push({
        name: cells[0],
        constituency: cells[1],
        party: normalizeParty(cells[2]),
        source: "manual_csv",
        imported_at: new Date().toISOString()
      });
    }
    
    if (members.length === 0) {
      throw new Error("No valid MP records found in CSV");
    }
    
    console.log(`✓ Parsed ${members.length} MPs from CSV`);
    
    const proceed = confirm(`Import ${members.length} MPs? Continue?`);
    if (!proceed) return;
    
    await importMembersToFirestore(members);
    console.log("✅ CSV import complete!");
    
  } catch (error) {
    console.error("❌ CSV import failed:", error.message);
  }
}

/**
 * Parse CSV line
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
 * Normalize party names
 */
function normalizeParty(input) {
  if (!input) return "Unknown";
  const lower = input.toLowerCase();
  if (lower.includes("labour")) return "Labour";
  if (lower.includes("conservative")) return "Conservative";
  if (lower.includes("liberal")) return "Liberal Democrat";
  if (lower.includes("snp")) return "SNP";
  if (lower.includes("plaid")) return "Plaid Cymru";
  if (lower.includes("independent")) return "Independent";
  if (lower.includes("dup")) return "DUP";
  if (lower.includes("sinn")) return "Sinn Féin";
  if (lower.includes("sdlp")) return "SDLP";
  if (lower.includes("green")) return "Green";
  return input;
}

/**
 * Import MPs to Firestore collection
 */
async function importMembersToFirestore(members) {
  const batchSize = 500;
  
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = window.db.batch();
    const subset = members.slice(i, Math.min(i + batchSize, members.length));
    const collection = window.db.collection("members_commons");
    
    subset.forEach(member => {
      const docRef = collection.doc(member.name);
      batch.set(docRef, member);
    });
    
    try {
      await batch.commit();
      console.log(`✓ Imported ${Math.min(i + batchSize, members.length)}/${members.length} members`);
    } catch (error) {
      console.error(`❌ Batch import failed at ${i}:`, error);
      throw error;
    }
  }
}

// =====================================================
// HOW TO USE:
// =====================================================
/*

OPTION 1: Try the scraper (best)
==================================
scrapeParliamentMembers()

OPTION 2: Manual CSV import (if scraper fails)
==================================
1. Go to: https://members.parliament.uk/members/commons
2. Look for "Export" or "Download" button
3. Save the CSV file
4. In browser console, paste this:

   const csvText = `name,constituency,party
Keir Starmer,Holborn and St Pancras,Labour
...`;
   
   importFromCSV(csvText);

OPTION 3: Sample import (for testing only)
==================================
importSampleMPs()

*/
