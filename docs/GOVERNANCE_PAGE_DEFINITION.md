# CloudBeacon Governance Page - Tab Definitions

**Vision**: Give UK citizens knowledge of how their country is run and tools to define how it should be run.

**Scope**: Real-time legislative data, government structure, budget transparency, and community discourse.

**Countries**: UK implementation first, then US and others.

---

## TAB STRUCTURE (6 Tabs)

### 1. **MANIFESTO** ✅ (Real Data Available)
**Purpose**: Show political parties' commitments and how they align with current legislation

**Content**:
- Party comparison grid (Labour, Conservative, LibDem, Others)
- Key policy areas (NHS, Education, Economy, Environment, Defense, etc.)
- Manifesto promises vs. actual legislation passed
- Search/filter by policy area
- Side-by-side policy comparison

**Data Source**:
- standardizedManifestos.js (existing)
- manifestoDataService.js (existing)
- Party manifestos from official party websites

**User Actions**:
- View promises by party
- Filter by policy category
- Compare two parties side-by-side
- Track promise delivery (promised vs delivered)

**Future Features**:
- Vote: "Do you agree with this policy?"
- Comment on manifesto pledges

---

### 2. **LEADERS** ✅ (Real Data Available)
**Purpose**: Know who's in charge and their voting record

**Content**:
- Current government structure
  - Prime Minister + cabinet breakdown
  - MPs by constituency (find YOUR MP)
  - Lords (if relevant)
- MP profiles with:
  - Voting record on key legislation
  - Party affiliation
  - Constituency
  - Contact information
  - Attendance record

**Data Source**:
- members.csv (existing)
- import_mps.js (existing)
- Parliament API or scrape_parliament_members.js
- Voting records from UK Parliament website

**User Actions**:
- Search for local MP
- View voting history
- See how MP voted on specific laws
- Get contact info to reach out
- Compare voting patterns across parties

**Future Features**:
- Vote: "Do you approve of this MP's voting?"
- Message MPs directly through platform

---

### 3. **LAW** ✅ (Real Data Available)
**Purpose**: Understand current legislation and proposed changes

**Content**:
- Bill status tracking
  - Proposed bills (not yet passed)
  - New bills (recently passed)
  - Active laws
  - Repealed laws
- For each law:
  - Full text
  - Summary
  - Status (First Reading, Committee, Lords, Royal Assent, etc.)
  - Vote breakdown (how many MPs voted for/against)
  - Related manifesto promises
  - Affected government schemes
  - Implementation timeline
- Search & filter by:
  - Category (Health, Education, Defense, etc.)
  - Department responsible
  - Date range
  - Status

**Data Source**:
- Legislation.js (existing)
- RSS feeds (Parliament website)
- legislationDataService.js (existing)
- Bills.json or similar

**User Actions**:
- Read full law text
- See voting breakdown
- Track bill status
- Search for specific laws

**Future Features**:
- Vote: "Support/oppose this law?"
- Comment with questions/concerns
- Get alerts when bills change status
- See how relatives/constituencies voted
- Propose amendments

---

### 4. **BUDGET** ✅ (Definition in Progress)
**Purpose**: Show what government spends money on and what it costs citizens

**Content**(Currently Focusing on This):
- **National Overview**:
  - Total government spending (annual)
  - Total tax revenue
  - Budget surplus/deficit
  - UK population count
  - **Per-citizen breakdown**: Average tax paid, average government spending per person

- **Spending by Department** (pie/bar chart):
  - NHS/Health spending
  - Education
  - Defense/Military
  - Social Security/Welfare
  - Transport/Infrastructure
  - Environment
  - Other departments
  - Each with: Amount, % of budget, per-capita cost

- **Spending Trends** (line chart):
  - 5-year historical data
  - Year-over-year changes
  - Inflation-adjusted (real vs nominal)

- **Revenue Sources** (breakdown):
  - Income tax
  - VAT
  - Business tax
  - Excise duties
  - National Insurance
  - Other

- **Individual Impact** (if user logged in):
  - Estimated annual taxes paid
  - What that money funds (proportional breakdown)
  - Compare to national average

**Data Sources** (UK Government):
- **Office for National Statistics (ONS)**
  - Public Expenditure Statistical Analyses (PESA) - Annual
  - Budget releases and data downloads
  - URL: https://www.ons.gov.uk/government/statistics
  
- **HM Treasury**
  - Main Estimates (departmental spending plans)
  - Spending Rounds
  - Budget documents
  - URL: https://www.gov.uk/government/organisations/hm-treasury

- **House of Commons Library** (Research Briefings)
  - Budget summaries and analysis
  - Historical spending data
  - URL: https://commonslibrary.parliament.uk/

**Data Format**:
- CSV/Excel downloads from ONS
- JSON format if API available
- Parse and aggregate by department/category
- Calculate per-citizen metrics

**Status**:
- ⚠️ **Currently defining:** Data sources, exact format, aggregation approach
- 📊 **Next:** Find and download sample data from ONS
- 🔄 **Then:** Create budgetDataService.js to parse and cache data
- 🎨 **Finally:** Build charts and filters in UI

---

### 5. **PRIORITIES** ⚠️ (Definition Needed)
**Purpose**: What should government focus on?

**Content**:
- List of current government priorities/initiatives:
  - Infrastructure projects
  - Healthcare initiatives
  - Education programs
  - Economic targets
- For each priority:
  - Description
  - Timeline
  - Budget allocated
  - Progress so far
  - Related legislation
  - Expected outcomes

**Data Source**:
- Government strategic plans
- Parliamentary priorities
- Departmental objectives

**User Actions**:
- View all current priorities
- Filter by department/category
- See progress updates
- Track timeline

**Future Features**:
- Vote: "Is this priority important?"
- Propose new priorities
- Comment on progress

---

### 6. **SCHEMES** ✅ (Implemented with Mock Data)
**Purpose**: Show what government programs/benefits are available to citizens

**Status**: Tab created with 8 sample UK schemes implemented:
- Universal Credit
- Pension Credit  
- Child Benefit
- Housing Benefit
- Council Tax Support
- Free School Meals
- Apprenticeships
- NHS Help with Health Costs

**Current Features**:
- ✅ Grid card layout displaying schemes
- ✅ Click to expand eligibility/application info
- ✅ Live search filter by name/category
- ✅ Scheme card shows budget and beneficiary count

**Content**:
- List of active government schemes:
  - Healthcare programs
  - Education schemes
  - Welfare/benefits
  - Housing assistance
  - Employment programs
  - etc.
- For each scheme:
  - Full description
  - Who qualifies (eligibility criteria)
  - How to apply
  - Budget allocated
  - Number of beneficiaries
  - Related legislation
  - Contact/application links

**Data Source**:
- gov.uk schemes database
- Departmental program lists
- Benefits/welfare information
- Current: Mock data (8 schemes)
- Future: Real data from .gov.uk API

**User Actions**:
- ✅ Search schemes by name
- ✅ Browse by clicking cards
- ✅ View eligibility criteria
- View application links
- Filter by category (future)

**Future Features**:
- Eligibility checker (user input → matching schemes)
- Apply directly through platform
- Track application status
- Comment on scheme effectiveness
- Real data integration from gov.uk

---

## INFORMATION ARCHITECTURE

```
Governance Page
├── TAB 1: MANIFESTO
│   ├── Party Grid View
│   ├── Policy Categories
│   ├── Comparison Mode
│   └── Search
├── TAB 2: LEADERS
│   ├── Current Cabinet
│   ├── Find Your MP
│   ├── MP Profiles (voting record)
│   ├── Search MPs
│   └── Filter by Party/Constituency
├── TAB 3: LAW
│   ├── Bill Browser
│   ├── Status Filters (Proposed/New/Active/Repealed)
│   ├── Law Details (text, voting breakdown, timeline)
│   ├── Search & Filter
│   └── Related Content Links
├── TAB 4: BUDGET
│   ├── National Overview (chart)
│   ├── Department Breakdown (pie chart)
│   ├── 5-Year Trends (line chart)
│   ├── Revenue Sources (stacked bar)
│   ├── Personal Impact (if logged in)
│   └── Export/Download
├── TAB 5: PRIORITIES
│   ├── Priority List
│   ├── Timeline/Progress View
│   ├── Filter by Department
│   ├── Detailed Program Info
│   └── Related Laws
└── TAB 6: SCHEMES
    ├── Scheme Directory
    ├── Search/Browse
    ├── Eligibility Checker
    ├── Application Links
    └── Filter by Category
```

---

## DATA REQUIREMENTS

### Implemented ✅
- Manifesto data: standardizedManifestos.js
- Leaders data: members.csv + import_mps.js
- Legislation data: Legislation.js + legislationDataService.js

### To Be Sourced ⚠️
- **Budget data**: ONS + HM Treasury APIs (need to research API endpoints)
- **Priorities data**: Government strategic documents
- **Schemes data**: gov.uk database

### To Be Processed
- Parse and format budget CSV/JSON
- Create data service layer for budget (budgetDataService.js)
- Create data service layer for schemes (schemesDataService.js)
- Create data service layer for priorities (prioritiesDataService.js)

---

## NEXT STEPS

### Phase 1: Budget Definition (CURRENT FOCUS)
1. **Find UK government budget data** from ONS/HM Treasury
   - Research available APIs vs CSV downloads
   - Document data structure and fields
   - Identify most recent complete data year
   
2. **Define data aggregation approach**
   - How to categorize 30+ departments into main categories
   - Calculate per-capita metrics
   - Determine time period ranges (5-year historical data)

3. **Create budgetDataService.js**
   - Parse budget data (CSV or JSON)
   - Aggregate by department/category
   - Calculate derived metrics
   - Cache data with refresh timestamp

### Phase 2: Budget UI Implementation
1. Update governance.html with Budget tab content
2. Implement charts (pie chart for departments, line chart for trends)
3. Add filters (year selection, department breakdown)
4. Calculate and display per-citizen metrics

### Phase 3: Remaining Tabs (Post-Budget)
1. **Priorities Tab**
   - Currently empty, needs data source
   - Should show government strategic documents/goals
   
2. **Leaders Tab**
   - Already has data structure
   - Needs voting record integration

3. **Law Tab**
   - Already integrated with Parliament data
   - Needs enhancements

### Phase 4: Integration Features (Later)
1. Search/filter across all tabs
2. Data visualization improvements
3. Related content linking
4. Mobile responsiveness

---

## BUDGET DATA SOURCES (Research Needed)

### Primary Sources:
- **ONS Public Expenditure**: https://www.ons.gov.uk/government/statistics/public-expenditure-statistical-analyses-2023
- **HM Treasury Main Estimates**: https://www.gov.uk/government/collections/main-estimates
- **UK Budget**: https://www.gov.uk/government/publications/budget-documents-autumn-2023

### Potential APIs:
- UK Parliament API (has some budget data)
- Open Government Licence datasets
- CSV exports from gov.uk data portal

### Action Item:
**Research and document how to fetch UK government budget data programmatically.**

---

## LONG-TERM VISION (Post-MVP)

- **Voting system**: Citizens vote on every governance decision
- **Discourse**: Comments/questions on laws, budget, schemes
- **Proposals**: Users propose alternative budgets, new schemes
- **Tracking**: Personal tracking of how much legislation affects them
- **Notifications**: Alerts when relevant laws change status
- **Comparison**: Compare your preferred policies/budget to others
- **Export**: Generate personal governance reports

