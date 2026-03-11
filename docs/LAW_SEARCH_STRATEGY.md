# Law Search & Indexing Strategy

## Problem
Britain has 100,000+ laws. Current approach loads all laws in memory - not scalable.

## Solution: Multi-Layer Search Strategy

### 1. **Client-Side Caching Layer** (Fast, Limited)
- Cache current page (~20 laws) in memory
- Search cache for instant typing feedback
- Cost: ~100KB per page

### 2. **Firestore Full-Text Search** (Scalable, Server-Side)
Use Firestore's native sorting and filtering:

```javascript
// Example queries
const billsInCommittee = query(
    collection(db, 'laws'),
    where('status', '==', 'bill'),
    where('stage', '==', 'Committee'),
    limit(50)
);

const relevantLaws = query(
    collection(db, 'laws'),
    where('keywords', 'array-contains', 'healthcare'),
    limit(50)
);
```

### 3. **Elasticsearch Integration** (Production-Grade, Optional)
For more complex searches:

```javascript
// ESaaS providers: Elastic Cloud, Typesense, Algolia
const results = await elasticsearchClient.search({
    index: 'laws',
    body: {
        query: {
            multi_match: {
                query: 'climate action emissions',
                fields: ['title^3', 'description', 'keywords']
            }
        }
    }
});
```

### 4. **Database Schema - Updated**

```javascript
// Firestore laws collection structure
{
    id: 'law-uk-2023-001',
    title: 'Environmental Protection Act 2023',
    description: 'Full text...',
    type: 'law|bill',
    status: 'enacted|active|withdrawn',
    stage: 'House of Commons|House of Lords|Royal Assent',
    year: 2023,
    category: 'environment',  // Index this
    keywords: ['climate', 'emissions', 'renewable'],  // Array for array-contains queries
    sponsor: 'Member Name',
    votes: { support: 156, oppose: 34 },
    createdAt: timestamp,
    updatedAt: timestamp,
    searchTokens: ['environmental', 'protection', 'act', 'emissions']  // For text search
}
```

---

## Implementation Plan

### Phase 1: Firestore Optimization (Immediate - 2 hours)
**Goal:** Make current system work with pagination

1. **Add pagination to lawTab.js**
   ```javascript
   const PAGE_SIZE = 50; // Show 50 laws per page
   let currentPage = 0;
   
   async function loadLawsAndBills(country, page = 0) {
       const startDoc = page * PAGE_SIZE;
       const endDoc = (page + 1) * PAGE_SIZE;
       
       // Firestore query with pagination
       const q = query(
           collection(db, 'laws'),
           where('country', '==', country),
           limit(endDoc)
       );
       
       const snap = await getDocs(q);
       const allLaws = snap.docs.map(doc => doc.data());
       return allLaws.slice(startDoc, endDoc);
   }
   ```

2. **Add filter controls to governance.html**
   ```html
   <div class="law-filters">
       <select id="typeFilter" onchange="applyFilters()">
           <option value="">All Laws</option>
           <option value="law">Enacted</option>
           <option value="bill">Under Consideration</option>
       </select>
       
       <select id="categoryFilter" onchange="applyFilters()">
           <option value="">All Categories</option>
           <option value="health">Healthcare</option>
           <option value="environment">Environment</option>
           <option value="economy">Economy</option>
           <option value="education">Education</option>
           <option value="housing">Housing</option>
       </select>
       
       <input type="text" id="searchBox" placeholder="Search laws..." 
              onkeyup="debounceSearch()" />
   </div>
   ```

3. **Implement client-side filtering**
   ```javascript
   function applyFilters() {
       const typeFilter = document.getElementById('typeFilter').value;
       const categoryFilter = document.getElementById('categoryFilter').value;
       const searchTerm = document.getElementById('searchBox').value.toLowerCase();
       
       const filtered = lawsCache.filter(law => {
           if (typeFilter && law.type !== typeFilter) return false;
           if (categoryFilter && law.category !== categoryFilter) return false;
           if (searchTerm && 
               !law.title.toLowerCase().includes(searchTerm) &&
               !law.description.toLowerCase().includes(searchTerm)) return false;
           return true;
       });
       
       renderLawsSection(filtered);
   }
   ```

4. **Add pagination controls**
   ```javascript
   function showPagination(total) {
       const pages = Math.ceil(total / PAGE_SIZE);
       let html = '<div class="pagination">';
       
       for (let i = 0; i < pages; i++) {
           html += `<button class="page-btn" onclick="goToPage(${i})">${i + 1}</button>`;
       }
       
       html += '</div>';
       return html;
   }
   ```

### Phase 2: Smart Indexing (Week 2 - 4 hours)
**Goal:** Enable semantic search

1. **Add keyword indexing to law documents**
   - Auto-generate keywords from title + description
   - Store in array for Firestore array-contains queries
   - Index by category, year, type

2. **Create Firestore composite indexes**
   ```javascript
   // In Firestore console:
   // Create composite index on: (country, type, createdAt DESC)
   // Create composite index on: (country, category, status)
   //  Create composite index on: (country, keywords)
   ```

3. **Implement category-based browsing**
   - Pre-filter by topic instead of search
   - Faster than full-text search
   - Better UX for discovery

### Phase 3: Production Search (Week 3 - 8 hours)
**Goal:** Deploy full-text search

**Option A: Firestore Extensions (Minimal Cost)**
- Use Google Cloud Cloud Functions + Algolia extension
- Auto-index Firestore to Algolia on document changes
- Cost: $0-30/month for small datasets

**Option B: Custom Elasticsearch**
- Deploy Elastic on Cloud Run
- Index laws daily
- Cost: $50-200/month

**Recommended:** Option A with Algolia for MVP

---

## Firestore Query Examples

```javascript
// Get all bills in Committee stage
const bills = query(
    collection(db, 'laws'),
    where('stage', '==', 'Committee'),
    orderBy('createdAt', 'desc'),
    limit(50)
);

// Get laws by category
const healthLaws = query(
    collection(db, 'laws'),
    where('category', '==', 'health'),
    orderBy('votes.support', 'desc'),
    limit(50)
);

// Get community-voted laws
const popularLaws = query(
    collection(db, 'laws'),
    where('communityVotes', '>', 10),
    orderBy('communityVotes', 'desc')
);

// Search by keyword
const climateLaws = query(
    collection(db, 'laws'),
    where('keywords', 'array-contains', 'climate'),
    limit(50)
);
```

---

## UI Layout - Search + Filter

```html
<!-- Search Bar -->
<div class="laws-search-container">
    <input type="text" class="law-search-input" placeholder="Search laws..." />
    
    <!-- Filter UI -->
    <div class="law-filters">
        <button class="filter-chip active" onclick="filterByType('all')">All</button>
        <button class="filter-chip" onclick="filterByType('law')">Enacted Laws</button>
        <button class="filter-chip" onclick="filterByType('bill')">Bills</button>
    </div>
    
    <div class="law-categories">
        <button onclick="filterByCategory('health')">Healthcare</button>
        <button onclick="filterByCategory('economy')">Economy</button>
        <button onclick="filterByCategory('environment')">Environment</button>
        <button onclick="filterByCategory('housing')">Housing</button>
    </div>
</div>

<!-- Results + Pagination -->
<div id="lawsResults"></div>
<div class="law-pagination"></div>
```

---

## Data Migration Strategy

```javascript
// One-time migration (run in Cloud Function or local script)
async function migrateLawsData() {
    const laws = [
        // 100k+ law objects with new schema
    ];
    
    const batch = writeBatch(db);
    
    laws.forEach((law, idx) => {
        const docRef = doc(collection(db, 'laws'), law.id);
        batch.set(docRef, {
            ...law,
            keywords: generateKeywords(law),
            category: categorizelaw(law),
            type: classifyType(law)
        });
        
        if ((idx + 1) % 500 === 0) {
            await batch.commit();
            batch = writeBatch(db);
        }
    });
    
    await batch.commit();
}
```

---

## Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Load page | <500ms | Pagination + Client cache |
| Type-to-search | <100ms | Local filter + debounce |
| Full search | <1s | Firestore query |
| Complex search | <500ms | Elasticsearch |

---

## Next Steps

1. ✅ Implement pagination (2 hours)
2. ✅ Add category select dropdown (1 hour)
3. ✅ Add search box with client-side filtering (1 hour)
4. 🔄 Add Firestore indexes for fast queries (2 hours)
5. 🔄 Implement keyword-based search (4 hours)
6. 🔄 (Optional) Integrate Algolia / Elasticsearch (8 hours)

**Estimated MVP Time: 6 hours**
**Estimated Production Time: 3-4 days**
