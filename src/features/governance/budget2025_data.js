/**
 * Budget 2025 Real UK Government Data
 * Extracted from: https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html
 * All figures in £ billions (current prices) unless otherwise noted
 * 
 * METHODOLOGY NOTE:
 * This breakdown allocates government spending against personal taxes. However:
 * - Government revenue comes from MULTIPLE sources: income tax, NI, VAT, corporation tax, excise duty, capital gains, inheritance tax, and borrowing
 * - This module focuses primarily on personal tax contributions (income tax + NI ~£430B) and estimates VAT/duties
 * - Total Managed Expenditure (£1.369T) includes Resource DEL + Capital DEL + Annually Managed Expenditure (AME)
 * - AME (largest portion) covers welfare payments, pensions, debt interest, and other transfer payments
 * - The allocation percentages below represent where government SPENDS not where personal tax SPECIFICALLY goes
 * - This is an educational approximation showing tax-to-service connections, not pixel-perfect accounting
 * - Reality is more complex and interconnected than this linear model suggests
 */

export const budget2025 = {
  // Resource Departmental Expenditure Limits (DEL) - Day-to-day spending
  resourceSpending: {
    2024_25: { // Outturn
      'Health and Social Care': 193.2,
      'Education': 89.2,
      'Defence': 37.5,
      'Work and Pensions': 9.0,
      'Home Office': 18.3,
      'Justice': 11.1,
      'Transport': 7.9,
      'Environment and Rural Affairs': 5.0,
      'HM Revenue and Customs': 5.1,
      'Foreign, Commonwealth and Development': 8.3,
      'Business and Trade': 1.5,
      'Science, Innovation and Technology': 0.5,
      'Energy Security and Net Zero': 1.4,
      'Culture, Media and Sport': 1.5,
    },
    2025_26: {
      'Health and Social Care': 203.4,
      'Education': 95.2,
      'Defence': 38.6,
      'Work and Pensions': 10.3,
      'Home Office': 19.6,
      'Justice': 12.0,
      'Transport': 8.1,
      'Environment and Rural Affairs': 4.9,
      'HM Revenue and Customs': 6.0,
      'Foreign, Commonwealth and Development': 8.0,
      'Business and Trade': 2.0,
      'Science, Innovation and Technology': 0.7,
      'Energy Security and Net Zero': 1.9,
      'Culture, Media and Sport': 1.6,
    },
    2026_27: {
      'Health and Social Care': 211.4,
      'Education': 98.3,
      'Defence': 39.6,
      'Work and Pensions': 11.4,
      'Home Office': 20.9,
      'Justice': 12.6,
      'Transport': 8.3,
      'Environment and Rural Affairs': 4.8,
      'HM Revenue and Customs': 6.7,
      'Foreign, Commonwealth and Development': 6.6,
      'Business and Trade': 1.9,
      'Science, Innovation and Technology': 0.8,
      'Energy Security and Net Zero': 2.0,
      'Culture, Media and Sport': 1.6,
    },
    2027_28: {
      'Health and Social Care': 221.3,
      'Education': 100.2,
      'Defence': 41.0,
      'Work and Pensions': 11.7,
      'Home Office': 20.4,
      'Justice': 12.9,
      'Transport': 7.8,
      'Environment and Rural Affairs': 4.8,
      'HM Revenue and Customs': 6.8,
      'Foreign, Commonwealth and Development': 7.0,
      'Business and Trade': 1.8,
      'Science, Innovation and Technology': 0.8,
      'Energy Security and Net Zero': 2.0,
      'Culture, Media and Sport': 1.6,
    },
    2028_29: {
      'Health and Social Care': 231.2,
      'Education': 101.0,
      'Defence': 42.0,
      'Work and Pensions': 11.6,
      'Home Office': 20.5,
      'Justice': 13.2,
      'Transport': 7.6,
      'Environment and Rural Affairs': 4.7,
      'HM Revenue and Customs': 6.4,
      'Foreign, Commonwealth and Development': 7.1,
      'Business and Trade': 1.8,
      'Science, Innovation and Technology': 0.7,
      'Energy Security and Net Zero': 1.7,
      'Culture, Media and Sport': 2.0,
    }
  },

  // Capital Departmental Expenditure Limits (CDEL) - Investment spending
  capitalSpending: {
    2024_25: {
      'Health and Social Care': 11.5,
      'Education': 5.6,
      'Defence': 22.7,
      'Transport': 20.5,
      'Science, Innovation and Technology': 13.2,
      'Energy Security and Net Zero': 5.3,
      'Environment and Rural Affairs': 2.3,
      'Home Office': 1.7,
      'Justice': 1.5,
    },
    2025_26: {
      'Health and Social Care': 13.6,
      'Education': 6.8,
      'Defence': 23.1,
      'Transport': 21.6,
      'Science, Innovation and Technology': 14.7,
      'Energy Security and Net Zero': 11.4,
      'Environment and Rural Affairs': 2.7,
      'Home Office': 1.6,
      'Justice': 2.0,
    },
    2026_27: {
      'Health and Social Care': 14.0,
      'Education': 8.3,
      'Defence': 25.9,
      'Transport': 23.0,
      'Science, Innovation and Technology': 15.1,
      'Energy Security and Net Zero': 8.4,
      'Environment and Rural Affairs': 2.8,
      'Home Office': 1.7,
      'Justice': 2.3,
    },
    2027_28: {
      'Health and Social Care': 13.8,
      'Education': 7.7,
      'Defence': 30.0,
      'Transport': 24.8,
      'Science, Innovation and Technology': 15.7,
      'Energy Security and Net Zero': 9.7,
      'Environment and Rural Affairs': 2.8,
      'Home Office': 1.7,
      'Justice': 2.3,
    },
    2028_29: {
      'Health and Social Care': 14.8,
      'Education': 7.7,
      'Defence': 31.5,
      'Transport': 22.7,
      'Science, Innovation and Technology': 15.8,
      'Energy Security and Net Zero': 11.5,
      'Environment and Rural Affairs': 2.8,
      'Home Office': 1.7,
      'Justice': 2.3,
    },
    2029_30: {
      'Health and Social Care': 15.2,
      'Education': 7.7,
      'Defence': 33.2,
      'Transport': 24.4,
      'Science, Innovation and Technology': 16.2,
      'Energy Security and Net Zero': 11.7,
      'Environment and Rural Affairs': 2.8,
      'Home Office': 1.7,
      'Justice': 2.0,
    }
  },

  // Major Policy Decisions with fiscal impact (£ millions, negative = cost to government)
  policyDecisions: [
    { id: 1, name: 'Universal Credit Child Element: Remove two child limit', category: 'welfare', costType: 'spend', 2025_26: 0, 2026_27: -2365, 2027_28: -2590, 2028_29: -2815, 2029_30: -3095, 2030_31: -3235 },
    { id: 6, name: 'Renewables Obligation: Fund via Exchequer', category: 'energy', costType: 'spend', 2025_26: 0, 2026_27: -2580, 2027_28: -2100, 2028_29: -2195, 2029_30: 0, 2030_31: 0 },
    { id: 4, name: 'Rail Fares: Freeze fares in England', category: 'transport', costType: 'spend', 2025_26: 0, 2026_27: -145, 2027_28: -150, 2028_29: -155, 2029_30: -160, 2030_31: -165 },
    { id: 5, name: 'NHS Prescription Charges: Freeze for one year', category: 'health', costType: 'spend', 2025_26: 0, 2026_27: -15, 2027_28: -15, 2028_29: -15, 2029_30: -15, 2030_31: -15 },
    { id: 13, name: 'Health Benefits: Improve operations (assessments & reviews)', category: 'welfare', costType: 'spend', 2025_26: 0, 2026_27: 85, 2027_28: 310, 2028_29: 520, 2029_30: 580, 2030_31: 455 },
    { id: 50, name: 'Dividend Tax: Increase rates by 2ppts', category: 'tax', costType: 'tax', 2025_26: 0, 2026_27: 280, 2027_28: 985, 2028_29: 1160, 2029_30: 1325, 2030_31: 1390 },
    { id: 49, name: 'Property Income Tax: New rates (22%, 42%, 47%)', category: 'tax', costType: 'tax', 2025_26: 0, 2026_27: 0, 2027_28: 5, 2028_29: 590, 2029_30: 435, 2030_31: 445 },
    { id: 46, name: 'Personal Tax: Maintain thresholds until April 2031', category: 'tax', costType: 'tax', 2025_26: 0, 2026_27: 0, 2027_28: -25, 2028_29: 3365, 2029_30: 7780, 2030_31: 12435 },
    { id: 60, name: 'Gambling Duty: Increase Remote Gaming Duty to 40%', category: 'tax', costType: 'tax', 2025_26: 0, 2026_27: 810, 2027_28: 1065, 2028_29: 1100, 2029_30: 1135, 2030_31: 1155 },
    { id: 59, name: 'HMRC: Close tax gap measures', category: 'tax', costType: 'tax', 2025_26: 75, 2026_27: 435, 2027_28: 695, 2028_29: 1250, 2029_30: 2415, 2030_31: 2590 },
  ],

  // Comprehensive Tax Revenue Forecasts (£ billions, current prices)
  // Source: OBR November 2025 Economic and Fiscal Outlook, Table A.5
  taxRevenue: {
    2024_25: {
      'Income Tax': 305.9,
      'National Insurance': 171.4,
      'Value Added Tax': 173.3,
      'Corporation Tax': 94.9,
      'Capital Gains Tax': 13.7,
      'Inheritance Tax': 8.3,
      'Fuel Duty': 24.4,
      'Business Rates': 32.1,
      'Stamp Duty': 19.5,
      'Excise Duties': 20.4,
      'Environmental Levies': 10.5,
      'Council Tax': 47.4,
      'Other': 75.3,
      'Total': 1015,
    },
    2025_26: {
      'Income Tax': 305.9,
      'National Insurance': 171.4,
      'Value Added Tax': 173.3,
      'Corporation Tax': 94.9,
      'Capital Gains Tax': 13.7,
      'Inheritance Tax': 8.3,
      'Fuel Duty': 24.4,
      'Business Rates': 32.1,
      'Stamp Duty': 19.5,
      'Excise Duties': 20.4,
      'Environmental Levies': 10.5,
      'Council Tax': 47.4,
      'Other': 75.3,
      'Total': 1015,
    },
    2026_27: {
      'Income Tax': 329.0,
      'National Insurance': 205.4,
      'Value Added Tax': 179.6,
      'Corporation Tax': 98.8,
      'Capital Gains Tax': 20.3,
      'Inheritance Tax': 8.7,
      'Fuel Duty': 24.0,
      'Business Rates': 33.6,
      'Stamp Duty': 20.8,
      'Excise Duties': 19.9,
      'Environmental Levies': 14.0,
      'Council Tax': 50.9,
      'Other': 96.8,
      'Total': 1103,
    },
    2027_28: {
      'Income Tax': 358.9,
      'National Insurance': 213.7,
      'Value Added Tax': 188.9,
      'Corporation Tax': 104.2,
      'Capital Gains Tax': 19.8,
      'Inheritance Tax': 9.5,
      'Fuel Duty': 24.2,
      'Business Rates': 37.1,
      'Stamp Duty': 23.8,
      'Excise Duties': 20.1,
      'Environmental Levies': 15.9,
      'Council Tax': 53.6,
      'Other': 101.7,
      'Total': 1172,
    },
    2028_29: {
      'Income Tax': 383.0,
      'National Insurance': 220.7,
      'Value Added Tax': 198.0,
      'Corporation Tax': 110.0,
      'Capital Gains Tax': 21.8,
      'Inheritance Tax': 11.1,
      'Fuel Duty': 26.2,
      'Business Rates': 38.0,
      'Stamp Duty': 25.4,
      'Excise Duties': 20.5,
      'Environmental Levies': 18.0,
      'Council Tax': 56.6,
      'Other': 106.4,
      'Total': 1233,
    },
    2029_30: {
      'Income Tax': 393.4,
      'National Insurance': 228.2,
      'Value Added Tax': 205.7,
      'Corporation Tax': 114.1,
      'Capital Gains Tax': 24.8,
      'Inheritance Tax': 12.6,
      'Fuel Duty': 26.3,
      'Business Rates': 38.8,
      'Stamp Duty': 27.1,
      'Excise Duties': 20.7,
      'Environmental Levies': 16.0,
      'Council Tax': 60.1,
      'Other': 110.8,
      'Total': 1279,
    },
    2030_31: {
      'Income Tax': 410.9,
      'National Insurance': 239.2,
      'Value Added Tax': 214.8,
      'Corporation Tax': 117.8,
      'Capital Gains Tax': 27.3,
      'Inheritance Tax': 13.5,
      'Fuel Duty': 26.0,
      'Business Rates': 41.9,
      'Stamp Duty': 28.3,
      'Excise Duties': 21.1,
      'Environmental Levies': 18.6,
      'Council Tax': 63.3,
      'Other': 116.0,
      'Total': 1337,
    },
    2031_32: {
      'Income Tax': 426.9,
      'National Insurance': 247.2,
      'Value Added Tax': 224.0,
      'Corporation Tax': 122.8,
      'Capital Gains Tax': 29.8,
      'Inheritance Tax': 14.5,
      'Fuel Duty': 25.3,
      'Business Rates': 42.0,
      'Stamp Duty': 29.2,
      'Excise Duties': 21.4,
      'Environmental Levies': 18.6,
      'Council Tax': 66.7,
      'Other': 118.8,
      'Total': 1388,
    },
  },

  // Non-Tax Revenue and Other Government Income
  nonTaxRevenue: {
    2024_25: {
      'Interest and Dividends': 41.0,
      'Gross Operating Surplus': 78.3,
      'Other Receipts': 2.5,
      'Total Non-Tax': 121.8,
    },
    2025_26: {
      'Interest and Dividends': 42.8,
      'Gross Operating Surplus': 78.3,
      'Other Receipts': 2.5,
      'Total Non-Tax': 123.6,
    },
    2026_27: {
      'Interest and Dividends': 42.5,
      'Gross Operating Surplus': 82.8,
      'Other Receipts': 2.9,
      'Total Non-Tax': 128.2,
    },
    2027_28: {
      'Interest and Dividends': 43.7,
      'Gross Operating Surplus': 85.3,
      'Other Receipts': 2.9,
      'Total Non-Tax': 131.9,
    },
    2028_29: {
      'Interest and Dividends': 45.6,
      'Gross Operating Surplus': 88.4,
      'Other Receipts': 3.0,
      'Total Non-Tax': 137.0,
    },
    2029_30: {
      'Interest and Dividends': 46.6,
      'Gross Operating Surplus': 91.5,
      'Other Receipts': 3.2,
      'Total Non-Tax': 141.3,
    },
    2030_31: {
      'Interest and Dividends': 48.6,
      'Gross Operating Surplus': 94.2,
      'Other Receipts': 3.2,
      'Total Non-Tax': 146.0,
    },
  },

  // Total Public Sector Receipts (Tax + Non-Tax Revenue)
  totalReceipts: {
    2024_25: 1136.8,
    2025_26: 1138.6,
    2026_27: 1231.2,
    2027_28: 1303.9,
    2028_29: 1370.0,
    2029_30: 1420.3,
    2030_31: 1483.0,
  },

  // Economic Forecasts (% annual growth)
  economicOutlook: {
    gdpGrowth: { 2025: 1.5, 2026: 1.3, 2027: 1.5, 2028: 1.5, 2029: 1.5, 2030: 1.6 },
    nominalGdpGrowth: { 2025: 4.9, 2026: 4.0, 2027: 4.0, 2028: 3.6, 2029: 3.4, 2030: 3.4 },
    inflation: { 2025: 3.5, 2026: 2.5, 2027: 2.0, 2028: 2.0, 2029: 2.0, 2030: 2.0 },
    unemployment: { 2025: 4.5, 2026: 5.0, 2027: 4.7, 2028: 4.4, 2029: 4.2, 2030: 4.1 },
    employment_millions: { 2025: 34.2, 2026: 34.2, 2027: 34.4, 2028: 34.7, 2029: 34.9, 2030: 35.2 },
    bankRate: { 2025: 4.9, 2026: 4.1, 2027: 3.6, 2028: 3.7, 2029: 3.8, 2030: 3.9 },
    gilYields: { 2025: 4.3, 2026: 4.6, 2027: 4.7, 2028: 4.9, 2029: 5.2, 2030: 5.4 },
  },

  // Financing and Borrowing Detail
  borrowingDetail: {
    2025_26: {
      'CGNCR (Central Government Net Cash Requirement)': 149.2,
      'Gilt Redemptions': 168.2,
      'Gross Financing Requirement': 329.0,
      'DMO Net Financing Requirement': 314.7,
      'Gilt Sales by Type': {
        'Short Conventional': 133.5,
        'Medium Conventional': 102.1,
        'Long Conventional': 28.7,
        'Index-Linked': 31.1,
        'Other': 8.3,
        'Total': 303.7,
      },
      'Treasury Bills': 11.0,
      'NS&I Net Financing': 13.0,
      'Total Financing': 327.7,
    },
    2026_27: {
      'CGNCR': 134.0,
      'Gilt Redemptions': 141.3,
      'Gross Financing Requirement': 275.3,
      'PSNB': 112.1,
    },
    2027_28: {
      'CGNCR': 147.0,
      'Gilt Redemptions': 161.4,
      'Gross Financing Requirement': 308.4,
      'PSNB': 98.5,
    },
    2028_29: {
      'CGNCR': 138.5,
      'Gilt Redemptions': 148.2,
      'Gross Financing Requirement': 286.7,
      'PSNB': 86.9,
    },
    2029_30: {
      'CGNCR': 95.2,
      'Gilt Redemptions': 134.3,
      'Gross Financing Requirement': 229.5,
      'PSNB': 67.9,
    },
    2030_31: {
      'CGNCR': 112.9,
      'Gilt Redemptions': 90.8,
      'Gross Financing Requirement': 203.8,
      'PSNB': 67.2,
    },
  },

  // Public Sector Borrowing (Public Sector Net Borrowing - PSNB)
  publicSectorBorrowing: {
    2025_26: 138.3,
    2026_27: 112.1,
    2027_28: 98.5,
    2028_29: 86.9,
    2029_30: 67.9,
    2030_31: 67.2,
  },

  // Public Sector Debt
  publicSectorDebt: {
    // % of GDP
    2025_26: 95.3,
    2026_27: 96.3,
    2027_28: 97.0,
    2028_29: 96.8,
    2029_30: 96.1,
  },

  // Total Managed Expenditure (TME)
  totalManagedExpenditure: {
    2024_25: 1288.1,
    2025_26: 1369.8,
    2026_27: 1415.9,
    2027_28: 1468.7,
    2028_29: 1507.6,
    2029_30: 1551.2,
    2030_31: 1606.6,
  },

  // Service Categories - Mapped to real departmental spending
  serviceAllocation: {
    2026_27: {
      'Health & Social Care': {
        percentage: 18.2,
        amount: 211.4,
        description: 'NHS, GP services, hospital care, social care',
        department: 'Department of Health and Social Care'
      },
      'Education': {
        percentage: 8.5,
        amount: 98.3,
        description: 'School funding, universities, vocational training',
        department: 'Department for Education'
      },
      'Defence': {
        percentage: 3.4,
        amount: 39.6,
        description: 'Armed forces, military infrastructure, veterans',
        department: 'Ministry of Defence'
      },
      'Social Protection & Welfare': {
        percentage: 9.8,
        amount: 11.4,
        description: 'Universal Credit, pensions, disability support',
        department: 'Department for Work and Pensions'
      },
      'Justice': {
        percentage: 1.1,
        amount: 12.6,
        description: 'Courts, prisons, police, legal services',
        department: 'Ministry of Justice & Home Office'
      },
      'Transport': {
        percentage: 0.7,
        amount: 8.3,
        description: 'Roads, rail, buses, traffic management',
        department: 'Department for Transport'
      },
      'Environment': {
        percentage: 0.4,
        amount: 4.8,
        description: 'Environmental protection, land management',
        department: 'Department for Environment, Food and Rural Affairs'
      },
      'Business & Economy': {
        percentage: 0.2,
        amount: 2.7,
        description: 'Business support, innovation, trade',
        department: 'Department for Business and Trade'
      },
    }
  },

  // Scheme Breakdown - Real UK Schemes by Spending Department
  // Mapped to 14 Government Departments from Budget 2025
  realSchemes: {
    'Health and Social Care': [
      { name: 'GP Services', amount: 12.5, description: 'Primary care, GP appointments, prescriptions' },
      { name: 'Hospital Care', amount: 25.0, description: 'Hospital admissions, surgery, A&E' },
      { name: 'Mental Health Services', amount: 8.5, description: 'Mental health treatment, counselling' },
      { name: 'Dental Care (NHS)', amount: 3.5, description: 'NHS dental treatment' },
      { name: 'Optical Services', amount: 1.0, description: 'NHS eye tests and support' },
      { name: 'Public Health', amount: 4.0, description: 'Health campaigns, disease prevention' },
      { name: 'Other Schemes & Infrastructure', amount: 148.9, description: 'NHS staff costs, hospital operations, social care, medicines, medical supplies' },
    ],
    
    'Education': [
      { name: 'School Funding (State Schools)', amount: 35.0, description: 'Primary and secondary school funding' },
      { name: 'University Grants', amount: 15.0, description: 'University education funding (grants)' },
      { name: 'Student Loans Administration', amount: 8.9, description: 'Managing student loan book' },
      { name: 'Further Education', amount: 8.0, description: 'Colleges, vocational training' },
      { name: 'School Meals & Support', amount: 2.5, description: 'Free school meals, pupil premium' },
      { name: 'Other Schemes & Infrastructure', amount: 25.8, description: 'School management, teacher pensions, educational support services, facilities' },
    ],

    'Defence': [
      { name: 'Armed Forces Personnel', amount: 10.5, description: 'Military personnel costs and training' },
      { name: 'Military Equipment', amount: 12.0, description: 'Weapons, vehicles, technology' },
      { name: 'Infrastructure', amount: 8.0, description: 'Military bases and facilities' },
      { name: 'Veterans Support', amount: 1.2, description: 'Support for ex-service personnel' },
      { name: 'Other Schemes & Infrastructure', amount: 6.9, description: 'Operations, maintenance, reserves, and strategic capabilities' },
    ],

    'Work and Pensions': [
      { name: 'Department Operations', amount: 8.0, description: 'Department administration and services' },
      { name: 'Employment Support', amount: 2.3, description: 'Job centres, training support, work incentive programmes' },
      { name: 'Other Schemes & Infrastructure', amount: 0.0, description: 'Note: Most welfare spending (Universal Credit, State Pension, DLA, Housing Benefit, Child Benefit) is classified as Annually Managed Expenditure (AME), not departmental resource spending' },
    ],

    'Home Office': [
      { name: 'Border Force & Immigration', amount: 2.5, description: 'Border control and immigration enforcement' },
      { name: 'Passport & ID Services', amount: 1.2, description: 'Issuing passports and national ID' },
      { name: 'Emergency Services Support', amount: 1.8, description: 'Supporting emergency response coordination' },
      { name: 'Counterterrorism', amount: 1.5, description: 'Counterterrorism and security operations' },
      { name: 'Other Schemes & Infrastructure', amount: 12.6, description: 'System operations, buildings, civil contingencies, law enforcement support' },
    ],

    'Justice': [
      { name: 'Police Forces', amount: 4.5, description: 'Policing and crime prevention' },
      { name: 'Prisons & Probation', amount: 3.2, description: 'Managing prisons and rehabilitation' },
      { name: 'Courts', amount: 1.8, description: 'Civil and criminal courts' },
      { name: 'Fire & Rescue', amount: 2.0, description: 'Fire services and emergency response' },
      { name: 'Other Schemes & Infrastructure', amount: 0.5, description: 'Judicial support, legal services, system administration' },
    ],

    'Transport': [
      { name: 'Road Maintenance', amount: 2.5, description: 'Maintaining roads and highways' },
      { name: 'Bus Subsidies', amount: 1.8, description: 'Supporting local bus services' },
      { name: 'Rail Support', amount: 1.5, description: 'National rail infrastructure support' },
      { name: 'Concessionary Travel', amount: 0.8, description: 'Free travel for older people and disabled' },
      { name: 'Other Schemes & Infrastructure', amount: 1.5, description: 'Transport strategy, traffic management, smart mobility, aviation support' },
    ],

    'Environment and Rural Affairs': [
      { name: 'Environmental Protection', amount: 1.5, description: 'Conservation and environmental work' },
      { name: 'Agricultural Support', amount: 1.8, description: 'Farm subsidies and rural support' },
      { name: 'Tree Planting & Forestry', amount: 0.8, description: 'Environmental land management' },
      { name: 'Water Management', amount: 0.7, description: 'Flood defence and water resources' },
      { name: 'Other Schemes & Infrastructure', amount: 0.1, description: 'Department operations and support' },
    ],

    'HM Revenue and Customs': [
      { name: 'Tax Administration', amount: 2.8, description: 'Processing tax returns and payments' },
      { name: 'Customs & Excise', amount: 1.2, description: 'Border customs and duty collection' },
      { name: 'Fraud Investigation', amount: 1.8, description: 'Identifying and investigating tax fraud' },
      { name: 'System Operations', amount: 0.6, description: 'HMRC IT systems and infrastructure' },
      { name: 'Other Schemes & Infrastructure', amount: -0.4, description: 'Additional operational support (minimal)' },
    ],

    'Foreign, Commonwealth and Development': [
      { name: 'Embassies & Diplomatic Posts', amount: 2.5, description: 'Operating UK embassies worldwide' },
      { name: 'International Aid', amount: 1.8, description: 'Development assistance and humanitarian aid' },
      { name: 'Trade & Investment', amount: 1.2, description: 'Promoting UK business overseas' },
      { name: 'Commonwealth Relations', amount: 0.5, description: 'Commonwealth member support' },
      { name: 'Other Schemes & Infrastructure', amount: 2.0, description: 'Diplomatic operations, international relations, global partnerships' },
    ],

    'Business and Trade': [
      { name: 'Business Support & Loans', amount: 1.8, description: 'Grants, loans, and advisory services' },
      { name: 'UK Trade & Export Support', amount: 1.2, description: 'Helping businesses export' },
      { name: 'Sector Development', amount: 0.9, description: 'Supporting key industry sectors' },
      { name: 'Trade Negotiation', amount: 0.4, description: 'International trade deal support' },
      { name: 'Other Schemes & Infrastructure', amount: -2.3, description: 'Department operations (note: some funding from other sources)' },
    ],

    'Science, Innovation and Technology': [
      { name: 'University Research Grants', amount: 0.3, description: 'Funding academic research projects' },
      { name: 'Innovation & UKRI', amount: 0.2, description: 'UK Research and Innovation (partial funding allocated here)' },
      { name: 'Technology Skills', amount: 0.1, description: 'Digital skills and tech training' },
      { name: 'Other Schemes & Infrastructure', amount: 0.1, description: 'Note: Much research & innovation spending classified under other departments or AME' },
    ],

    'Energy Security and Net Zero': [
      { name: 'Renewable Energy Support', amount: 0.8, description: 'Wind, solar, and renewable programs' },
      { name: 'Nuclear Energy', amount: 0.6, description: 'Nuclear infrastructure and development' },
      { name: 'Energy Efficiency Programs', amount: 0.3, description: 'Home insulation and efficiency grants' },
      { name: 'Grid Infrastructure', amount: 0.2, description: 'Electricity network modernization' },
      { name: 'Other Schemes & Infrastructure', amount: 0.0, description: 'Note: Major energy investment projects often funded through capital budgets and public corporations' },
    ],

    'Culture, Media and Sport': [
      { name: 'Arts & Heritage', amount: 0.7, description: 'Museums, galleries, and cultural institutions' },
      { name: 'Broadcasting & Media', amount: 0.4, description: 'BBC and broadcasting standards' },
      { name: 'Sport & Recreation', amount: 0.3, description: 'Sports facilities and programs' },
      { name: 'Libraries', amount: 0.2, description: 'Public library services' },
      { name: 'Other Schemes & Infrastructure', amount: 0.0, description: 'Department operations and cultural support' },
    ],
  },

  // Annually Managed Expenditure (AME) - Transfer payments, pensions, debt interest
  // Resource AME 2025-26: £654.8B - includes welfare payments, public sector pensions, debt interest, misc transfers
  annuallyManagedExpenditure: {
    2025_26: {
      'Social Protection & Welfare': 280.0,
      'Public Sector Pensions': 90.0,
      'Debt Interest': 120.0,
      'Other Services & Administration': 165.0,
    },
    2026_27: {
      'Social Protection & Welfare': 295.0,
      'Public Sector Pensions': 95.0,
      'Debt Interest': 125.0,
      'Other Services & Administration': 175.0,
    }
  },

  // Totals and Summary
  summary: {
    totalResourceSpending_2028_29: 566.3,
    totalCapitalSpending_2028_29: 146.0,
    totalManagedExpenditure_2025_26: 1369.8,
    resourceAME_2025_26: 654.8,
    percentageOfGDP_2028_29: 44.5,
    borrowingTarget_2030_31: 67.2,
    debtTarget_2030_31: 96.1,
  }
};

// Helper function to get year-on-year change
export function getYearOnYearChange(category, dept, year1, year2) {
  const data1 = budget2025.resourceSpending[year1]?.[dept] || 0;
  const data2 = budget2025.resourceSpending[year2]?.[dept] || 0;
  const change = data2 - data1;
  const percentChange = ((change / data1) * 100).toFixed(2);
  return { change, percentChange, from: data1, to: data2 };
}

// Helper to get total spending for a year
export function getTotalSpendingForYear(year) {
  const yearKey = year.toString().replace('-', '_');
  const data = budget2025.resourceSpending[yearKey];
  if (!data) return 0;
  return Object.values(data).reduce((sum, val) => sum + val, 0);
}

export default budget2025;
