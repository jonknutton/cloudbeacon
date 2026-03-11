# Manifesto System Template & Implementation

## Overview
The Manifesto tab now supports 8 different manifestos that users can view and compare:
1. **Community Manifesto** - Aggregated from community votes
2. **Personal Manifesto** - Based on user's voting history
3. **Labour Party** - Real UK party position
4. **Conservative Party** - Real UK party position
5. **Liberal Democrats** - Real UK party position
6. **Green Party** - Real UK party position
7. **Reform UK** - Real UK party position
8. **Plaid Cymru** - Welsh interests & devolution focus

---

## Manifesto Structure Template

Each manifesto follows this standardized JSON structure:

```javascript
{
  // Meta Information
  country: 'UK' | 'Wales',
  type: 'community' | 'personal' | 'labour' | 'conservative' | etc,
  party: 'Party Name' (for party manifestos) or null,
  leader: 'Leader Name',
  colour: '#HexCode' (for party branding),
  
  // Descriptive Text
  description: 'Primary manifesto tagline',
  keyline: 'Additional slogan or description',
  
  // User Data (for community/personal)
  totalVotes: number,
  contributors: number,
  billsVotedOn: number,
  
  // Core Values (for party manifestos)
  coreValues: [
    'Value 1',
    'Value 2',
    'Value 3'
  ],
  
  // Policies Array
  policies: [
    {
      area: 'health' | 'economy' | 'housing' | etc,
      title: 'Policy Title',
      icon: '📋' (emoji icon),
      position: 'Detailed policy description...',
      
      // For party manifestos
      keyCommitments: [
        'Commitment 1',
        'Commitment 2',
        'Commitment 3'
      ],
      
      // For community manifestos
      votes: {
        support: number,
        oppose: number,
        abstain: number
      },
      
      supportingBills: [
        {
          name: 'Bill Name',
          status: 'Enacted' | 'Under Consideration' | 'In Committee' | 'Pre-Legislative'
        }
      ]
    }
  ],
  
  // Priorities
  priorities: [
    {
      title: 'Priority Title',
      votes: number (for community)
    }
  ],
  
  // Stats
  stats: {
    totalVoters: number,
    totalVotes: number,
    generatedAt: 'ISO timestamp'
  }
}
```

---

## Policy Area Categories

Standardized policy areas across all manifestos:
- `health` - Healthcare, NHS, social care
- `economy` - Economic policy, taxation, business
- `environment` - Climate, sustainability, green energy
- `housing` - Housing, homelessness, affordability
- `education` - Education, schools, skills training
- `work` - Employment, workers rights, wages
- `transport` - Public transport, railways, infrastructure
- `agriculture` - Farming, food systems
- `crime` - Law and order, policing, justice
- `immigration` - Border control, migration, asylum
- `energy` - Energy policy, utilities
- `technology` - Digital, AI, cybersecurity
- `culture` - Arts, heritage, media
- `devolution` - Local governance, regionalism
- `welfare` - Social support, benefits
- `defence` - Armed forces, security

---

## Party Manifestos Summary

### Labour Party (Red #E4003B)
**Tagline:** "Change - Stop the chaos, restore hope, rebuild Britain"
**Leader:** Keir Starmer
**Key Focus:** Five National Missions - growth, clean energy, safety, opportunity, NHS reform
- 8 main policy areas
- Focus on 1.5m homes, living wage, NHS expansion
- Industrial strategy and £7.3bn National Wealth Fund

### Conservative Party (Blue #0087DC)
**Tagline:** "Stronger Economy, Stronger Country"
**Leader:** Kemi Badenoch
**Key Focus:** Fiscal responsibility, business growth, lower taxes
- 8 main policy areas
- £47bn savings plan, deregulation
- Cheap power plan, student support

### Liberal Democrats (Gold #FAA61A)
**Tagline:** "For a Fair Deal"
**Leader:** Ed Davey
**Key Focus:** Individual freedom, fairness, comprehensive policy coverage
- 8 main policy areas
- Civil liberties, LGBT+ rights, local empowerment
- Most comprehensive policy coverage

### Green Party (Green #6AB023)
**Tagline:** "Real hope. Real change."
**Leader:** Co-leaders
**Key Focus:** Environmental sustainability + social justice
- 8 main policy areas
- £40bn green economy investment, wealth tax
- 150k social homes annually

### Reform UK (Cyan #00A3E0)
**Tagline:** "Restore Britain's Power & Prosperity"
**Leader:** Nigel Farage
**Key Focus:** Sovereignty, borders, common sense
- 10 main policy areas
- Leave ECHR, immigration control
- Anti-Net Zero, pro-crypto, pro-business

### Plaid Cymru (Teal #005B54)
**Tagline:** "For Justice, For Ambition, For Wales"
**Leader:** Rhun ap Iorwerth
**Country:** Wales (not UK)
**Key Focus:** Welsh interests, fair funding, devolution
- 10 main policy areas
- Recover HS2 funding, Welsh language protection
- Path to Welsh independence

---

## UI Features

### Dropdown Selector (Top Right)
```html
<select id="manifestoSelector" onchange="switchManifesto(this.value)">
  <option value="community">Community Manifesto</option>
  <option value="personal">Your Personal Manifesto</option>
  <optgroup label="Political Parties">
    <option value="labour">Labour Party</option>
    <option value="conservative">Conservative Party</option>
    <option value="libdems">Liberal Democrats</option>
    <option value="green">Green Party</option>
    <option value="reform">Reform UK</option>
    <option value="plaid">Plaid Cymru</option>
  </optgroup>
</select>
```

### Display Elements

**Party Manifestos Show:**
- Party colour accent bar (left border)
- Party name and leader
- Core values tags
- Key commitments in highlighted sections
- Policy descriptions with icons

**Community Manifesto Shows:**
- Aggregated vote counts (support/oppose/abstain)
- Supporting bills and their status
- Contributor stats

**Personal Manifesto Shows:**
- User's voting history
- Personal policy preferences
- Simplified view

---

## Functions Available

### Load Functions
```javascript
// Load manifesto by type
loadManifestoByType(type)  // Returns promise

// Switch between manifestos (called by dropdown)
switchManifesto(type)

// Get manifesto options for dropdown
getManifestoOptions()  // Returns array of options
```

### Party-Specific Return Functions
```javascript
getCommunityManifesto()
getPersonalManifesto()
getLabourManifesto()
getConservativeManifesto()
getLibDemManifesto()
getGreenManifesto()
getReformManifesto()
getPlaidCymruManifesto()
```

---

## CSS Classes

`.manifesto-section` - Main policy section container
`.manifesto-position` - Policy description text
`.manifesto-stats` - Stats cards (votes/contributors/bills)
`.vote-stat` - Individual vote stat display

---

## How to Add a New Manifesto

1. Create a new function in `manifestoDataService.js`:
```javascript
function getMyPartyManifesto() {
    return {
        country: 'UK',
        type: 'myparty',
        party: 'My Party Name',
        leader: 'Leader Name',
        colour: '#HexCode',
        description: 'Tagline',
        // ... rest of structure
    };
}
```

2. Add case to `loadManifestoByType()`:
```javascript
case 'myparty':
    return getMyPartyManifesto();
```

3. Add option to HTML dropdown in `governance.html`

---

## Design Patterns Used

- **Color Branding:** Each party has unique colour scheme with light background variant
- **Icons:** Emoji indicators for quick scanning of policy areas
- **Hierarchical Display:** Main policies → key commitments → supporting bills
- **Compare Mode:** Users can quickly switch manifestos to compare positions
- **Stats Focus:** Top card showing aggregate vs individual manifestos

---

## Future Enhancements

- [ ] Side-by-side manifesto comparison view
- [ ] PDF export of manifestos
- [ ] Timeline view showing manifesto evolution
- [ ] Policy matching quiz ("Which manifesto matches you?")
- [ ] Vote history tracking for personal manifesto updates
- [ ] Historical manifesto versions
- [ ] Community manifesto editing (suggest policy changes)
- [ ] Policy difference highlighting between parties

---

**Implementation Date:** February 2026
**Status:** Complete - All 8 manifestos implemented and tested
**Next Step:** Add comparison/matching features
