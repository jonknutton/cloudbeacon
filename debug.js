// Simple debug utilities - non-module version
// These will be available on the window object after page load

async function debugListAllBills() {
    const firebaseModule = await import('./firebase.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const db = firebaseModule.db;
    const { collection, getDocs, query, where } = firestoreModule;
    
    try {
        const snap = await getDocs(
            query(collection(db, 'feed'), where('isLegislation', '==', true))
        );
        
        console.log(`\n========== ALL LEGISLATION BILLS (${snap.size} total) ==========`);
        snap.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`\n${idx + 1}. "${data.title}"`);
            console.log(`   Stage: ${data.stage || 'N/A'}`);
            console.log(`   Category: ${data.category || 'N/A'}`);
            console.log(`   Description: "${data.description}"`);
            console.log(`   Parliament URL: ${data.parliamentUrl || 'N/A'}`);
            console.log(`   Publications: ${data.publications?.length || 0} files`);
            if (data.publications && data.publications.length > 0) {
                data.publications.slice(0, 3).forEach((pub, i) => {
                    console.log(`      ${i+1}. ${pub.title || pub.Type || 'Unknown'} - ${pub.url || 'no url'}`);
                });
            }
        });
        console.log('\n================================================================\n');
    } catch (err) {
        console.error('Error listing bills:', err);
    }
}

async function debugInspectBill(billTitle) {
    const firebaseModule = await import('./firebase.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const db = firebaseModule.db;
    const { collection, getDocs, query, where } = firestoreModule;
    
    try {
        const snap = await getDocs(
            query(collection(db, 'feed'), where('isLegislation', '==', true))
        );
        
        let found = false;
        snap.forEach(doc => {
            const data = doc.data();
            if (data.title.toLowerCase().includes(billTitle.toLowerCase())) {
                console.log(`\n========== DETAILED DATA FOR: "${data.title}" ==========`);
                console.log('\nBasic Info:');
                console.log('  Title:', data.title);
                console.log('  Long Title:', data.longTitle);
                console.log('  Description:', data.description);
                console.log('  Status:', data.status);
                console.log('  Stage:', data.stage);
                console.log('  Category:', data.category);
                console.log('  Parliament URL:', data.parliamentUrl);
                
                console.log('\nPublications (' + (data.publications?.length || 0) + '):');
                if (data.publications && data.publications.length > 0) {
                    data.publications.forEach((pub, i) => {
                        console.log(`  ${i+1}. ${pub.title || 'Unknown'}`);
                        console.log(`     URL: ${pub.url}`);
                        console.log(`     Type: ${pub.type}`);
                        console.log(`     Date: ${pub.date}`);
                        console.log(`     Stage: ${pub.stage}`);
                    });
                } else {
                    console.log('  (None)');
                }
                
                console.log('\nAmendments (' + (data.amendments?.length || 0) + '):');
                if (data.amendments && data.amendments.length > 0) {
                    data.amendments.slice(0, 5).forEach((amend, i) => {
                        console.log(`  ${i+1}. #${amend.number || amend.id} - ${amend.title}`);
                    });
                } else {
                    console.log('  (None)');
                }
                
                console.log('\nDivisions/Votes (' + (data.divisions?.length || 0) + '):');
                if (data.divisions && data.divisions.length > 0) {
                    data.divisions.slice(0, 5).forEach((div, i) => {
                        console.log(`  ${i+1}. Division #${div.divisionNumber} (${div.date})`);
                        console.log(`     Ayes: ${div.ayes}, Noes: ${div.noes}, Abstain: ${div.abstentions}`);
                    });
                } else {
                    console.log('  (None)');
                }
                
                console.log('\n========== FULL RAW DATA ==========');
                console.log(data);
                console.log('==================================\n');
                found = true;
            }
        });
        
        if (!found) {
            console.log(`No bill found matching "${billTitle}". Try one of these:`);
            snap.forEach((doc, i) => {
                console.log(`  ${i+1}. ${doc.data().title}`);
            });
        }
    } catch (err) {
        console.error('Error inspecting bill:', err);
    }
}

// Expose globally
window.debugListAllBills = debugListAllBills;
window.debugInspectBill = debugInspectBill;

console.log('%c✓ Cloud Beacon Debug Tools Loaded', 'color: #0ca678; font-weight: bold; font-size: 14px;');
console.log('%cAvailable commands:', 'color: #0ca678; font-weight: bold;');
console.log('  await debugListAllBills()');
console.log('  await debugInspectBill("bill name")');
console.log('\nExample:');
console.log('  await debugInspectBill("Crime")');
