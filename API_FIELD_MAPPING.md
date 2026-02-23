# Cloud Beacon Field Mapping Documentation

## Overview
This document defines how API data from various sources maps to Cloud Beacon project/legislation fields across different categories.

---

## Project Categories

### 1. **Tech** (💻)
**Purpose:** Software, hardware, open source projects  
**Team Required:** Yes  
**Planning Required:** Yes (Gantt, WBS, tasks)  
**Funding Required:** Yes  

**Data Fields:**
- `title` - Project name
- `description` - Problem statement
- `solution` - Proposed solution (technical approach)
- `category` - "Tech"
- `ownerId` - Creator/Sponsor ID
- `authorName` - Creator name
- `status` - Project status (Active, Paused, Completed, etc.)
- `committedCompletionDate` - Target completion date
- `headerPictureUrl` - Project header image (base64 or URL)
- `wbsDescription` - Work Breakdown Structure description

**Team Fields:**
- `team/{userId}` - Team member entries with `role`, `joinedAt`, `responsibility`

**Funding Fields:**
- `budget` - Total budget allocated
- `raised` - Amount raised so far
- `fundingModel` - "Grant", "Donation", "Crowdfunding", etc.

---

### 2. **Civil** (🏗️)
**Purpose:** Construction, infrastructure, buildings  
**Team Required:** Yes  
**Planning Required:** Yes (Gantt, site planning, phases)  
**Funding Required:** Yes  

**Data Fields:**
- `title` - Project name
- `description` - Project scope/problem
- `solution` - Proposed design/solution
- `category` - "Civil"
- `location` - Physical location coordinates/address
- `area` - Project area (hectares, m², etc.)
- `status` - Project status
- `committedCompletionDate` - Expected completion date
- `headerPictureUrl` - Site image or architectural render
- `designDocuments` - URL/reference to design files

**Team Fields:**
- Similar to Tech, but may include specialized roles (Architect, Engineer, Foreman, etc.)

**Funding Fields:**
- `budget` - Total project cost
- `raised` - Funds secured
- `fundingModel` - Government, Private, PPP, etc.

---

### 3. **Community** (🤝)
**Purpose:** Campaigns, fundraising, people-focused initiatives  
**Team Required:** Yes (volunteers/coordinators)  
**Planning Required:** Optional (milestone-based)  
**Funding Required:** Often (donations, grants)  

**Data Fields:**
- `title` - Campaign/initiative name
- `description` - What problem does it address
- `solution` - How will it help the community
- `category` - "Community"
- `reach` - Target audience/beneficiaries
- `status` - Campaign status
- `committedCompletionDate` - Campaign end date
- `headerPictureUrl` - Campaign image
- `volunteerSignupUrl` - URL to join/volunteer

**Team Fields:**
- Roles: Organizer, Volunteer, Advisor, Partner

**Funding Fields:**
- `targetRaised` - Fundraising goal
- `raised` - Amount collected
- `fundingModel` - "Fundraising", "Donations", "Grants"

---

### 4. **Law** (⚖️) — LEGISLATION
**Purpose:** Policy, legislation, legal reform  
**Team Required:** NO  
**Planning Required:** NO  
**Funding Required:** NO  
**Special Features:** Petition tracking, parliamentary status, sponsorship  

**Core Fields (from Parliament API):**
- `type` - "legislation" (hardcoded)
- `title` - Bill title (e.g., "Online Safety Bill")
- `description` - Bill summary/abstract
- `category` - Bill category (e.g., "Government Bill", "Private Member's Bill", "Lords Bill")
- `parliamentBillId` - UK Parliament Bill ID (numeric)
- `parliamentUrl` - Link to parliament.uk bill page
- `stage` - Current parliamentary stage:
  - "1st Reading", "2nd Reading", "Committee", "Report", "3rd Reading", "Lords", "Royal Assent", etc.
- `lastUpdate` - When bill was last updated
- `authorName` - "UK Parliament" (for API-created bills)
- `authorId` - "parliament"

**Extended Fields (for tracking/research):**
- `governingBody` - "UK Parliament", "Scottish Parliament", "Welsh Senedd", etc.
- `country` - Country code ("GB", "US", "CA", etc.)
- `billUrl` - Full parliament.uk URL
- `sponsors` - Array of sponsoring MPs
  - `sponsorId` - MP ID
  - `sponsorName` - MP name
  - `sponsorRole` - Position (e.g., "Secretary of State")
- `summary` - Full bill summary (from parliament API)
- `divisions` - Vote records
  - `date` - Vote date
  - `ayes` - Number voting yes
  - `noes` - Number voting no
  - `abstentions` - Number abstaining

**Petition Fields (for linking):**
- `relatedPetitions` - Array of petition references
  - `petitionId` - Petition platform ID (e.g., UK Parliament Petitions number)
  - `petitionSource` - Platform ("UK Parliament Petitions", "Petition.io", "Change.org", etc.)
  - `petitionTitle` - Petition title
  - `petitionUrl` - Link to petition
  - `signatureCount` - How many people signed
  - `status` - "Open", "Closed", "Awaiting Response", "Response Published"
  - `linkedAt` - When linked
  - `linkedBy` - User ID who linked it

**Cloud Beacon Community Tracking:**
- `votes` - Upvote/downvote count (from Cloud Beacon users)
- `followers` - Array of user IDs following this bill

---

## API Data Sources

### UK Parliament Bills API
**Endpoint:** `https://bills-api.parliament.uk/api`  
**Current Integration:** RSS feed in `Legislation.js`

**Mapping:**
```
API Field → Cloud Beacon Field
- item.title → title
- item.description → description
- item.category → category (e.g., "Government Bill")
- item.link (extract bill ID) → parliamentBillId
- item.link → parliamentUrl
- item.pubDate → lastUpdate
├─ "Bills" → authorName
├─"parliament" → authorId
```

**Future Extensions:**
- Fetch detailed bill data (sponsors, divisions, full summary)
- Poll for stage changes
- Fetch full bill text

### Other Potential Sources

#### Change.org Petitions API
**Authentication:** API key required  
**Data:**
- Petition ID, title, signature count, status, URL
- Maps to `relatedPetitions[].petitionSource = "Change.org"`

#### UK Parliament Petitions API
**Endpoint:** `https://petition.parliament.uk/api`  
**Data:**
- Petition ID, title, signature count, status
- Maps to `relatedPetitions[].petitionSource = "UK Parliament Petitions"`

#### Open Congress API (US)
**Endpoint:** `https://beta.congress.gov/api`  
**Data:**
- Bill ID, title, summary, sponsor info, stage
- Maps to Law projects for US legislation

---

## Display Rules by Category

### Tech, Civil, Community
- **Tabs shown:** Overview, Team, Plan, Fund, Files, Updates, Chat, Change
- **Overview includes:** Title, Description, Solution, Status, Target Date, Team section, Funding section
- **Team tab:** Visible and editable (sponsors/managers)
- **Plan tab:** Full WBS, Gantt, tasks
- **Fund tab:** Budget tracking, fundraising

### Law (Legislation)
- **Tabs shown:** Overview, Files, Updates, Chat, Change (NOT Team, Plan, Fund)
- **Overview includes:**
  - Title, Category, Stage
  - Bill summary/description
  - Sponsor(s) and role
  - Last update date
  - Parliament link
  - Related petitions section
  - Community vote/follow stats
- **Petition section:** Find, link, view signatures for related petitions
- **Files tab:** Parliamentary documents
- **Updates tab:** Bill progress updates, stage changes
- **Chat tab:** Community discussion

---

## Future Enhancements

### 1. Petition Linking Workflow
- Search APIs for related petitions
- One-click linking to bills
- Track petition status changes
- Show signature progress

### 2. Bill Comparison
- Compare multiple bills on same topic
- Track how bills evolve

### 3. Sponsor Tracking
- Track all bills by specific MP
- MP profile integration

### 4. Legislative Intelligence
- Timeline view of bill progress
- Vote analysis and breakdowns
- Amendment tracking

### 5. Multi-Country Support
- Expand beyond UK Parliament
- Support US Congress, EU Parliament, etc.
- Flexible staging based on governing body

---

## Implementation Checklist

- [x] Hide Team, Plan, Fund tabs for legislation
- [x] Show only relevant sections in Overview for legislation
- [ ] Add Petitions UI component to Overview (Law category)
- [ ] Implement petition search functionality
- [ ] Implement petition linking (petition → bill)
- [ ] Add petition signature tracking
- [ ] Extend API sync to fetch bill sponsors and divisions
- [ ] Add bill comparison view
- [ ] Add sponsor/MP tracking
- [ ] Add support for other country legislatures
