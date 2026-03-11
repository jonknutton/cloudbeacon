# Governance Page - Current Status & Definition

## Current State Summary

### Files Exist:
- ✅ [governance.html](../governance.html) - Main HTML template (1050 lines)
- ✅ [src/features/governance/governance.html](../src/features/governance/governance.html) - Secondary copy
- ✅ [src/features/governance/governance.js](../src/features/governance/governance.js) - Logic (1084 lines)
- ✅ [project.css](../project.css) - Styling via project.css link

### Current Implementation Status:

#### ✅ IMPLEMENTED:
1. **Tab switching system** - Main tabs (Overview, Laws, Budget, etc.)
2. **Law subtabs** - Overview, Recent Laws, Budget breakdown, Actions
3. **Debug panel** - Ctrl+Shift+D toggle for technical info
4. **Collapsible sections** - For organized content display
5. **Basic layout** - Header with metadata badges, grid layout
6. **Firebase integration** - Connected to Firestore for data loading

#### ❓ NEEDS DEFINITION:
1. **Exact purpose & scope** - What is the governance workspace?
2. **Data model** - What data should be displayed/managed?
3. **User touchpoints** - What can users actually do here?
4. **Tab contents** - What goes in each tab specifically?
5. **Real vs. mock data** - Are we displaying real legislative data or placeholder content?
6. **Permissions model** - Who can access/modify what?
7. **Interaction patterns** - Filtering, searching, voting, tracking?

---

## Questions for Definition

### 1. **Core Purpose**
- Is this a legislative workspace for tracking parliament activities?
- Is it a project governance dashboard for civil engagement projects?
- Is it a hybrid - tracking both legislation AND community governance?

### 2. **Tab Requirements**
Currently structured for:
- **Overview** - Dashboard, summary statistics
- **Laws** - Parliamentary legislation with subtabs
- **Budget** - Financial information/breakdown
- **Team** - Member/participant management
- **Settings** - Configuration options

**Questions:**
- Are these the correct tabs for your vision?
- Should any tabs be renamed, added, or removed?
- What content belongs in each?

### 3. **Data Sources**
- Parliament RSS feeds (legislation sync) - **Currently used**
- Local Firestore database
- External APIs?
- User-generated content?

### 4. **Key Features**
Potential features to include:
- [ ] Track legislation life cycle
- [ ] Vote/comment on proposed laws
- [ ] Compare manifestos to legislation
- [ ] Budget allocation tracking
- [ ] Timeline/history of changes
- [ ] Export reports
- [ ] Real-time notifications
- [ ] Role-based access control

### 5. **Visual Design**
- Grid-based layout ✅ (exists)
- Card-based components ✅ (exists)
- Data visualization (charts/graphs)? ❓
- Timeline view? ❓
- Comparison tables? ❓

---

## Current File Structure

### governance.html Structure:
```
Header (Title, metadata badges)
├── Main Tabs (Overview, Laws, Budget, Team, Settings)
│   ├── Tab Panels (one per tab)
│   │   ├── Collapsible Sections
│   │   └── Content Areas
│   └── Law Subtabs (if in Laws tab)
│       ├── Overview
│       ├── Recent Laws
│       ├── Budget Breakdown
│       └── Actions
└── Debug Panel (hidden by default)
```

### governance.js Functions:
- `switchTab(tabName)` - Switch between main tabs
- `switchLawSubtab(subtabName)` - Switch law subtabs
- `loadGovernanceData()` - Initialize data
- `loadTabData(tabName)` - Load tab-specific data
- Various data formatting/rendering functions

---

## Next Steps

To properly define the governance page, we need to clarify:

1. **Primary use case** - What problem does this page solve?
2. **User personas** - Who uses this and what are their goals?
3. **MVP scope** - What's essential for launch vs. nice-to-have?
4. **Data flow** - How does data get in and out of the system?
5. **Success metrics** - How will we know this page is working well?

**Recommendation:** Meet to discuss these points, then I can:
1. Update page structure/layout if needed
2. Add/remove tabs as required
3. Populate with real or mock data
4. Implement interaction patterns
5. Connect to backend APIs/Firestore

---

## Technical Foundation Ready

All infrastructure is in place:
✅ HTML structure with tab system
✅ JavaScript with event handling
✅ CSS styling (via project.css)
✅ Firebase/Firestore integration
✅ Debug mode for development

**Just needs:** Clear requirements and content definition.
