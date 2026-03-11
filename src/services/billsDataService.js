/**
 * billsDataService.js
 * Fetches real UK Parliament bills and transforms to our format
 * Uses Firestore for persistent storage (seeds with real bills from RSS)
 */

import { db } from '../../firebase.js';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const PARLIAMENT_RSS_URL = 'https://bills.parliament.uk/rss/allbills.rss';

/**
 * Fetch bills from existing legislative projects in Firestore
 * After migration, these are stored in the projects collection with category "law"
 */
async function fetchBillsFromExistingProjects() {
    try {
        console.log('[Bills Service] Fetching bills from existing legislative projects...');
        
        const projectsRef = collection(db, 'projects');
        // Query for projects marked as legislative (category: "law")
        const q = query(projectsRef, where('category', '==', 'law'));
        const snapshot = await getDocs(q);
        
        const bills = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.parliamentBillId ? `bill-uk-${data.parliamentBillId}` : doc.id,
                billId: data.parliamentBillId || doc.id,
                projectId: doc.id,  // Project ID for "Go to Project" navigation
                feedDocId: doc.id,  // Keep for compatibility with existing code
                name: data.title || data.name || 'Untitled',
                description: data.description || data.summary || 'No description available',
                stage: data.stage || 'In Progress',
                parliamentLink: data.parliamentUrl || data.billUrl || '',
                status: 'bill',
                category: data.category || 'law',
                votes: data.voteDetails || data.votes || { support: 0, oppose: 0, abstain: 0 },
                createdAt: data.createdAt,
                authorName: data.ownerName || 'UK Parliament'
            };
        });
        
        console.log(`[Bills Service] Loaded ${bills.length} bills from existing legislative projects`);
        return bills;
    } catch (error) {
        console.log('[Bills Service] Error fetching from existing projects:', error.message);
        return [];
    }
}

/**
 * Seed bills to Firestore from RSS feed (runs server-side via Cloud Function)
 * For now, this is a placeholder that returns mock bills
 */
async function seedBillsToFirestore() {
    try {
        console.log('[Bills Service] Seeding bills to Firestore...');
        
        // In production, this would call a Cloud Function that:
        // 1. Fetches RSS server-side (no CORS issues)
        // 2. Parses bills
        // 3. Stores in Firestore
        
        // For now, fetch mock bills and store them
        const mockBills = [
            {
                id: 'bill-uk-3879',
                name: 'Online Safety Bill',
                description: 'A bill to make provision about online harms, media literacy and online advertising.',
                stage: 'Royal assent',
                parliamentLink: 'https://bills.parliament.uk/bills/3879',
                status: 'bill',
                category: 'justice',
                votes: { support: 0, oppose: 0, abstain: 0 }
            },
            {
                id: 'bill-uk-3893',
                name: 'National Security Bill',
                description: 'A bill to establish the National Security and Investment Act.',
                stage: 'In progress',
                parliamentLink: 'https://bills.parliament.uk/bills/3893',
                status: 'bill',
                category: 'justice',
                votes: { support: 0, oppose: 0, abstain: 0 }
            },
            {
                id: 'bill-uk-3872',
                name: 'Health and Care Bill',
                description: 'A bill to provide for the establishment of health and social care bodies and other provisions.',
                stage: 'Royal assent',
                parliamentLink: 'https://bills.parliament.uk/bills/3872',
                status: 'bill',
                category: 'health',
                votes: { support: 0, oppose: 0, abstain: 0 }
            }
        ];
        
        // Note: In a real implementation, you would store these via Cloud Function
        // For now, we're using these as fallback mock data
        return mockBills;
    } catch (error) {
        console.log('[Bills Service] Error seeding bills:', error.message);
        return [];
    }
}



/**
 * Determine bill category from title and description (heuristic approach)
 */
function determineBillCategory(title = '', description = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    // Healthcare/Health
    if (text.includes('health') || text.includes('medical') || text.includes('nhs')) return 'health';
    
    // Environment
    if (text.includes('environment') || text.includes('climate')) return 'environment';
    
    // Economy/Finance
    if (text.includes('economic') || text.includes('finance') || text.includes('tax') || text.includes('banking')) return 'economy';
    
    // Education
    if (text.includes('education') || text.includes('school') || text.includes('university')) return 'education';
    
    // Housing
    if (text.includes('housing') || text.includes('rent') || text.includes('property')) return 'housing';
    
    // Law & Order
    if (text.includes('crime') || text.includes('police') || text.includes('justice') || text.includes('court')) return 'justice';
    
    // Default
    return 'other';
}

/**
 * Test the bills service - Fetch and log bill structure
 */
export async function testBillsAPI() {
    console.log('\n========== TESTING UK PARLIAMENT BILLS SERVICE ==========\n');
    
    try {
        console.log('TEST 1: Fetching bills from existing legislative projects...');
        const bills = await fetchBillsFromExistingProjects();
        
        if (bills.length > 0) {
            console.log(`✓ Successfully fetched ${bills.length} bills from existing projects`);
            console.log('\nSample bill structure:');
            console.log(JSON.stringify(bills[0], null, 2));
        } else {
            console.warn('✗ No legislative projects found, using fallback mock data...');
            const seeded = await seedBillsToFirestore();
            console.log(`✓ Using ${seeded.length} mock bills as fallback`);
        }
        
        return bills;
    } catch (error) {
        console.error('✗ Test failed:', error);
        return [];
    }
}

/**
 * Export main function for lawTab to use
 * Loads bills from existing legislative projects in feed collection
 */
export async function loadRealBills() {
    console.log('[billsDataService] Loading bills from existing legislative projects...');
    
    try {
        // Load from existing legislative projects
        let bills = await fetchBillsFromExistingProjects();
        
        if (!bills || bills.length === 0) {
            console.log('[billsDataService] No legislative projects found in feed collection');
            console.log('[billsDataService] You can seed bills using: seedBillsToFirestore()');
            // Fall back to mock data
            bills = await seedBillsToFirestore();
        }
        
        if (!bills || bills.length === 0) {
            console.log('[billsDataService] No bills available, lawTab will use its own mock data');
            return [];
        }
        
        console.log(`[billsDataService] Successfully loaded ${bills.length} bills`);
        return bills;
    } catch (error) {
        console.log('[billsDataService] Error loading bills, lawTab will use mock data:', error.message);
        return [];
    }
}

/**
 * Debug: Inspect bills from existing projects
 */
export async function inspectAPIEndpoints() {
    console.log('\n========== BILLS SERVICE INSPECTION ==========\n');
    
    try {
        console.log('1️⃣  Checking for existing legislative projects in feed collection...');
        const bills = await fetchBillsFromExistingProjects();
        
        if (bills.length > 0) {
            console.log(`✓ Found ${bills.length} bills from existing legislative projects`);
            console.log('\nSample bill:');
            console.log(JSON.stringify(bills[0], null, 2));
        } else {
            console.log('✗ No legislative projects found in feed collection');
            console.log('\nℹ️  To load bills, you have ~70 legislative projects already in Firestore.');
            console.log('    Run this in console to verify: db.collection("feed").where("isLegislation", "==", true).get().then(s => console.log(`Found ${s.size} projects`))');
        }
    } catch (error) {
        console.log(`✗ Error: ${error.message}`);
    }
}

/**
 * Window-exposed function for dev console seeding (must enable manually in governance.html)
 * Usage: window.seedGovBills() in browser console
 */
export async function seedGovBills() {
    console.log('\n🌱 SEEDING BILLS FROM EXISTING LEGISLATIVE PROJECTS\n');
    try {
        const bills = await fetchBillsFromExistingProjects();
        if (bills.length > 0) {
            console.log(`✅ Ready to use! Found ${bills.length} bills`);
            console.log('Bills will now load automatically in governance.html');
            return bills;
        } else {
            console.log('⚠️  No legislative projects found. Create some first!');
            return [];
        }
    } catch (error) {
        console.error('❌ Seeding error:', error.message);
        return [];
    }
}

/**
 * List all bills with their IDs for manual updates
 * Usage: window.listBillsForUpdate() in browser console
 */
export async function listBillsForUpdate() {
    console.log('\n📋 BILLS AVAILABLE FOR UPDATE\n');
    try {
        const bills = await fetchBillsFromExistingProjects();
        
        if (bills.length === 0) {
            console.log('⚠️  No bills found');
            return [];
        }
        
        console.log(`Found ${bills.length} bills:\n`);
        bills.forEach((bill, idx) => {
            console.log(`${idx + 1}. ID: "${bill.billId}"`);
            console.log(`   Name: ${bill.name}`);
            console.log(`   Current: ${bill.description.substring(0, 80)}...`);
            console.log('');
        });
        
        console.log(`💡 To update a bill description, run:`);
        console.log(`   window.updateBillDescription("BILL_ID", "New description here")`);
        
        return bills;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return [];
    }
}

/**
 * Update a bill's description in Firestore
 * Usage: window.updateBillDescription("bill-id", "New description") in browser console
 */
export async function updateBillDescription(billId, newDescription) {
    console.log(`\n📝 UPDATING BILL DESCRIPTION\n`);
    
    if (!billId || !newDescription) {
        console.error('❌ Usage: updateBillDescription(billId, newDescription)');
        return false;
    }
    
    if (newDescription.length === 0) {
        console.error('❌ Description cannot be empty');
        return false;
    }
    
    try {
        console.log(`🔍 Searching for bill: "${billId}"...`);
        
        const feedRef = collection(db, 'feed');
        
        // Try to find by parliamentBillId first
        const q = query(feedRef, where('parliamentBillId', '==', billId));
        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length === 0) {
            console.error(`❌ Bill "${billId}" not found in Firestore`);
            console.log('   Run window.listBillsForUpdate() to see available bills');
            return false;
        }
        
        const docId = snapshot.docs[0].id;
        const docRef = doc(db, 'feed', docId);
        
        // Update both description and summary fields for compatibility
        await updateDoc(docRef, {
            description: newDescription,
            summary: newDescription,
            updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Successfully updated bill "${billId}"`);
        console.log(`   New description: ${newDescription.substring(0, 100)}${newDescription.length > 100 ? '...' : ''}`);
        console.log('\n💾 Changes saved to Firestore');
        console.log('   Refresh governance.html to see the updated description');
        
        return true;
    } catch (error) {
        console.error(`❌ Error updating bill: ${error.message}`);
        return false;
    }
}

/**
 * Find a project associated with a bill
 * Note: After migration, bills ARE projects (category: "law")
 * This function now searches by title for any orphaned bills
 * Usage: window.getProjectForBill(billTitle) in browser console
 */
export async function getProjectForBill(billTitleOrId, fallbackTitle) {
    try {
        // Treat first param as title since bills are now projects
        const searchTitle = billTitleOrId || fallbackTitle;
        
        if (!searchTitle) {
            console.error('[Bills Service] No title or ID provided to search');
            return null;
        }
        
        console.log(`[Bills Service] Searching for project with title: "${searchTitle}"`);
        
        const projectsRef = collection(db, 'projects');
        
        // Try exact match first
        let q = query(projectsRef, where('title', '==', searchTitle), where('category', '==', 'law'));
        let snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
            const projectId = snapshot.docs[0].id;
            console.log(`[Bills Service] Found project by exact title: ${projectId}`);
            return projectId;
        }
        
        // Try case-insensitive search
        console.log(`[Bills Service] No exact match, searching all law projects...`);
        const allLawProjects = await getDocs(query(projectsRef, where('category', '==', 'law')));
        const titleLower = searchTitle.toLowerCase();
        
        const matchingProjects = allLawProjects.docs.filter(doc => 
            doc.data().title && doc.data().title.toLowerCase() === titleLower
        );
        
        if (matchingProjects.length > 0) {
            const projectId = matchingProjects[0].id;
            console.log(`[Bills Service] Found project by case-insensitive title: ${projectId}`);
            return projectId;
        }
        
        // Try partial match
        console.log(`[Bills Service] No case-insensitive match, trying partial match...`);
        const partialMatches = allLawProjects.docs.filter(doc => {
            const projTitle = doc.data().title || '';
            return titleLower.includes(projTitle.toLowerCase()) || 
                   projTitle.toLowerCase().includes(titleLower);
        });
        
        if (partialMatches.length > 0) {
            const projectId = partialMatches[0].id;
            console.log(`[Bills Service] Found project by partial title match: ${projectId}`);
            console.log(`   Project title: "${partialMatches[0].data().title}"`);
            return projectId;
        }
        
        console.warn(`[Bills Service] No project found with title: "${searchTitle}"`);
        return null;
    } catch (error) {
        console.error(`[Bills Service] Error finding project: ${error.message}`);
        return null;
    }
}

/**
 * Debug: Show what projects exist and their bill ID fields
 * Usage: window.debugProjectBillIds() in browser console
 */
export async function debugProjectBillIds() {
    console.log('\n🔍 COMPARING PROJECT vs FEED TITLES\n');
    try {
        const projectsRef = collection(db, 'projects');
        const allProjects = await getDocs(projectsRef);
        
        const feedRef = collection(db, 'feed');
        const allFeed = await getDocs(feedRef);
        
        const projectTitles = allProjects.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            type: doc.data().type
        }));
        
        const feedTitles = allFeed.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            isLegislation: doc.data().isLegislation,
            type: doc.data().type
        }));
        
        console.log(`\n📁 PROJECTS (${projectTitles.length} total):`);
        projectTitles.forEach((p, idx) => {
            console.log(`${idx + 1}. "${p.title}"`);
        });
        
        console.log(`\n📋 FEED ITEMS (first 10 of ${feedTitles.length} total):`);
        feedTitles.slice(0, 10).forEach((f, idx) => {
            console.log(`${idx + 1}. "${f.title}"`);
        });
        
        console.log(`\n🔍 MATCHING BY TITLE:\n`);
        let matchCount = 0;
        projectTitles.forEach(proj => {
            const matching = feedTitles.filter(f => f.title === proj.title);
            if (matching.length > 0) {
                console.log(`✓ "${proj.title}"`);
                console.log(`  Project ID: ${proj.id}`);
                console.log(`  Feed IDs: ${matching.map(m => m.id).join(', ')}`);
                matchCount++;
            }
        });
        
        console.log(`\n✅ Exact title matches: ${matchCount} / ${projectTitles.length}`);
        
        // Show non-matching projects
        const nonMatching = projectTitles.filter(proj => 
            !feedTitles.some(f => f.title === proj.title)
        );
        
        if (nonMatching.length > 0) {
            console.log(`\n❌ PROJECTS WITH NO MATCHING FEED DOCUMENT:\n`);
            nonMatching.forEach((p, idx) => {
                console.log(`${idx + 1}. "${p.title}"`);
            });
        }
        
        return { projectTitles, feedTitles, matchCount };
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * MIGRATION: Convert all legislative feed items into projects
 * Step 1: Create or get "UK Gov Info" user account
 * Step 2: Convert all feed documents (isLegislation: true) to projects (category: "law")
 * Step 3: Add "UK Gov Info" as sponsor to each project's team
 * Step 4: Delete original feed documents
 * 
 * Usage: 
 *   window.migrateLegislativeToProjects('preview') - Shows what will be done
 *   window.migrateLegislativeToProjects('execute') - Actually does the migration
 */
export async function migrateLegislativeToProjects(action = 'preview') {
    console.log('\n🚀 LEGISLATIVE FEED → PROJECTS MIGRATION\n');
    
    if (action !== 'preview' && action !== 'execute') {
        console.error('❌ Usage: migrateLegislativeToProjects("preview") or migrateLegislativeToProjects("execute")');
        return;
    }
    
    const isPreview = action === 'preview';
    
    try {
        // Step 1: Create or get "UK Gov Info" user
        console.log('Step 1: Setting up "UK Gov Info" user account...');
        const ukGovUserId = await getOrCreateUKGovUser();
        console.log(`✓ UK Gov Info user ID: ${ukGovUserId}`);
        
        // Step 2: Get all legislative feed items
        console.log('\nStep 2: Fetching legislative feed items...');
        const feedRef = collection(db, 'feed');
        const q = query(feedRef, where('isLegislation', '==', true));
        const snapshot = await getDocs(q);
        
        const legislativeFeedItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`✓ Found ${legislativeFeedItems.length} legislative items to migrate`);
        
        if (legislativeFeedItems.length === 0) {
            console.log('ℹ️  No legislative items to migrate');
            return;
        }
        
        // Preview: Show what will be created
        console.log('\n📋 PREVIEW - Items to migrate:');
        legislativeFeedItems.forEach((item, idx) => {
            console.log(`\n${idx + 1}. "${item.title}"`);
            console.log(`   Feed ID: ${item.id}`);
            console.log(`   Stage: ${item.stage || 'N/A'}`);
            console.log(`   Category: law (from ${item.category || 'N/A'})`);
        });
        
        if (isPreview) {
            console.log(`\n✨ PREVIEW COMPLETE`);
            console.log(`\n📊 Summary:`);
            console.log(`   - Legislative items to convert: ${legislativeFeedItems.length}`);
            console.log(`   - Destination: projects collection (category: "law")`);
            console.log(`   - Owner/Sponsor: "UK Gov Info" (${ukGovUserId})`);
            console.log(`   - Feed documents: Will be DELETED after migration`);
            console.log(`\n💡 To execute this migration, run:`);
            console.log(`   window.migrateLegislativeToProjects('execute')`);
            console.log(`\n⚠️  WARNING: This cannot be undone without restoring from backups!`);
            return;
        }
        
        // Execute migration
        console.log('\n🔄 EXECUTING MIGRATION...\n');
        
        let successCount = 0;
        let failureCount = 0;
        const createdProjectIds = [];
        
        for (const feedItem of legislativeFeedItems) {
            try {
                console.log(`Processing: "${feedItem.title.substring(0, 60)}..."`);
                
                // Create project from feed item
                const projectRef = await addDoc(collection(db, 'projects'), {
                    // Core data from feed item
                    title: feedItem.title,
                    description: feedItem.description || feedItem.summary || 'No description available',
                    category: 'law',  // All legislative items become "law" category
                    type: 'project',
                    
                    // Metadata
                    ownerId: ukGovUserId,
                    ownerName: 'UK Gov Info',
                    isPublic: true,
                    isProposal: false,
                    status: feedItem.stage || 'In Progress',
                    
                    // Transfer existing data
                    parliamentBillId: feedItem.parliamentBillId,
                    parliamentUrl: feedItem.parliamentUrl,
                    stage: feedItem.stage,
                    
                    // Initialize votes
                    votes: feedItem.votes ? Object.values(feedItem.votes).reduce((a, b) => a + b, 0) : 0,
                    voteDetails: feedItem.votes || { support: 0, oppose: 0, abstain: 0 },
                    
                    // Timestamps
                    createdAt: feedItem.createdAt || serverTimestamp(),
                    migratedFrom: 'feed',
                    migratedAt: serverTimestamp()
                });
                
                const projectId = projectRef.id;
                
                // Add UK Gov Info as sponsor in project team
                await setDoc(doc(db, 'projects', projectId, 'team', ukGovUserId), {
                    uid: ukGovUserId,
                    username: 'UK Gov Info',
                    email: 'uk-gov-info@parliament.gov.uk',
                    role: 'Sponsor',
                    external: true,  // Mark as external (not a real user)
                    addedAt: serverTimestamp()
                });
                
                // Add back-reference on UK Gov user doc
                await setDoc(doc(db, 'users', ukGovUserId, 'projects', projectId), {
                    projectId: projectId,
                    title: feedItem.title,
                    type: 'project',
                    role: 'Sponsor',
                    addedAt: serverTimestamp()
                });
                
                // Delete original feed document
                await deleteDoc(doc(db, 'feed', feedItem.id));
                
                console.log(`  ✅ Created project: ${projectId}`);
                createdProjectIds.push(projectId);
                successCount++;
                
            } catch (itemError) {
                console.error(`  ❌ Failed to migrate: ${itemError.message}`);
                failureCount++;
            }
        }
        
        // Summary
        console.log(`\n✨ MIGRATION COMPLETE\n`);
        console.log(`📊 Results:`);
        console.log(`   ✅ Successfully migrated: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log(`\n🆔 New project IDs:\n`);
        createdProjectIds.forEach((id, idx) => {
            console.log(`   ${idx + 1}. ${id}`);
        });
        console.log(`\n🎉 All legislative items now available as projects with full features!`);
        console.log(`   - View them in the Projects section`);
        console.log(`   - Bills will now link correctly to these projects`);
        
    } catch (error) {
        console.error(`\n❌ Migration failed: ${error.message}`);
        console.error(error);
    }
}

/**
 * Helper: Get or create the special "UK Gov Info" user account
 * This is a special account for government-provided content
 */
async function getOrCreateUKGovUser() {
    const specialUserId = 'uk-gov-info-auto';
    const userRef = doc(db, 'users', specialUserId);
    
    try {
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            console.log('   (UK Gov Info user already exists)');
            return specialUserId;
        }
        
        // Create the special user document
        await setDoc(userRef, {
            uid: specialUserId,
            email: 'uk-gov-info@parliament.gov.uk',
            displayName: 'UK Gov Info',
            role: 'government_source',
            isExternal: true,
            type: 'service_account',
            createdAt: serverTimestamp(),
            description: 'Special account for government-provided legislative content'
        });
        
        console.log('   (Created UK Gov Info user)');
        return specialUserId;
        
    } catch (error) {
        console.error(`Error creating UK Gov user: ${error.message}`);
        throw error;
    }
}/**
 * Debug: Show what fields are in feed documents
 * Usage: window.debugFeedDocuments() in browser console
 */
export async function debugFeedDocuments() {
    console.log('\n📋 DEBUGGING FEED DOCUMENTS WITH isLegislation\n');
    try {
        const feedRef = collection(db, 'feed');
        const q = query(feedRef, where('isLegislation', '==', true));
        const snapshot = await getDocs(q);
        
        console.log(`Found ${snapshot.docs.length} legislative feed documents\n`);
        
        // Show first 5
        snapshot.docs.slice(0, 5).forEach((doc, idx) => {
            console.log(`${idx + 1}. Feed Doc ID: ${doc.id}`);
            const data = doc.data();
            console.log(`   Title: ${data.title}`);
            console.log(`   parliamentBillId: ${data.parliamentBillId}`);
            console.log(`   projectId: ${data.projectId}`);
            console.log(`   All keys:`, Object.keys(data).join(', '));
            console.log('');
        });
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Debug: Compare project titles and feed titles to find matches
 * Usage: window.compareTitles() in browser console
 */
export async function compareTitles() {
    console.log('\n📊 COMPARING PROJECT vs FEED TITLES\n');
    try {
        const projectsRef = collection(db, 'projects');
        const allProjects = await getDocs(projectsRef);
        
        const feedRef = collection(db, 'feed');
        const allFeed = await getDocs(feedRef);
        
        const projectTitles = allProjects.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            type: doc.data().type
        }));
        
        const feedTitles = allFeed.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            isLegislation: doc.data().isLegislation,
            type: doc.data().type
        }));
        
        console.log(`\n📁 PROJECTS (${projectTitles.length} total):`);
        projectTitles.forEach((p, idx) => {
            console.log(`${idx + 1}. "${p.title}" (type: ${p.type})`);
        });
        
        console.log(`\n📋 FEED ITEMS (${feedTitles.length} total):`);
        feedTitles.slice(0, 10).forEach((f, idx) => {
            console.log(`${idx + 1}. "${f.title}" (type: ${f.type}, isLegislation: ${f.isLegislation})`);
        });
        
        console.log(`\n🔍 MATCHING BY TITLE:\n`);
        let matchCount = 0;
        projectTitles.forEach(proj => {
            const matching = feedTitles.filter(f => f.title === proj.title);
            if (matching.length > 0) {
                console.log(`✓ "${proj.title}"`);
                console.log(`  Project ID: ${proj.id}`);
                console.log(`  Feed IDs: ${matching.map(m => m.id).join(', ')}`);
                matchCount++;
            }
        });
        
        console.log(`\n✅ Exact title matches: ${matchCount} / ${projectTitles.length}`);
        
        // Show non-matching projects
        const nonMatching = projectTitles.filter(proj => 
            !feedTitles.some(f => f.title === proj.title)
        );
        
        if (nonMatching.length > 0) {
            console.log(`\n❌ PROJECTS WITH NO MATCHING FEED DOCUMENT:\n`);
            nonMatching.forEach((p, idx) => {
                console.log(`${idx + 1}. "${p.title}"`);
            });
        }
        
        return { projectTitles, feedTitles, matchCount };
    } catch (error) {
        console.error('Error:', error.message);
    }
}

/**
 * Fetch all legislation bills from Firestore (populated by importUKParliamentBillsToFirestore)
 * This is the production method - no API calls needed
 */
export async function fetchAllLegislationFromFirestore() {
    try {
        console.log('[Bills Service] Loading all legislation from Firestore...');
        
        const allLegislationRef = collection(db, 'allLegislation');
        const snapshot = await getDocs(allLegislationRef);
        
        const bills = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                billId: data.parliamentBillId,
                projectId: null,  // No project for these bills
                name: data.title || 'Untitled',
                description: data.description || 'No description available',
                stage: data.stage || 'In Progress',
                parliamentLink: data.parliamentUrl || '',
                status: 'bill',
                category: data.category || 'other',
                votes: data.votes || { support: 0, oppose: 0, abstain: 0 },
                createdAt: data.createdAt,
                authorName: 'UK Parliament'
            };
        });
        
        console.log(`[Bills Service] Loaded ${bills.length} bills from Firestore allLegislation`);
        return bills;
    } catch (error) {
        console.log('[Bills Service] Error loading from Firestore:', error.message);
        return [];
    }
}

/**
 * Fetch all UK Parliament bills for "All Legislation" section
 * These bills don't have projects (no projectId field)
 * Usage: window.fetchAllUKParliamentBills() in browser console
 */
export async function fetchAllUKParliamentBills() {
    try {
        console.log('[Bills Service] Fetching all UK Parliament bills from Firestore...');
        return await fetchAllLegislationFromFirestore();
    } catch (error) {
        console.error('[Bills Service] Error:', error.message);
        return [];
    }
}

/**
 * MANUAL DATA IMPORT: Store pre-fetched UK Parliament bills to Firestore
 * Since API is CORS-blocked, use this to import manually provided bill data
 * 
 * Usage Step 1: Copy sample bills JSON and run:
 *   window.importAllLegislationBills(sampleBillsData, 'preview')
 * 
 * Usage Step 2: Execute import:
 *   window.importAllLegislationBills(sampleBillsData, 'execute')
 */
export async function importAllLegislationBills(billsData, action = 'preview') {
    console.log('\n🚀 ALL LEGISLATION BILLS → FIRESTORE IMPORT\n');
    
    if (!Array.isArray(billsData) || billsData.length === 0) {
        console.error('❌ Please provide an array of bill objects');
        return;
    }
    
    if (action !== 'preview' && action !== 'execute') {
        console.error('❌ Usage: importAllLegislationBills(billsData, "preview") or "execute"');
        return;
    }
    
    const isPreview = action === 'preview';
    
    try {
        const bills = billsData.map(bill => ({
            parliamentBillId: bill.id || bill.billId,
            title: bill.title || bill.shortTitle || 'Untitled',
            description: bill.description || bill.summary || 'No description available',
            stage: bill.stage || bill.currentStage || 'In Progress',
            parliamentUrl: bill.url || bill.parliamentUrl || bill.link || '',
            category: bill.category || determineBillCategory(bill.title || '', bill.description || ''),
            votes: { support: 0, oppose: 0, abstain: 0 },
            introducedDate: bill.introducedDate || bill.introduced || new Date().toISOString(),
            source: 'parliament.uk',
            status: 'bill',
            type: 'allLegislation'
        }));
        
        if (isPreview) {
            console.log(`✨ PREVIEW COMPLETE\n`);
            console.log(`📊 Summary:`);
            console.log(`   - Bills to import: ${bills.length}`);
            console.log(`   - Destination: Firestore → allLegislation collection`);
            
            console.log(`\n📋 Sample bills (first 5):`);
            bills.slice(0, 5).forEach((bill, idx) => {
                console.log(`   ${idx + 1}. "${bill.title}"`);
                console.log(`      Stage: ${bill.stage}`);
            });
            
            console.log(`\n💡 To execute this import, run:`);
            console.log(`   window.importAllLegislationBills(sampleBillsData, 'execute')`);
            console.log(`\n⚠️  This will create documents in allLegislation collection!`);
            return;
        }
        
        // Execute import
        console.log('🔄 EXECUTING IMPORT...\n');
        
        const allLegislationRef = collection(db, 'allLegislation');
        let successCount = 0;
        let failureCount = 0;
        
        for (const bill of bills) {
            try {
                await addDoc(allLegislationRef, {
                    ...bill,
                    createdAt: serverTimestamp(),
                    importedAt: serverTimestamp()
                });
                
                console.log(`✅ "${bill.title.substring(0, 50)}..."`);
                successCount++;
                
            } catch (itemError) {
                console.error(`❌ Failed: ${itemError.message}`);
                failureCount++;
            }
        }
        
        console.log(`\n✨ IMPORT COMPLETE\n`);
        console.log(`📊 Results:`);
        console.log(`   ✅ Successfully imported: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log(`\n🎉 Bills now available in Firestore allLegislation collection!`);
        
        return { success: successCount, failed: failureCount, total: bills.length };
        
    } catch (error) {
        console.error(`❌ Import failed: ${error.message}`);
        console.error(error);
    }
}

/**
 * Get sample UK Acts data from legislation.gov.uk for manual import
 * These are ENACTED ACTS (not pending bills) - from https://www.legislation.gov.uk/new/ukpga/data.feed
 * Run this, copy the output, then use: window.importAllLegislationBills(data, 'execute')
 */
export function getSampleBillsForImport() {
    return [
        {
            id: 1,
            title: "Sentencing Act 2026",
            shortTitle: "Sentencing Act 2026",
            description: "Makes provision about sentencing, release and management after sentencing of offenders; provision about bail; and removal of foreign criminals.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2026/2",
            introducedDate: "2026-01-22"
        },
        {
            id: 2,
            title: "Holocaust Memorial Act 2026",
            shortTitle: "Holocaust Memorial Act 2026",
            description: "Makes provision for expenditure by the Secretary of State for construction of a Holocaust Memorial and Learning Centre.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2026/3",
            introducedDate: "2026-01-22"
        },
        {
            id: 3,
            title: "Licensing Hours Extensions Act 2026",
            shortTitle: "Licensing Hours Extensions Act 2026",
            description: "Amends the Licensing Act 2003 so that licensing hours orders can be made by negative resolution statutory instrument.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2026/4",
            introducedDate: "2026-02-13"
        },
        {
            id: 4,
            title: "Secure 16 to 19 Academies Act 2026",
            shortTitle: "Secure 16 to 19 Academies Act 2026",
            description: "Makes provision about notice period for termination of funding agreements for secure 16 to 19 Academies.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2026/5",
            introducedDate: "2026-02-13"
        },
        {
            id: 5,
            title: "Biodiversity Beyond National Jurisdiction Act 2026",
            shortTitle: "Biodiversity Beyond National Jurisdiction Act 2026",
            description: "Implementation of the Agreement under the UN Convention on the Law of the Sea on Conservation and Sustainable Use of Marine Biological Diversity.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2026/6",
            introducedDate: "2026-02-13"
        },
        {
            id: 6,
            title: "Employment Rights Act 2025",
            shortTitle: "Employment Rights Act 2025",
            description: "Makes provision to amend employment rights law; procedure for handling redundancies; equality duties on employers; trade unions and industrial action.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/36",
            introducedDate: "2025-12-19"
        },
        {
            id: 7,
            title: "Planning and Infrastructure Act 2025",
            shortTitle: "Planning and Infrastructure Act 2025",
            description: "Makes provision about infrastructure; town and country planning; nature restoration levy; development corporations; compulsory purchase of land.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/34",
            introducedDate: "2025-12-18"
        },
        {
            id: 8,
            title: "Mental Health Act 2025",
            shortTitle: "Mental Health Act 2025",
            description: "Makes provision to amend the Mental Health Act 1983 in relation to mentally disordered persons.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/33",
            introducedDate: "2025-12-18"
        },
        {
            id: 9,
            title: "Border Security, Asylum and Immigration Act 2025",
            shortTitle: "Border Security, Asylum and Immigration Act 2025",
            description: "Makes provision about border security, immigration and asylum, customs data sharing, serious crime prevention orders.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/31",
            introducedDate: "2025-12-02"
        },
        {
            id: 10,
            title: "Renters' Rights Act 2025",
            shortTitle: "Renters' Rights Act 2025",
            description: "Makes provision about rented homes including abolishing fixed term assured tenancies and imposing obligations on landlords.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/26",
            introducedDate: "2025-10-31"
        },
        {
            id: 11,
            title: "Animal Welfare (Import of Dogs, Cats and Ferrets) Act 2025",
            shortTitle: "Animal Welfare Act 2025",
            description: "Makes provision for restricting the importation and non-commercial movement of dogs, cats and ferrets.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/30",
            introducedDate: "2025-12-02"
        },
        {
            id: 12,
            title: "Space Industry (Indemnities) Act 2025",
            shortTitle: "Space Industry Act 2025",
            description: "Requires operator licences authorising spaceflight activities to specify the licensee's indemnity limit.",
            stage: "Enacted",
            url: "https://www.legislation.gov.uk/ukpga/2025/35",
            introducedDate: "2025-12-18"
        }
    ];
}
