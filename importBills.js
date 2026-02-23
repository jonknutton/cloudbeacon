import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Import bills from the examplerss.xml file
 * Call this from the browser console: importFirstBill()
 */

export async function importFirstBill() {
    try {
        console.log('[ImportBills] Starting import of first bill from examplerss.xml...');
        
        // Fetch the XML file
        const response = await fetch('./examplerss.xml');
        const xmlText = await response.text();
        
        // Parse as HTML (more lenient with namespaces)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/html');
        const items = xmlDoc.querySelectorAll('item');
        
        console.log(`[ImportBills] Found ${items.length} items in XML`);
        
        if (items.length === 0) {
            console.error('[ImportBills] No items found in XML');
            return;
        }
        
        // Get first item
        const firstItem = items[0];
        const billData = extractBillData(firstItem, xmlText);
        
        console.log('[ImportBills] Extracted bill data:', billData);
        
        // Create in Firestore
        const docRef = await addDoc(collection(db, 'feed'), {
            type: 'legislation',
            category: billData.primaryCategory,
            allCategories: billData.allCategories,
            title: billData.title,
            description: billData.description,
            parliamentBillId: billData.billId,
            authorId: 'parliament',
            authorName: 'UK Parliament',
            parliamentUrl: billData.link,
            isLegislation: true,
            createdAt: serverTimestamp(),
            votes: 0,
            stage: billData.stage,
            publications: [],
            amendments: [],
            divisions: [],
            sponsors: [],
            stagesHistory: [],
            updated: billData.updated,
            lastUpdated: billData.updated
        });
        
        console.log('[ImportBills] ✓ Created bill document:', docRef.id);
        console.log('[ImportBills] Bill:', billData.title);
        console.log('[ImportBills] Stage:', billData.stage);
        console.log('[ImportBills] Category:', billData.category);
        console.log('[ImportBills] Description:', billData.description.substring(0, 100) + '...');
        console.log('[ImportBills] Firestore ID:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        console.error('[ImportBills] Error importing first bill:', error);
        throw error;
    }
}

export async function importAllBills() {
    try {
        console.log('[ImportBills] Starting import of ALL bills from examplerss.xml...');
        
        // Fetch the XML file
        const response = await fetch('./examplerss.xml');
        const xmlText = await response.text();
        
        // Parse as HTML (more lenient with namespaces)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/html');
        const items = xmlDoc.querySelectorAll('item');
        
        console.log(`[ImportBills] Found ${items.length} bills in XML`);
        
        let created = 0;
        for (const item of items) {
            const billData = extractBillData(item, xmlText);
            
            const docRef = await addDoc(collection(db, 'feed'), {
                type: 'legislation',
                category: billData.primaryCategory,
                allCategories: billData.allCategories,
                title: billData.title,
                description: billData.description,
                parliamentBillId: billData.billId,
                authorId: 'parliament',
                authorName: 'UK Parliament',
                parliamentUrl: billData.link,
                isLegislation: true,
                createdAt: serverTimestamp(),
                votes: 0,
                stage: billData.stage,
                publications: [],
                amendments: [],
                divisions: [],
                sponsors: [],
                stagesHistory: [],
                updated: billData.updated,
                lastUpdated: billData.updated
            });
            
            console.log(`[ImportBills] (${created + 1}/${items.length}) Created: "${billData.title}" (${billData.stage})`);
            created++;
        }
        
        console.log(`[ImportBills] ✓ Successfully imported ${created} bills`);
        return created;
    } catch (error) {
        console.error('[ImportBills] Error importing bills:', error);
        throw error;
    }
}

function extractBillData(itemElement, fullXmlText) {
    const title = itemElement.querySelector('title')?.textContent?.trim() || '';
    const description = itemElement.querySelector('description')?.textContent?.trim() || '';
    const link = itemElement.querySelector('link')?.textContent?.trim() || '';
    const guid = itemElement.querySelector('guid')?.textContent?.trim() || '';
    
    // Extract p4:stage from raw XML text by finding the item in the XML that matches this bill
    let stage = 'In Progress';
    if (fullXmlText && title) {
        // Find the corresponding <item> tag in the raw XML by title
        const titleIndex = fullXmlText.indexOf(`<title>${title}</title>`);
        if (titleIndex !== -1) {
            // Look backward to find the opening <item> tag
            const itemStart = fullXmlText.lastIndexOf('<item', titleIndex);
            if (itemStart !== -1) {
                const itemEnd = fullXmlText.indexOf('>', itemStart);
                const itemTagStr = fullXmlText.substring(itemStart, itemEnd + 1);
                const stageMatch = itemTagStr.match(/p4:stage="([^"]+)"/);
                if (stageMatch) {
                    stage = stageMatch[1];
                }
            }
        }
    }
    
    // Extract a10:updated timestamp from the item
    let updated = new Date().toISOString();
    if (fullXmlText && title) {
        const titleIndex = fullXmlText.indexOf(`<title>${title}</title>`);
        if (titleIndex !== -1) {
            // Look for the a10:updated element after the title
            const itemStart = fullXmlText.lastIndexOf('<item', titleIndex);
            const itemEnd = fullXmlText.indexOf('</item>', titleIndex);
            if (itemStart !== -1 && itemEnd !== -1) {
                const itemContent = fullXmlText.substring(itemStart, itemEnd);
                const updatedMatch = itemContent.match(/<a10:updated>([^<]+)<\/a10:updated>/);
                if (updatedMatch) {
                    updated = updatedMatch[1];
                }
            }
        }
    }
    
    // Extract bill ID from guid (https://bills.parliament.uk/bills/3879)
    const billIdMatch = guid.match(/bills\/(\d+)/);
    const billId = billIdMatch ? billIdMatch[1] : Math.random().toString().slice(2);
    
    // Extract all categories (Government Bill, Commons, Lords, etc.)
    const categories = [];
    const categoryElements = itemElement.querySelectorAll('category');
    categoryElements.forEach(cat => {
        const catText = cat.textContent?.trim();
        if (catText) {
            categories.push(catText);
        }
    });
    
    // Determine primary category from categories list
    let primaryCategory = 'Government Bill';
    categories.forEach(cat => {
        if (cat.includes('Government Bill')) {
            primaryCategory = 'Government Bill';
        } else if (cat.includes("Private Member's Bill") || cat.includes("Private Members' Bill")) {
            primaryCategory = "Private Member's Bill";
        } else if (cat.includes('Private Bill')) {
            primaryCategory = 'Private Bill';
        } else if (cat.includes('Hybrid Bill')) {
            primaryCategory = 'Hybrid Bill';
        }
    });
    
    return {
        billId,
        title,
        description,
        link,
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        primaryCategory,
        allCategories: categories,
        updated
    };
}
