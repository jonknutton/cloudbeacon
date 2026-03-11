// Script to clear old legislation bills from Firestore and prepare for fresh sync
// Run this once, then call syncLegislation() to repopulate with correct data

import { db } from './firebase.js';
import { collection, getDocs, deleteDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export async function cleanOldLegislation() {
    console.log('[Clean] Starting to remove old legislation bills...');
    
    try {
        // Get all legislation bills
        const q = query(collection(db, 'feed'), where('isLegislation', '==', true));
        const snapshot = await getDocs(q);
        
        let deleted = 0;
        for (const docRef of snapshot.docs) {
            await deleteDoc(doc(db, 'feed', docRef.id));
            deleted++;
            console.log(`[Clean] Deleted: ${docRef.data().title}`);
        }
        
        console.log(`[Clean] Removed ${deleted} old legislation bills`);
        console.log('[Clean] Run syncLegislation() to repopulate with correct data');
        
        return deleted;
    } catch (error) {
        console.error('[Clean] Error:', error);
        throw error;
    }
}
