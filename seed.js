// seed.js - run once to populate Firestore with UK Parliament bills
// Add <script type="module" src="seed.js"></script> to index.html, 
// load the page logged in, then remove it again.

import { db } from './firebase.js';
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const bills = [
    {
        billId: "3760",
        title: "Crime and Policing Bill",
        description: "Government Bill · Originated in the Commons · Committee Stage",
        category: "Government Bill",
        stage: "Committee Stage",
        originatingHouse: "Commons",
        lastUpdate: "2026-02-10"
    },
    {
        billId: "3720",
        title: "Employment Rights Bill",
        description: "Government Bill · Originated in the Commons · Report Stage",
        category: "Government Bill",
        stage: "Report Stage",
        originatingHouse: "Commons",
        lastUpdate: "2026-02-08"
    },
    {
        billId: "3730",
        title: "Planning and Infrastructure Bill",
        description: "Government Bill · Originated in the Commons · Second Reading",
        category: "Government Bill",
        stage: "Second Reading",
        originatingHouse: "Commons",
        lastUpdate: "2026-02-05"
    },
    {
        billId: "3615",
        title: "Terminally Ill Adults (End of Life) Bill",
        description: "Private Member's Bill · Originated in the Commons · Committee Stage",
        category: "Private Member's Bill",
        stage: "Committee Stage",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-30"
    },
    {
        billId: "3740",
        title: "Renters' Rights Bill",
        description: "Government Bill · Originated in the Commons · Lords Second Reading",
        category: "Government Bill",
        stage: "Lords Second Reading",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-28"
    },
    {
        billId: "3690",
        title: "Border Security, Asylum and Immigration Bill",
        description: "Government Bill · Originated in the Commons · Lords Committee Stage",
        category: "Government Bill",
        stage: "Lords Committee Stage",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-25"
    },
    {
        billId: "3710",
        title: "Children's Wellbeing and Schools Bill",
        description: "Government Bill · Originated in the Commons · Report Stage",
        category: "Government Bill",
        stage: "Report Stage",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-20"
    },
    {
        billId: "3580",
        title: "Conversion Practices (Prohibition) Bill",
        description: "Private Member's Bill · Originated in the Commons · Second Reading",
        category: "Private Member's Bill",
        stage: "Second Reading",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-18"
    },
    {
        billId: "3750",
        title: "Data (Use and Access) Bill",
        description: "Government Bill · Originated in the Lords · Commons Committee Stage",
        category: "Lords Bill",
        stage: "Commons Committee Stage",
        originatingHouse: "Lords",
        lastUpdate: "2026-01-15"
    },
    {
        billId: "3600",
        title: "Football Governance Bill",
        description: "Government Bill · Originated in the Commons · Royal Assent",
        category: "Government Bill",
        stage: "Royal Assent",
        originatingHouse: "Commons",
        lastUpdate: "2026-01-10"
    }
];

async function seedBills() {
    console.log('[Seed] Starting...');
    let added = 0;
    for (const bill of bills) {
        try {
            await addDoc(collection(db, 'feed'), {
                type: 'legislation',
                category: bill.category,
                parliamentBillId: bill.billId,
                title: bill.title,
                description: bill.description,
                stage: bill.stage,
                originatingHouse: bill.originatingHouse,
                billType: bill.category,
                lastUpdate: bill.lastUpdate,
                authorId: 'parliament',
                authorName: 'UK Parliament',
                parliamentUrl: `https://bills.parliament.uk/bills/${bill.billId}`,
                createdAt: serverTimestamp(),
                votes: 0,
                isLegislation: true
            });
            added++;
            console.log(`[Seed] Added: ${bill.title}`);
        } catch (err) {
            console.error(`[Seed] Failed: ${bill.title}:`, err.message);
        }
    }
    console.log(`[Seed] Done. Added ${added} bills.`);
}

seedBills();