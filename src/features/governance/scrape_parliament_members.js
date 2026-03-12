/**
 * Scrape current MPs from https://members.parliament.uk/members/commons
 * This page contains real, up-to-date list of all House of Commons members
 * 
 * Uses Cloud Function to bypass CORS restrictions
 */

async function scrapeParliamentMembers() {
  console.log("🚀 Starting Parliament Members Scrape (via Cloud Function)");
  
  // Step 1: Verify Firestore is accessible
  if (!window.db) {
    console.error("❌ Firestore not initialized!");
    console.log("⚠️ Make sure you're running this in governance.html context");
    return;
  }
  
  console.log("✅ Firestore connected");
  
  try {
    // Step 2: Call Cloud Function to fetch Parliament members
    // The function runs server-side, so no CORS issues!
    const cloudFunctionUrl = "https://scrapeparliamentmembers-xrat4emqya-uc.a.run.app";
    console.log(`📍 Calling Cloud Function...`);
    
    const response = await fetch(cloudFunctionUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Cloud function returned error");
    }
    
    const members = data.members || [];
    console.log(`✓ Retrieved ${members.length} MPs from Cloud Function`);
    
    if (members.length === 0) {
      console.error("❌ No MPs found!");
      console.log("⚠️ The Parliament page structure may have changed");
      return;
    }
    
    // Step 3: Preview data
    console.log("\n📊 Preview (first 5 MPs):");
    members.slice(0, 5).forEach(m => {
      console.log(`  • ${m.name} (${m.party})`);
    });
    console.log(`  ... and ${members.length - 5} more\n`);
    
    // Step 4: Confirm before import
    const proceed = confirm(`Ready to import ${members.length} MPs to Firestore. Continue?`);
    if (!proceed) {
      console.log("❌ Import cancelled by user");
      return;
    }
    
    // Step 5: Import to Firestore
    await importMembersToFirestore(members);
    console.log("✅ Import complete!");
    
  } catch (error) {
    console.error("❌ Scrape failed:", error.message);
  }
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
      const docRef = collection.doc(member.name); // Use name as unique ID
      batch.set(docRef, member);
    });
    
    try {
      await batch.commit();
      console.log(`✓ Imported ${Math.min(i + batchSize, members.length)}/${members.length} members`);
    } catch (error) {
      console.error(`❌ Batch import failed at record ${i}:`, error);
      throw error;
    }
  }
}

// =====================================================
// HOW TO USE:
// =====================================================
/*

1. Open governance.html in your browser
2. Go to Console (F12)
3. Run: scrapeParliamentMembers()
4. Cloud Function fetches data server-side (no CORS!)
5. Click OK at the confirmation dialog
6. Monitor console for import progress

The Cloud Function handles all the heavy lifting!

*/
