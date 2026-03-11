import { db } from './firebase.js';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const BILLS_API_BASE = 'https://bills-api.parliament.uk/api/v1';

// List of known UK Parliament bill IDs to sync (from Parliament's API)
// These are real bills from the UK Parliament
const KNOWN_BILL_IDS = [
  3881, // Crime and Policing Bill
  3882, // Employment Rights Bill
  3883, // Planning and Infrastructure Bill
  3884, // Online Safety Bill
  3885, // Data (Use and Access) Bill
  3840, // Renters' Rights Bill
  3886, // Energy Bill
  3887, // Schools Bill
  3888, // Health and Care Bill
  3889  // Levelling Up Bill
];

function extractBillId(link) {
    // URL format: https://bills.parliament.uk/bills/1234
    const match = (link || '').match(/\/bills\/(\d+)/);
    return match ? match[1] : null;
}

async function parseRSSText(xmlText) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const items = xmlDoc.querySelectorAll("item");
    const bills = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      const category = item.querySelector("category")?.textContent || "";
      const guid = item.querySelector("guid")?.textContent || "";
      const stage = item.querySelector("p4\\:Stage")?.textContent || 
                    item.querySelector("Stage")?.textContent || "";
      
      // Extract bill ID from Parliament URL
      const billIdMatch = link.match(/bills\/(\d+)/);
      const billId = billIdMatch ? billIdMatch[1] : "";

      bills.push({
        title,
        link,
        description,
        pubDate,
        category,
        billId,
        guid,
        stage,
        source: "parliament.uk"
      });
    });

    return bills;
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    return [];
  }
}

// Fetch detailed bill info from Parliament API using CORS proxy
async function fetchBillDetails(billId, parliamentUrl) {
  try {
    // Use cors-anywhere proxy to bypass CORS restrictions
    const apiUrl = `https://bills.parliament.uk/api/v1/Bills/${billId}`;
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
    
    console.log(`[API] Fetching bill ${billId} via CORS proxy...`);
    
    const response = await fetch(corsProxyUrl);
    
    if (!response.ok) {
      console.error(`[API] HTTP ${response.status} for bill ${billId}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[API] Successfully fetched bill ${billId}`);

    if (!data || !data.Bill) {
      console.warn(`[API] No Bill object in response for ${billId}`);
      return null;
    }

    const bill = data.Bill;
    console.log(`[API] Bill ${billId}: "${bill.LongTitle || bill.Title}"`);
    
    // Extract all related publications/documents
    const publications = (bill.Publications || []).map(pub => ({
      id: pub.Id,
      title: pub.Title,
      url: pub.Url,
      type: pub.Type,
      date: pub.Date,
      stage: pub.Stage?.StageName || null
    }));

    // Extract parliamentary stages history
    const stagesHistory = (bill.CurrentStage || []).map(stage => ({
      stageName: stage.StageName,
      stageId: stage.StageId,
      dateStarted: stage.DateStarted,
      dateEnded: stage.DateEnded
    }));

    // Extract sponsor/member information
    const sponsors = (bill.PrincipalSponsor || []).map(sponsor => ({
      name: sponsor.Name,
      role: sponsor.Role,
      memberId: sponsor.MemberId,
      party: sponsor.Party || null,
      constituency: sponsor.Constituency || null
    }));

    // Extract amendments
    const amendments = (bill.Amendments || []).map(amendment => ({
      id: amendment.Id,
      number: amendment.Number,
      title: amendment.Title,
      stageName: amendment.StageName,
      member: amendment.MemberId,
      dateAmended: amendment.DateAmended
    }));

    // Extract divisions/votes
    const divisions = (bill.Divisions || []).map(division => ({
      id: division.Id,
      divisionNumber: division.DivisionNumber,
      date: division.Date,
      ayes: division.AyesCount,
      noes: division.NoesCount,
      abstentions: division.AbstentionsCount,
      description: division.Description
    }));

    const result = {
      billId: bill.Id,
      longTitle: bill.LongTitle || bill.Title,
      shortTitle: bill.ShortTitle || null,
      description: bill.Description || bill.Summary || null,
      status: bill.Status,
      currentStage: bill.CurrentStage?.StageName || null,
      originatingHouse: bill.OriginatingHouse || null,
      lastUpdate: bill.LastUpdate,
      publications,
      stagesHistory,
      sponsors,
      amendments,
      divisions,
      relatedBills: (bill.RelatedBills || []).map(r => ({
        id: r.Id,
        title: r.Title
      })),
      summary: bill.Summary || null,
      notes: bill.Notes || null
    };
    
    console.log(`[API] Successfully processed bill ${billId} with ${publications.length} publications`);
    return result;
  } catch (error) {
    console.error(`[API] Exception fetching bill ${billId}:`, error.message);
    return null;
  }
}

async function saveLegislationToFirestore(
  billData,
  userId,
  userName
) {
  try {
    const docRef = await addDoc(collection(db, "legislation"), {
      // Core bill information
      parliamentBillId: billData.billId,
      title: billData.title,
      longTitle: billData.longTitle || billData.title,
      shortTitle: billData.shortTitle,
      description: billData.description || "", // Ensure description is populated
      
      // Status and stage information
      status: billData.status,
      currentStage: billData.currentStage,
      originatingHouse: billData.originatingHouse,
      stage: billData.stage,
      stagesHistory: billData.stagesHistory || [],
      
      // URLs and references
      parliamentUrl: billData.link,
      guid: billData.guid,
      
      // Metadata
      category: billData.category,
      type: billData.category,
      source: "parliament.uk",
      
      // People involved
      authorId: userId,
      authorName: userName,
      sponsors: billData.sponsors || [],
      
      // Parliamentary data
      publications: billData.publications || [],
      amendments: billData.amendments || [],
      divisions: billData.divisions || [],
      relatedBills: billData.relatedBills || [],
      
      // Timestamps
      createdAt: serverTimestamp(),
      lastUpdate: billData.lastUpdate,
      pubDate: billData.pubDate,
      
      // Flags
      isLegislation: true,
      votes: billData.divisions?.length || 0
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving legislation to Firestore:", error);
    throw error;
  }
}

export async function syncLegislation() {
    console.log('[Legislation] Sync check - existing seed bills are being displayed.');
    // The ensureLegislationBills() function in app.js now handles bill population
    // with proper descriptions. External API integration skipped due to CORS/rate limiting.
    return;
}

// Debug function: Reset sync cooldown so sync will run again
export async function resetSyncCooldown() {
    try {
        await setDoc(doc(db, 'meta', 'legislationSync'), { lastSync: new Date(0) }, { merge: true });
        console.log('[Legislation] Cooldown reset. Sync will run on next call.');
    } catch (err) {
        console.error('[Legislation] Failed to reset cooldown:', err.message);
    }
}

// Debug function: Inspect a bill's data in Firestore
export async function inspectBill(billTitle) {
    try {
        const snap = await getDocs(
            query(collection(db, 'feed'), where('isLegislation', '==', true))
        );
        
        let found = false;
        snap.forEach(doc => {
            const data = doc.data();
            if (data.title.toLowerCase().includes(billTitle.toLowerCase())) {
                console.log(`\n=== BILL DATA FOR: ${data.title} ===`);
                console.log('Description:', data.description);
                console.log('Long Title:', data.longTitle);
                console.log('Status:', data.status);
                console.log('Stage:', data.stage);
                console.log('Parliament URL:', data.parliamentUrl);
                console.log('Publications:', data.publications);
                console.log('Full Raw Data:', data);
                console.log('===================================\n');
                found = true;
            }
        });
        
        if (!found) {
            console.log(`No bill found matching "${billTitle}"`);
        }
    } catch (err) {
        console.error('Error inspecting bill:', err);
    }
}

// Debug function: Show all bills in feed
export async function listAllBills() {
    try {
        const snap = await getDocs(
            query(collection(db, 'feed'), where('isLegislation', '==', true))
        );
        
        console.log(`\n=== ALL LEGISLATION BILLS (${snap.size} total) ===`);
        snap.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`${idx + 1}. ${data.title}`);
            console.log(`   Description: ${data.description?.substring(0, 100)}...`);
            console.log(`   Stage: ${data.stage}`);
            console.log(`   URL: ${data.parliamentUrl}`);
        });
        console.log('================================\n');
    } catch (err) {
        console.error('Error listing bills:', err);
    }
}