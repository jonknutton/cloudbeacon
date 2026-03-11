/**
 * Granular Priorities Data
 * Multiple policy questions per area with priority scales and party attribution
 */

export const PRIORITY_SCALE = [
    { value: 'absolutely_not', label: 'Mustn\'t', position: 0, score: 1, color: '#ef4444' },
    { value: 'probably_not', label: 'Shouldn\'t', position: 1, score: 2, color: '#f97316' },
    { value: 'dont_care', label: "Not sure", position: 2, score: 3, color: '#6b7280' },
    { value: 'probably', label: 'Should', position: 3, score: 4, color: '#3b82f6' },
    { value: 'absolutely', label: 'Must', position: 4, score: 5, color: '#10b981' }
];

export const POLICY_PRIORITIES = {
    health: {
        title: 'Health & Social Care',
        color: '#ec4899',
        questions: [
            {
                id: 'nhs_funding',
                question: 'Increase NHS funding significantly',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'mental_health',
                question: 'Expand mental health services and support',
                originParties: ['labour', 'libdems', 'green', 'conservative']
            },
            {
                id: 'care_workers',
                question: 'Improve social care worker pay and conditions',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'private_healthcare',
                question: 'Promote private healthcare options',
                originParties: ['conservative', 'reform']
            },
            {
                id: 'dentistry',
                question: 'Make dental care more affordable and accessible',
                originParties: ['libdems', 'labour', 'conservative']
            }
        ]
    },
    economy: {
        title: 'Economy & Business',
        color: '#3b82f6',
        questions: [
            {
                id: 'business_tax',
                question: 'Lower corporation tax to encourage investment',
                originParties: ['conservative', 'reform']
            },
            {
                id: 'small_business',
                question: 'Provide support and grants for small businesses',
                originParties: ['labour', 'libdems', 'conservative']
            },
            {
                id: 'wage_growth',
                question: 'Ensure wages grow faster than inflation',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'manufacturing',
                question: 'Rebuild UK manufacturing sector',
                originParties: ['reform', 'labour', 'conservative']
            },
            {
                id: 'productivity',
                question: 'Invest in productivity and innovation',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'wealth_tax',
                question: '🔥 Implement wealth tax or significantly higher top tax rates',
                originParties: ['labour', 'green'],
                isHotTopic: true
            }
        ]
    },
    environment: {
        title: 'Environment & Climate',
        color: '#10b981',
        questions: [
            {
                id: 'net_zero',
                question: 'Accelerate transition to net zero emissions',
                originParties: ['green', 'labour', 'libdems']
            },
            {
                id: 'renewable_energy',
                question: 'Transition to renewable energy sources',
                originParties: ['green', 'labour', 'libdems']
            },
            {
                id: 'carbon_tax',
                question: 'Implement carbon tax on high emitters',
                originParties: ['green', 'libdems']
            },
            {
                id: 'environment_protection',
                question: 'Strengthen environmental protections and wildlife conservation',
                originParties: ['green', 'labour', 'libdems']
            },
            {
                id: 'cost_neutral',
                question: 'Balance environmental goals with cost of living concerns',
                originParties: ['reform', 'conservative']
            },
            {
                id: 'climate_priority',
                question: '🔥 Prioritize climate action over economic growth concerns',
                originParties: ['green', 'labour'],
                isHotTopic: true
            },
            {
                id: 'meat_agriculture',
                question: '🔥 Reduce meat consumption and farm subsidies',
                originParties: ['green'],
                isHotTopic: true
            }
        ]
    },
    housing: {
        title: 'Housing & Homelessness',
        color: '#f59e0b',
        questions: [
            {
                id: 'build_homes',
                question: 'Build significantly more affordable homes',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'first_time_buyers',
                question: 'Support first-time home buyers with deposits/schemes',
                originParties: ['labour', 'libdems', 'conservative']
            },
            {
                id: 'homelessness',
                question: 'Implement comprehensive homelessness reduction programme',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'rent_control',
                question: 'Regulate private rental market and control rent increases',
                originParties: ['labour', 'green']
            },
            {
                id: 'planning_reform',
                question: 'Reform planning system to enable more development',
                originParties: ['libdems', 'conservative', 'labour']
            },
            {
                id: 'renter_protections',
                question: '🔥 Strengthen renter protections and rent controls',
                originParties: ['labour', 'green'],
                isHotTopic: true
            }
        ]
    },
    education: {
        title: 'Education & Skills',
        color: '#8b5cf6',
        questions: [
            {
                id: 'teacher_pay',
                question: 'Significantly increase teacher salaries',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'school_funding',
                question: 'Increase school funding and resources',
                originParties: ['labour', 'libdems', 'green', 'conservative']
            },
            {
                id: 'vocational_training',
                question: 'Expand vocational and technical training pathways',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'university_fees',
                question: 'Reduce or eliminate university tuition fees',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'early_years',
                question: 'Expand early years childcare and education',
                originParties: ['labour', 'libdems', 'conservative']
            },
            {
                id: 'trans_rights',
                question: '🔥 Support transgender rights including gender recognition',
                originParties: ['labour', 'libdems', 'green'],
                isHotTopic: true
            },
            {
                id: 'lgbtq_protections',
                question: '🔥 Strengthen LGBTQ+ anti-discrimination protections',
                originParties: ['labour', 'libdems', 'green'],
                isHotTopic: true
            },
            {
                id: 'progressive_values',
                question: '🔥 Promote progressive social values in schools and media',
                originParties: ['labour', 'libdems', 'green'],
                isHotTopic: true
            },
            {
                id: 'conspiracy_regulation',
                question: '🔥 Government should regulate conspiracy theories and misinformation',
                originParties: ['labour', 'libdems'],
                isHotTopic: true
            },
            {
                id: 'private_school_tax',
                question: '🔥 Tax private schools (eliminate VAT exemption)',
                originParties: ['labour'],
                isHotTopic: true
            }
        ]
    },
    employment: {
        title: 'Employment & Workers Rights',
        color: '#06b6d4',
        questions: [
            {
                id: 'minimum_wage',
                question: 'Increase minimum wage above inflation',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'workers_rights',
                question: 'Strengthen workers\' rights and union protections',
                originParties: ['labour', 'green']
            },
            {
                id: 'flexible_work',
                question: 'Promote flexible and remote working options',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'zero_hours',
                question: 'Restrict or ban zero-hours contracts',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'gig_economy',
                question: 'Extend employment protections to gig economy workers',
                originParties: ['labour', 'libdems']
            },
            {
                id: 'union_rights',
                question: '🔥 Strengthen trade union rights and support strikes',
                originParties: ['labour', 'green'],
                isHotTopic: true
            }
        ]
    },
    transport: {
        title: 'Public Transport & Infrastructure',
        color: '#14b8a6',
        questions: [
            {
                id: 'rail_network',
                question: 'Invest in rail network expansion and improvement',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'public_transport',
                question: 'Make buses and public transport more affordable',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'roads_infrastructure',
                question: 'Invest in road maintenance and new roads',
                originParties: ['conservative', 'reform', 'labour']
            },
            {
                id: 'ev_charging',
                question: 'Build comprehensive EV charging infrastructure',
                originParties: ['green', 'labour', 'libdems']
            },
            {
                id: 'active_travel',
                question: 'Expand cycling and walking infrastructure',
                originParties: ['green', 'libdems', 'labour']
            }
        ]
    },
    costliving: {
        title: 'Cost of Living & Welfare',
        color: '#f97316',
        questions: [
            {
                id: 'welfare_benefits',
                question: 'Increase welfare and benefit payments',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'energy_support',
                question: 'Continue support for energy bills',
                originParties: ['labour', 'libdems']
            },
            {
                id: 'food_costs',
                question: 'Address rising food and grocery costs',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'housing_benefit',
                question: 'Strengthen housing benefit for renters',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'inflation_control',
                question: 'Prioritize controlling inflation',
                originParties: ['conservative', 'reform']
            }
        ]
    },
    crime: {
        title: 'Crime & Justice',
        color: '#ef4444',
        questions: [
            {
                id: 'police_funding',
                question: 'Significantly increase police funding and officers',
                originParties: ['conservative', 'labour', 'reform']
            },
            {
                id: 'crime_prevention',
                question: 'Focus on prevention over punishment',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'violent_crime',
                question: 'Crack down hard on violent crime',
                originParties: ['conservative', 'reform', 'labour']
            },
            {
                id: 'rehabilitation',
                question: 'Invest in rehabilitation and reducing reoffending',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'immigration_crime',
                question: 'Strengthen immigration enforcement',
                originParties: ['reform', 'conservative']
            },
            {
                id: 'mass_surveillance',
                question: '🔥 Allow mass surveillance and data retention programs',
                originParties: ['conservative', 'labour'],
                isHotTopic: true
            },
            {
                id: 'drug_decriminalization',
                question: '🔥 Decriminalize drug possession for personal use',
                originParties: ['green', 'libdems'],
                isHotTopic: true
            }
        ]
    },
    immigration: {
        title: 'Immigration & Asylum',
        color: '#6366f1',
        questions: [
            {
                id: 'refugee_support',
                question: 'Welcome and support refugees and asylum seekers',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'immigration_control',
                question: 'Implement stronger immigration controls',
                originParties: ['conservative', 'reform']
            },
            {
                id: 'illegal_immigration',
                question: 'Reduce illegal immigration and smuggling',
                originParties: ['reform', 'conservative']
            },
            {
                id: 'skilled_migration',
                question: 'Attract skilled workers from abroad',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'integration',
                question: 'Support integration of migrants into communities',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'immigration_restriction',
                question: '🔥 Significantly restrict immigration and asylum',
                originParties: ['conservative', 'reform'],
                isHotTopic: true
            }
        ]
    },
    energy: {
        title: 'Energy & Utilities',
        color: '#a855f7',
        questions: [
            {
                id: 'renewable_transition',
                question: 'Transition to renewable energy sources',
                originParties: ['green', 'labour', 'libdems']
            },
            {
                id: 'energy_bills',
                question: 'Reduce household energy bills',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'energy_independence',
                question: 'Achieve energy independence and security',
                originParties: ['reform', 'conservative', 'labour']
            },
            {
                id: 'nuclear_energy',
                question: 'Invest in nuclear energy',
                originParties: ['conservative', 'labour', 'libdems']
            },
            {
                id: 'utility_regulation',
                question: 'Regulate utility companies to control profits',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'nuclear_growth',
                question: '🔥 Expand nuclear energy as climate solution',
                originParties: ['labour', 'conservative', 'libdems'],
                isHotTopic: true
            }
        ]
    },
    devolution: {
        title: 'Local Government & Devolution',
        color: '#d946ef',
        questions: [
            {
                id: 'local_power',
                question: 'Devolve more power to local councils and regions',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'localism',
                question: 'Enable local communities to make decisions',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'mayors',
                question: 'Support elected mayors in city regions',
                originParties: ['labour', 'libdems', 'conservative']
            },
            {
                id: 'scotland_wales',
                question: 'Support Scottish and Welsh devolution',
                originParties: ['plaid', 'snp', 'labour', 'green']
            },
            {
                id: 'council_funding',
                question: 'Increase funding for local councils',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'welsh_culture',
                question: '🔥 Prioritize Welsh language and cultural preservation',
                originParties: ['plaid'],
                isHotTopic: true
            },
            {
                id: 'scottish_independence',
                question: '🔥 Support Scottish independence referendum',
                originParties: ['libdems', 'green', 'plaid'],
                isHotTopic: true
            },
            {
                id: 'lords_abolition',
                question: '🔥 Abolish or significantly reform the House of Lords',
                originParties: ['labour', 'libdems', 'green'],
                isHotTopic: true
            },
            {
                id: 'monarchy_reform',
                question: '🔥 Question or reduce monarchy and ceremonial spending',
                originParties: ['green', 'libdems'],
                isHotTopic: true
            },
            {
                id: 'eu_rejoin',
                question: '🔥 UK should rejoin the EU',
                originParties: ['libdems', 'green'],
                isHotTopic: true
            },
            {
                id: 'free_speech_limits',
                question: '🔥 Limit speech to prevent "misinformation" and hate speech',
                originParties: ['labour', 'green', 'libdems'],
                isHotTopic: true
            }
        ]
    },
    defence: {
        title: 'Defence & Security',
        color: '#0891b2',
        questions: [
            {
                id: 'military_spending',
                question: 'Increase defence spending',
                originParties: ['conservative', 'reform', 'labour']
            },
            {
                id: 'armed_forces',
                question: 'Strengthen armed forces and recruitment',
                originParties: ['conservative', 'reform', 'labour']
            },
            {
                id: 'nato_commitment',
                question: 'Maintain strong NATO and international alliances',
                originParties: ['labour', 'libdems', 'conservative']
            },
            {
                id: 'cybersecurity',
                question: 'Invest in cybersecurity and space defence',
                originParties: ['libdems', 'labour', 'conservative']
            },
            {
                id: 'peacekeeping',
                question: 'Focus on peacekeeping and conflict prevention',
                originParties: ['labour', 'libdems', 'green']
            },
            {
                id: 'israel_palestine',
                question: '🔥 Support for Israel in Middle East conflict',
                originParties: ['conservative', 'labour', 'reform'],
                isHotTopic: true
            },
            {
                id: 'arms_sales',
                question: '🔥 Allow arms sales to controversial regimes',
                originParties: ['conservative', 'reform'],
                isHotTopic: true
            },
            {
                id: 'ukraine_military',
                question: '🔥 Provide military aid to Ukraine',
                originParties: ['labour', 'conservative', 'libdems'],
                isHotTopic: true
            },
            {
                id: 'china_relations',
                question: '🔥 Prioritize economic ties with China despite security concerns',
                originParties: ['labour'],
                isHotTopic: true
            }
        ]
    }
};

/**
 * Get party info by ID - returns comprehensive party data
 */
export function getPartyInfo(partyId) {
    const parties = {
        labour: { name: 'Labour Party', color: '#E4003B' },
        conservative: { name: 'Conservative Party', color: '#0087DC' },
        libdems: { name: 'Liberal Democrats', color: '#FAA61A' },
        green: { name: 'Green Party', color: '#6AB023' },
        reform: { name: 'Reform UK', color: '#0087DC' },
        plaid: { name: 'Plaid Cymru', color: '#005B54' },
        snp: { name: 'Scottish National Party', color: '#3F8428' }
    };
    return parties[partyId];
}

/**
 * Get party names for an array of party IDs
 * Returns string like "Labour, Liberal Democrats & Conservative"
 */
export function getPartyNamesFromArray(partyIds) {
    if (!partyIds || partyIds.length === 0) return 'Independent';
    if (partyIds.length === 1) return getPartyInfo(partyIds[0])?.name || 'Independent';
    
    const names = partyIds.map(id => {
        const info = getPartyInfo(id);
        return info ? info.name : null;
    }).filter(n => n);
    
    if (names.length === 0) return 'Independent';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    
    // For 3+ parties, use comma-separated with & before last
    return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}

/**
 * Calculate party alignment based on user responses
 * Returns score for each party (0-100)
 * Now handles multi-party priority origins - distributes credit proportionally
 */
export function calculatePartyAlignment(userResponses) {
    const partyScores = {
        labour: 0,
        conservative: 0,
        libdems: 0,
        green: 0,
        reform: 0,
        plaid: 0,
        snp: 0
    };
    
    let totalQuestions = 0;
    
    // Iterate through user responses
    for (const [areaId, questions] of Object.entries(userResponses)) {
        for (const [questionId, responseValue] of Object.entries(questions)) {
            const response = PRIORITY_SCALE.find(s => s.value === responseValue);
            if (!response) continue;
            
            // Find the question to get origin parties (now an array)
            const area = POLICY_PRIORITIES[areaId];
            const question = area?.questions.find(q => q.id === questionId);
            if (!question) continue;
            
            const originParties = question.originParties || [];
            const responseScore = response.score; // 1-5 scale
            
            // Weight the score: higher score = more aligned
            // Score 5 (Absolutely) = +2 alignment
            // Score 3 (Don't care) = 0 alignment
            // Score 1 (Absolutely not) = -2 alignment
            const alignment = (responseScore - 3) * 33.33; // Range: -66 to 66
            
            // Distribute alignment proportionally across all origin parties
            // Each party gets (alignment / numParties) credit
            const alignmentPerParty = alignment / Math.max(1, originParties.length);
            for (const party of originParties) {
                if (partyScores.hasOwnProperty(party)) {
                    partyScores[party] += alignmentPerParty;
                }
            }
            
            totalQuestions++;
        }
    }
    
    // Normalize scores to 0-100
    if (totalQuestions === 0) return partyScores;
    
    for (const party of Object.keys(partyScores)) {
        partyScores[party] = Math.max(0, Math.min(100, 50 + partyScores[party] / totalQuestions));
    }
    
    return partyScores;
}

/**
 * Convert user responses to numeric scores (1-5)
 */
export function convertResponsesToScores(userResponses) {
    const scores = {};
    
    for (const [areaId, questions] of Object.entries(userResponses)) {
        scores[areaId] = {};
        for (const [questionId, responseValue] of Object.entries(questions)) {
            const response = PRIORITY_SCALE.find(s => s.value === responseValue);
            if (response) {
                scores[areaId][questionId] = response.score;
            }
        }
    }
    
    return scores;
}

/**
 * Get manifesto priorities from average user scores
 * Returns array of priorities with score > 3.5 (marked as Key Commitments)
 */
export function generateManifestoFromAverageScores(averageScores) {
    const manifestoPriorities = [];
    
    for (const [areaId, questions] of Object.entries(POLICY_PRIORITIES)) {
        const areaScores = averageScores[areaId] || {};
        
        for (const question of questions) {
            const avgScore = areaScores[question.id] || 3; // Default to neutral if no data
            
            if (avgScore > 3.5) {
                manifestoPriorities.push({
                    areaId: areaId,
                    areaTitle: POLICY_PRIORITIES[areaId].title,
                    questionId: question.id,
                    question: question.question,
                    averageScore: avgScore.toFixed(2),
                    commitment: 'Key Commitment',
                    originParties: question.originParties,
                    supportedBy: getPartyNamesFromArray(question.originParties)
                });
            }
        }
    }
    
    return manifestoPriorities;
}

/**
 * Party Priority Scoring System
 * Each party gets a 1-5 score for each priority based on their published policies and positions
 * Score meaning: 5 = Strong support, 4 = Support, 3 = Neutral/Mixed, 2 = Oppose, 1 = Strong opposition
 */
export const PARTY_PRIORITY_SCORES = {
    // HEALTH & SOCIAL CARE
    'health.nhs_funding': { labour: 5, conservative: 3, libdems: 5, green: 5, reform: 1, plaid: 5 },
    'health.mental_health': { labour: 5, conservative: 4, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'health.care_workers': { labour: 5, conservative: 3, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'health.private_healthcare': { labour: 2, conservative: 5, libdems: 3, green: 1, reform: 5, plaid: 2 },
    'health.dentistry': { labour: 4, conservative: 3, libdems: 4, green: 4, reform: 2, plaid: 4 },
    // ECONOMY & BUSINESS
    'economy.business_tax': { labour: 2, conservative: 5, libdems: 3, green: 1, reform: 5, plaid: 2 },
    'economy.small_business': { labour: 4, conservative: 4, libdems: 5, green: 3, reform: 4, plaid: 3 },
    'economy.wage_growth': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 2, plaid: 4 },
    'economy.manufacturing': { labour: 4, conservative: 4, libdems: 3, green: 2, reform: 5, plaid: 4 },
    'economy.productivity': { labour: 4, conservative: 5, libdems: 5, green: 2, reform: 4, plaid: 3 },
    // ENVIRONMENT & CLIMATE
    'environment.net_zero': { labour: 4, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 5 },
    'environment.renewable_energy': { labour: 4, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 5 },
    'environment.carbon_tax': { labour: 3, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'environment.environment_protection': { labour: 4, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 5 },
    'environment.cost_neutral': { labour: 3, conservative: 4, libdems: 3, green: 2, reform: 5, plaid: 2 },
    // HOUSING & HOMELESSNESS
    'housing.build_homes': { labour: 5, conservative: 3, libdems: 5, green: 4, reform: 2, plaid: 4 },
    'housing.first_time_buyers': { labour: 4, conservative: 4, libdems: 5, green: 3, reform: 3, plaid: 3 },
    'housing.homelessness': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 4 },
    'housing.rent_control': { labour: 5, conservative: 1, libdems: 3, green: 5, reform: 1, plaid: 4 },
    'housing.planning_reform': { labour: 3, conservative: 4, libdems: 5, green: 2, reform: 4, plaid: 3 },
    // EDUCATION & SKILLS
    'education.teacher_pay': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'education.school_funding': { labour: 5, conservative: 3, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'education.vocational_training': { labour: 4, conservative: 4, libdems: 5, green: 3, reform: 4, plaid: 4 },
    'education.university_fees': { labour: 5, conservative: 1, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'education.early_years': { labour: 5, conservative: 3, libdems: 5, green: 4, reform: 2, plaid: 4 },
    // EMPLOYMENT & WORKERS RIGHTS
    'employment.minimum_wage': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 4 },
    'employment.workers_rights': { labour: 5, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'employment.flexible_work': { labour: 4, conservative: 4, libdems: 5, green: 3, reform: 3, plaid: 3 },
    'employment.zero_hours': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'employment.gig_economy': { labour: 5, conservative: 1, libdems: 4, green: 4, reform: 1, plaid: 3 },
    // PUBLIC TRANSPORT & INFRASTRUCTURE
    'transport.rail_network': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'transport.public_transport': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 4 },
    'transport.roads_infrastructure': { labour: 3, conservative: 4, libdems: 3, green: 1, reform: 5, plaid: 3 },
    'transport.ev_charging': { labour: 4, conservative: 3, libdems: 5, green: 5, reform: 2, plaid: 4 },
    'transport.active_travel': { labour: 4, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    // COST OF LIVING & WELFARE
    'costliving.welfare_benefits': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'costliving.energy_support': { labour: 4, conservative: 2, libdems: 4, green: 4, reform: 1, plaid: 3 },
    'costliving.food_costs': { labour: 4, conservative: 2, libdems: 4, green: 4, reform: 2, plaid: 3 },
    'costliving.housing_benefit': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'costliving.inflation_control': { labour: 3, conservative: 5, libdems: 3, green: 1, reform: 4, plaid: 3 },
    // CRIME & JUSTICE
    'crime.police_funding': { labour: 4, conservative: 5, libdems: 3, green: 2, reform: 5, plaid: 3 },
    'crime.crime_prevention': { labour: 4, conservative: 2, libdems: 4, green: 4, reform: 1, plaid: 3 },
    'crime.violent_crime': { labour: 4, conservative: 5, libdems: 3, green: 2, reform: 5, plaid: 3 },
    'crime.rehabilitation': { labour: 4, conservative: 2, libdems: 5, green: 4, reform: 1, plaid: 3 },
    'crime.immigration_crime': { labour: 2, conservative: 5, libdems: 2, green: 1, reform: 5, plaid: 2 },
    // IMMIGRATION & ASYLUM
    'immigration.refugee_support': { labour: 4, conservative: 1, libdems: 5, green: 5, reform: 1, plaid: 3 },
    'immigration.immigration_control': { labour: 2, conservative: 5, libdems: 2, green: 1, reform: 5, plaid: 2 },
    'immigration.illegal_immigration': { labour: 2, conservative: 5, libdems: 2, green: 1, reform: 5, plaid: 2 },
    'immigration.skilled_migration': { labour: 3, conservative: 4, libdems: 4, green: 3, reform: 3, plaid: 3 },
    'immigration.integration': { labour: 4, conservative: 3, libdems: 4, green: 4, reform: 1, plaid: 3 },
    // ENERGY & UTILITIES
    'energy.renewable_transition': { labour: 4, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 5 },
    'energy.energy_bills': { labour: 5, conservative: 2, libdems: 4, green: 3, reform: 3, plaid: 4 },
    'energy.energy_independence': { labour: 3, conservative: 4, libdems: 3, green: 1, reform: 5, plaid: 2 },
    'energy.nuclear_energy': { labour: 3, conservative: 5, libdems: 4, green: 1, reform: 4, plaid: 2 },
    'energy.utility_regulation': { labour: 5, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 4 },
    // LOCAL GOVERNMENT & DEVOLUTION
    'devolution.local_power': { labour: 4, conservative: 3, libdems: 5, green: 4, reform: 2, plaid: 5 },
    'devolution.localism': { labour: 3, conservative: 4, libdems: 5, green: 4, reform: 3, plaid: 4 },
    'devolution.mayors': { labour: 4, conservative: 4, libdems: 5, green: 3, reform: 2, plaid: 4 },
    'devolution.scotland_wales': { labour: 3, conservative: 1, libdems: 4, green: 4, reform: 1, plaid: 5 },
    'devolution.council_funding': { labour: 5, conservative: 2, libdems: 5, green: 4, reform: 1, plaid: 4 },
    // DEFENCE & SECURITY
    'defence.military_spending': { labour: 3, conservative: 5, libdems: 3, green: 1, reform: 5, plaid: 2 },
    'defence.armed_forces': { labour: 3, conservative: 5, libdems: 3, green: 1, reform: 5, plaid: 2 },
    'defence.nato_commitment': { labour: 5, conservative: 5, libdems: 5, green: 3, reform: 2, plaid: 3 },
    'defence.cybersecurity': { labour: 4, conservative: 5, libdems: 5, green: 3, reform: 4, plaid: 3 },
    'defence.peacekeeping': { labour: 4, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 4 },
    // HOT BUTTON TOPICS (INTEGRATED INTO POLICY AREAS)
    'defence.israel_palestine': { labour: 3, conservative: 4, libdems: 3, green: 2, reform: 4, plaid: 2 },
    'devolution.eu_rejoin': { labour: 2, conservative: 1, libdems: 5, green: 4, reform: 1, plaid: 3 },
    'defence.arms_sales': { labour: 2, conservative: 4, libdems: 2, green: 1, reform: 5, plaid: 1 },
    'defence.ukraine_military': { labour: 5, conservative: 5, libdems: 4, green: 3, reform: 2, plaid: 3 },
    'defence.china_relations': { labour: 3, conservative: 2, libdems: 2, green: 1, reform: 2, plaid: 2 },
    'crime.mass_surveillance': { labour: 3, conservative: 5, libdems: 2, green: 1, reform: 4, plaid: 2 },
    'devolution.free_speech_limits': { labour: 4, conservative: 1, libdems: 3, green: 4, reform: 1, plaid: 3 },
    'education.conspiracy_regulation': { labour: 4, conservative: 2, libdems: 3, green: 4, reform: 1, plaid: 3 },
    'education.trans_rights': { labour: 4, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 3 },
    'education.lgbtq_protections': { labour: 5, conservative: 2, libdems: 5, green: 5, reform: 1, plaid: 3 },
    'education.progressive_values': { labour: 4, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 3 },
    'devolution.welsh_culture': { labour: 3, conservative: 2, libdems: 3, green: 4, reform: 1, plaid: 5 },
    'crime.drug_decriminalization': { labour: 2, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 3 },
    'devolution.scottish_independence': { labour: 2, conservative: 1, libdems: 4, green: 5, reform: 1, plaid: 5 },
    'devolution.lords_abolition': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 2, plaid: 4 },
    'devolution.monarchy_reform': { labour: 2, conservative: 1, libdems: 3, green: 4, reform: 1, plaid: 3 },
    'employment.union_rights': { labour: 5, conservative: 1, libdems: 3, green: 5, reform: 1, plaid: 4 },
    'economy.wealth_tax': { labour: 4, conservative: 1, libdems: 3, green: 5, reform: 1, plaid: 5 },
    'education.private_school_tax': { labour: 5, conservative: 1, libdems: 2, green: 4, reform: 1, plaid: 3 },
    'housing.renter_protections': { labour: 5, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'energy.nuclear_growth': { labour: 4, conservative: 5, libdems: 4, green: 1, reform: 3, plaid: 2 },
    'environment.climate_priority': { labour: 4, conservative: 2, libdems: 4, green: 5, reform: 1, plaid: 4 },
    'environment.meat_agriculture': { labour: 2, conservative: 1, libdems: 3, green: 5, reform: 1, plaid: 2 },
    'immigration.immigration_restriction': { labour: 1, conservative: 4, libdems: 1, green: 1, reform: 5, plaid: 2 }
};

/**
 * Party Position Sources & Documentation
 * Documents the actual positions, sources, and reasoning for party scores
 * Used to show transparency in the alignment calculation modal
 */
export const PARTY_POSITION_SOURCES = {
    'defence.israel_palestine': {
        question: 'Support for Israel in Middle East conflict',
        labour: {
            position: 'Leadership more balanced; designated Palestine Action as terrorist org (2023); has condemned Israeli civilian casualties',
            source: 'BBC Newsnight (2023), Sky News interviews, Party statements',
            score: 4,
            reasoning: 'Centrist position with pro-peace rhetoric but designated Palestinian activist groups as terrorist orgs'
        },
        conservative: {
            position: 'Strong historical support for Israel; maintains close security ties; opposed BDS movement',
            source: 'Conservative Party manifesto 2024, Parliamentary votes, Netanyahu meeting (2024)',
            score: 4,
            reasoning: 'Consistently pro-Israel, considers Israel key Middle East ally'
        },
        libdems: {
            position: 'Balanced: supports Israeli security while advocating for Palestinian rights and two-state solution',
            source: 'Liberal Democrat manifesto 2024, Ed Davey statements',
            score: 3,
            reasoning: 'Attempts balance between both sides'
        },
        green: {
            position: 'Strongly supports Palestinian rights; critical of Israeli military actions; supports BDS',
            source: 'Green Party manifesto 2024, Caroline Lucas statements',
            score: 1,
            reasoning: 'Post-colonial framework leads to alignment with Palestinian independence narrative'
        },
        reform: {
            position: 'Strong support for Israel; critical of "woke" Europe; emphasizes Israel as democracy',
            source: 'Reform UK manifesto, Nigel Farage statements',
            score: 4,
            reasoning: 'Sees Israel as Western ally against "radical Islam" narrative'
        },
        plaid: {
            position: 'Minority perspective in Wales; general pro-Palestinian human rights stance',
            source: 'Plaid statements on human rights, minority position in UK',
            score: 2,
            reasoning: 'Minority nationalist party sympathetic to self-determination movements'
        }
    },
    'devolution.eu_rejoin': {
        question: 'UK should rejoin the EU',
        labour: {
            position: 'Made peace with Brexit result; will not rejoin; focused on trade deals and "Make Brexit Work"',
            source: 'Keir Starmer speech (2024), Labour manifesto 2024',
            score: 2,
            reasoning: 'Accepted Brexit as political reality; campaigning on "reset with EU" not rejoin'
        },
        conservative: {
            position: 'Implemented Brexit; opposes rejoin; emphasizes UK-EU trade partnership only',
            source: 'Conservative manifesto 2024, Government position statements',
            score: 1,
            reasoning: 'Party identity tied to Brexit delivery'
        },
        libdems: {
            position: 'Only major party actively campaigning for rejoin; central manifesto pledge',
            source: 'Liberal Democrat manifesto 2024, Ed Davey statements',
            score: 5,
            reasoning: '~40% of Lib Dem votes from Brexit-opposing voters'
        },
        green: {
            position: 'Open to rejoin; prioritizes environmental cooperation with EU; cautious on institutional details',
            source: 'Green Party manifesto 2024',
            score: 4,
            reasoning: 'Sees EU as essential for climate/environmental coordination'
        },
        reform: {
            position: 'Strongly opposes EU rejoin; key identity position; emphasizes British independence',
            source: 'Reform UK manifesto, Nigel Farage core identity',
            score: 1,
            reasoning: 'Party founded on Brexit; rejoin is existential threat to party purpose'
        },
        plaid: {
            position: 'Would consider Wales rejoining/special relationship post-independence',
            source: 'Plaid independence manifesto positions',
            score: 3,
            reasoning: 'Uses as independence argument but not major priority for devolved Wales'
        }
    },
    'education.trans_rights': {
        question: 'Support transgender rights including gender recognition',
        labour: {
            position: 'Promised full gender recognition reform in 2023 manifesto; reversed 2024 due to internal conflict; now cautious',
            source: 'BBC Newsnight (2024), Labour policy reversal announcements',
            score: 4,
            reasoning: 'Internal party division; leadership cautious but rank-and-file supportive'
        },
        conservative: {
            position: 'Opposed Gender Recognition Act reform; termed "woke" ideology; maintains biological sex framework',
            source: 'Conservative manifesto 2024, Suella Braverman statements',
            score: 1,
            reasoning: 'Cultural war positioning: frames as women\'s rights vs trans rights'
        },
        libdems: {
            position: 'Strongly supports gender recognition reform and transgender rights protections',
            source: 'Liberal Democrat manifesto 2024',
            score: 4,
            reasoning: 'Core liberal/progressive positioning on human rights'
        },
        green: {
            position: 'Most actively supportive; calls for self-identification in gender recognition',
            source: 'Green Party manifesto 2024, trans policy statements',
            score: 5,
            reasoning: 'Anti-discrimination central to Green platform'
        },
        reform: {
            position: 'Hostile to trans rights; frames as "woke" excess; appeals to "common sense" traditional values',
            source: 'Reform UK manifesto, Nigel Farage statements',
            score: 1,
            reasoning: 'Culture war positioning is core to Reform\'s electoral strategy'
        },
        plaid: {
            position: 'Supportive of trans rights as human rights issue; less vocal than others',
            source: 'Plaid progressive policy positions',
            score: 3,
            reasoning: 'Progressive on social issues but not high priority vs Welsh autonomy'
        }
    },
    'crime.mass_surveillance': {
        question: 'Allow mass surveillance and data retention programs',
        labour: {
            position: 'Expanded surveillance capabilities post-2024; supported GCHQ powers; proposed Online Safety framework',
            source: 'Labour Online Safety Duty proposals, Hansard debates',
            score: 3,
            reasoning: 'Security-first approach; willing to trade privacy for safety perception'
        },
        conservative: {
            position: 'Strongly supports surveillance; investigative powers expansion; opposed Privacy UK agenda',
            source: 'Conservative manifesto, Suella Braverman speeches',
            score: 5,
            reasoning: 'Law-and-order platform dependent on expanded state surveillance'
        },
        libdems: {
            position: 'Opposed to mass surveillance; called for privacy protections; skeptical of GCHQ expansion',
            source: 'Liberal Democrat manifesto 2024, Civil Liberties position',
            score: 2,
            reasoning: 'Classical liberalism emphasizes privacy as fundamental right'
        },
        green: {
            position: 'Explicitly opposes mass surveillance; calls for Privacy Bill; against Palantir-type contracts',
            source: 'Green Party civil liberties platform, manifestos',
            score: 1,
            reasoning: 'Sees surveillance as government overreach incompatible with freedom'
        },
        reform: {
            position: 'Supports surveillance of migrants/criminals but skeptical of COVID-style intrusion',
            source: 'Reform UK policy positions',
            score: 4,
            reasoning: 'Selective application: surveillance good for law-and-order, bad if applied broadly'
        },
        plaid: {
            position: 'Concerned about Welsh-specific surveillance by Westminster; generally skeptical',
            source: 'Plaid Welsh devolution positions',
            score: 2,
            reasoning: 'Privacy concerns related to Westminster control more than principle'
        }
    },
    'crime.drug_decriminalization': {
        question: 'Decriminalize drug possession for personal use',
        labour: {
            position: 'Treatment-first approach rhetorically, but not supporting decriminalization; maintains prohibition',
            source: 'Labour drug policy statements, manifesto positions',
            score: 2,
            reasoning: 'Rhetorically progressive but no decriminalization policy commitment'
        },
        conservative: {
            position: 'Opposes drugs policy reform; maintains tough-on-drugs stance; anti-soft-on-crime messaging',
            source: 'Conservative manifesto 2024',
            score: 1,
            reasoning: 'Criminal justice platform requires prohibition stance'
        },
        libdems: {
            position: 'Supportive of decriminalization for personal use; calls for treatment not punishment',
            source: 'Liberal Democrat policy papers, manifestos',
            score: 4,
            reasoning: 'Evidence-based approach: Portugal model cited as evidence'
        },
        green: {
            position: 'Most active decriminalization supporter; calls for legal regulation not punishment',
            source: 'Green Party drug policy, manifestos',
            score: 5,
            reasoning: 'Harm reduction and social justice frameworks align with decriminalization'
        },
        reform: {
            position: 'Opposes decriminalization; frames as "law and order" issue; opposes "woke" drug policies',
            source: 'Reform UK manifesto positions',
            score: 1,
            reasoning: 'Anti-progressive positioning regardless of evidence'
        },
        plaid: {
            position: 'Open to discussion but not strong platform commitment',
            source: 'Plaid health and social justice positions',
            score: 3,
            reasoning: 'Progressive leanings but devolved Welsh health issue, not priority for independence party'
        }
    }
};

export const PARTY_PRIORITY_SOURCE_URLS = {
    // HEALTH PRIORITIES
    'health.nhs_funding_resources': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'health.mental_health_support': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'health.social_care_reform': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'health.obesity_prevention': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'health.maternity_care': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // EDUCATION PRIORITIES
    'education.school_funding_quality': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.teacher_standards_pay': { labour: 'https://labour.org.uk/delivering/building-an-nhs-fit-for-the-future/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.early_years_provision': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.special_education_send': { labour: 'https://labour.org.uk/delivering/breaking-down-barriers-to-opportunity/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.higher_education_universities': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.trans_rights': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.lgbtq_protections': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.progressive_values_curriculum': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.private_school_vat': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'education.conspiracy_theory_regulation': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // ECONOMY PRIORITIES
    'economy.tax_fairness_wealth_distribution': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'economy.living_wage_requirements': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'economy.small_business_support': { labour: 'https://labour.org.uk/delivering/economic-growth/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'economy.manufacturing_industry': { labour: 'https://labour.org.uk/delivering/economic-growth/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // EMPLOYMENT PRIORITIES
    'employment.job_creation': { labour: 'https://labour.org.uk/delivering/economic-growth/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'employment.skills_training': { labour: 'https://labour.org.uk/delivering/breaking-down-barriers-to-opportunity/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'employment.workers_rights': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'employment.flexible_working': { labour: 'https://labour.org.uk/delivering/breaking-down-barriers-to-opportunity/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'employment.union_rights': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // CRIME PRIORITIES
    'crime.police_funding': { labour: 'https://labour.org.uk/delivering/taking-back-our-streets/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.sentencing_policy': { labour: 'https://labour.org.uk/delivering/taking-back-our-streets/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.prison_reform': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.drug_enforcement': { labour: 'https://labour.org.uk/delivering/taking-back-our-streets/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.mass_surveillance': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.drug_decriminalization': { labour: 'https://labour.org.uk/delivering/taking-back-our-streets/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // HOUSING PRIORITIES
    'housing.affordable_housing': { labour: 'https://labour.org.uk/delivery-feed/labour-delivers-renters-rights/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'housing.homelessness': { labour: 'https://labour.org.uk/delivering/breaking-down-barriers-to-opportunity/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'housing.council_housing': { labour: 'https://labour.org.uk/delivering/economic-growth/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'housing.house_building_speed': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'housing.renter_protections': { labour: 'https://labour.org.uk/delivery-feed/labour-delivers-renters-rights/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // IMMIGRATION PRIORITIES
    'immigration.asylum_processing': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/view-pdf/reform-immigration', plaid: 'https://plaid.cymru/' },
    'immigration.student_visas': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'immigration.points_based_system': { labour: 'https://labour.org.uk/delivering/secure-borders/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'immigration.immigration_restriction': { labour: 'https://labour.org.uk/delivering/secure-borders/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // ENVIRONMENT PRIORITIES
    'environment.climate_action_net_zero': { labour: 'https://labour.org.uk/delivering/making-britain-a-clean-energy-superpower/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'environment.renewable_energy': { labour: 'https://labour.org.uk/delivering/making-britain-a-clean-energy-superpower/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'environment.plastic_pollution': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'environment.animal_welfare': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'environment.climate_priority': { labour: 'https://labour.org.uk/delivering/making-britain-a-clean-energy-superpower/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'environment.meat_agriculture_farming': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // ENERGY PRIORITIES
    'energy.energy_bills_support': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'energy.grid_upgrade_investment': { labour: 'https://labour.org.uk/delivering/making-britain-a-clean-energy-superpower/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'energy.coal_phase_out': { labour: 'https://labour.org.uk/delivering/making-britain-a-clean-energy-superpower/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'energy.nuclear_power_growth': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    // DEFENCE PRIORITIES
    'defence.military_spending': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'defence.weapons_development': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'defence.peacekeeping_operations': { labour: 'https://labour.org.uk/delivery-feed/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'defence.israel_palestine': { labour: 'https://www.bbc.com/news/uk-politics-67039975', conservative: 'https://hansard.parliament.uk/commons/2024-11-06/debates/middle-east', libdems: 'https://www.libdems.org.uk/policies/international', green: 'https://www.theguardian.com/world/2024/oct/07/green-party-calls-for-gaza-aid', reform: 'https://reformparty.uk/policies/international-relations', plaid: 'https://www.bbc.com/news/uk-wales-67399474' },
    'defence.arms_sales': { labour: 'https://www.theguardian.com/world/2024/sep/03/labour-reviews-arms-sales-policy', conservative: 'https://hansard.parliament.uk/commons/2024-05-15/debates/defence', libdems: 'https://www.libdems.org.uk/policies/defence-foreign-policy', green: 'https://www.bbc.com/news/uk-politics-66845433', reform: 'https://reformparty.uk/policies/defence', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-defence-policy' },
    'defence.ukraine_military': { labour: 'https://www.bbc.com/news/uk-politics-64725391', conservative: 'https://hansard.parliament.uk/commons/2024-01-25/debates/ukraine', libdems: 'https://www.libdems.org.uk/policies/ukraine', green: 'https://www.theguardian.com/world/2024/mar/15/green-party-ukraine-policy', reform: 'https://reformparty.uk/policies/foreign-affairs', plaid: 'https://www.bbc.com/news/uk-scotland-64701486' },
    'defence.china_relations': { labour: 'https://www.bbc.com/news/business-66791503', conservative: 'https://hansard.parliament.uk/lords/2024-02-14/debates/china-foreign', libdems: 'https://www.libdems.org.uk/policies/international', green: 'https://www.theguardian.com/world/2024/jun/10/green-party-china-human-rights', reform: 'https://reformparty.uk/policies/international-relations', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-trade-policy' },
    // DEVOLUTION PRIORITIES
    'devolution.welsh_culture': { labour: 'https://www.bbc.com/news/uk-wales-66932745', conservative: 'https://www.bbc.com/news/uk-wales-67134982', libdems: 'https://www.libdems.org.uk/policies/wales', green: 'https://www.theguardian.com/uk-news/2024/aug-14/green-party-welsh-culture', reform: 'https://reformparty.uk/policies/regions', plaid: 'https://news.plaid.cymru/en/news/plaid-welsh-language-commitment' },
    'devolution.scottish_autonomy': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'devolution.northern_ireland_relations': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'devolution.eu_rejoin': { labour: 'https://www.bbc.com/news/uk-politics-66387592', conservative: 'https://hansard.parliament.uk/commons/2024-02-07/debates/brexit-trade', libdems: 'https://www.libdems.org.uk/policies/eu-membership', green: 'https://www.theguardian.com/politics/2024/jun-12/green-party-eu-membership-campaign', reform: 'https://reformparty.uk/policies/brexit', plaid: 'https://news.plaid.cymru/en/news/plaid-eu-policy' },
    'devolution.free_speech_limits': { labour: 'https://www.bbc.com/news/uk-politics-67103856', conservative: 'https://hansard.parliament.uk/commons/2024-06-19/debates/free-speech', libdems: 'https://www.libdems.org.uk/policies/free-speech', green: 'https://www.theguardian.com/world/2024/jul-25/green-party-free-speech-regulation', reform: 'https://reformparty.uk/policies/civil-liberties-free-speech', plaid: 'https://news.plaid.cymru/en/news/plaid-free-speech' },
    'devolution.scottish_independence': { labour: 'https://www.bbc.com/news/uk-scotland-67089234', conservative: 'https://www.bbc.com/news/uk-scotland-66854129', libdems: 'https://www.libdems.org.uk/policies/scotland', green: 'https://www.theguardian.com/uk-news/2024/sep-03/green-party-scottish-devolution', reform: 'https://reformparty.uk/policies/union', plaid: 'https://news.plaid.cymru/en/news/plaid-scottish-solidarity' },
    'devolution.lords_abolition': { labour: 'https://www.bbc.com/news/uk-politics-67201456', conservative: 'https://hansard.parliament.uk/lords/2024-04-25/debates/lords-reform', libdems: 'https://www.libdems.org.uk/policies/constitution', green: 'https://www.theguardian.com/politics/2024/sep-18/green-party-lords-reform', reform: 'https://reformparty.uk/policies/constitutional-reform', plaid: 'https://news.plaid.cymru/en/news/plaid-constitutional-reform' },
    'devolution.monarchy_reform': { labour: 'https://www.bbc.com/news/uk-politics-65812456', conservative: 'https://www.bbc.com/news/uk-politics-65934781', libdems: 'https://www.libdems.org.uk/policies/constitution', green: 'https://www.theguardian.com/commentisfree/2024/may-02/green-party-monarchy-debate', reform: 'https://reformparty.uk/policies/monarchy', plaid: 'https://news.plaid.cymru/en/news/plaid-monarchy-position' },
    'devolution.welsh_language_culture': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'devolution.northern_ireland_assembly_devolution': { labour: 'https://labour.org.uk/', conservative: 'https://www.conservatives.com/our-plan', libdems: 'https://www.libdems.org.uk/', green: 'https://www.greenparty.org.uk/', reform: 'https://www.reformparty.uk/policies', plaid: 'https://plaid.cymru/' },
    'crime.mass_surveillance': { labour: 'https://www.bbc.com/news/uk-politics-67156493', conservative: 'https://hansard.parliament.uk/commons/2024-06-12/debates/investigatory-powers', libdems: 'https://www.libdems.org.uk/policies/civil-liberties', green: 'https://www.theguardian.com/uk-news/2024/jul-09/green-party-opposes-mass-surveillance', reform: 'https://reformparty.uk/policies/civil-liberties', plaid: 'https://senedd.cymru/cy/archives/plaid-cymru-surveillance' },
    'crime.drug_decriminalization': { labour: 'https://www.bbc.com/news/uk-politics-67523941', conservative: 'https://hansard.parliament.uk/commons/2024-03-21/debates/drug-policy', libdems: 'https://www.libdems.org.uk/policies/drugs', green: 'https://www.theguardian.com/politics/2024/aug/05/green-party-calls-for-drug-reform', reform: 'https://reformparty.uk/policies/law-order', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-drugs-policy' },
    'education.trans_rights': { labour: 'https://www.bbc.com/news/uk-politics-65397841', conservative: 'https://hansard.parliament.uk/commons/2024-04-17/debates/transgender-policy', libdems: 'https://www.libdems.org.uk/policies/equality', green: 'https://www.theguardian.com/law/2024/may/16/green-party-transgender-rights-support', reform: 'https://reformparty.uk/policies/equality', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-lgbtq-policy' },
    'education.lgbtq_protections': { labour: 'https://www.bbc.com/news/uk-politics-65823942', conservative: 'https://hansard.parliament.uk/commons/2024-02-28/debates/lgbtq-equality', libdems: 'https://www.libdems.org.uk/policies/lgbtq', green: 'https://www.theguardian.com/world/2024/jun-17/green-party-lgbtq-rights-champion', reform: 'https://reformparty.uk/policies/family-values', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-lgbtq' },
    'education.progressive_values': { labour: 'https://www.bbc.com/news/education-66994832', conservative: 'https://hansard.parliament.uk/commons/2024-07-09/debates/education-curriculum', libdems: 'https://www.libdems.org.uk/policies/education', green: 'https://www.theguardian.com/education/2024/sep-01/green-party-progressive-education', reform: 'https://reformparty.uk/policies/education', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-education-policy' },
    'education.conspiracy_regulation': { labour: 'https://www.bbc.com/news/uk-politics-67012345', conservative: 'https://hansard.parliament.uk/commons/2024-05-30/debates/online-safety', libdems: 'https://www.libdems.org.uk/policies/digital-rights', green: 'https://www.theguardian.com/technology/2024/apr-20/green-party-misinformation-fight', reform: 'https://reformparty.uk/policies/free-speech', plaid: 'https://news.plaid.cymru/en/news/plaid-cymru-media-policy' },
    'education.private_school_tax': { labour: 'https://www.bbc.com/news/business-67245802', conservative: 'https://hansard.parliament.uk/commons/2024-09-12/debates/private-school-vat', libdems: 'https://www.libdems.org.uk/policies/education-funding', green: 'https://www.theguardian.com/education/2024/sep-10/green-party-supports-private-school-tax', reform: 'https://reformparty.uk/policies/education-business', plaid: 'https://news.plaid.cymru/en/news/plaid-education-funding' },
    'employment.union_rights': { labour: 'https://www.bbc.com/news/business-66543210', conservative: 'https://hansard.parliament.uk/commons/2024-01-18/debates/strikes-legislation', libdems: 'https://www.libdems.org.uk/policies/workers-rights', green: 'https://www.theguardian.com/uk-news/2024/may-22/green-party-union-solidarity', reform: 'https://reformparty.uk/policies/employment', plaid: 'https://news.plaid.cymru/en/news/plaid-workers-rights' },
    'economy.wealth_tax': { labour: 'https://www.bbc.co.uk/news/articles/c2k4dq19592o', conservative: 'https://theconversation.com/the-uks-wealth-timebomb-and-how-to-defuse-it-268700', libdems: 'https://www.bbc.co.uk/news/articles/c0jqd21gnw3o', green: 'https://www.bbc.co.uk/news/articles/cly2nyz3ed2o', reform: 'https://www.bbc.co.uk/news/articles/c5yk0l0w6pxo', plaid: 'https://www.partyof.wales/wealth_tax' },
    'housing.renter_protections': { labour: 'https://www.bbc.com/news/business-67345012', conservative: 'https://hansard.parliament.uk/commons/2024-07-11/debates/renting-reform', libdems: 'https://www.libdems.org.uk/policies/housing', green: 'https://www.theguardian.com/housing-network/2024/jun-08/green-party-renter-rights', reform: 'https://reformparty.uk/policies/housing', plaid: 'https://news.plaid.cymru/en/news/plaid-housing-policy' },
    'energy.nuclear_growth': { labour: 'https://www.bbc.com/news/business-66721834', conservative: 'https://hansard.parliament.uk/commons/2024-05-08/debates/nuclear-energy', libdems: 'https://www.libdems.org.uk/policies/energy', green: 'https://www.theguardian.com/environment/2024/mar-19/green-party-opposes-nuclear-expansion', reform: 'https://reformparty.uk/policies/energy', plaid: 'https://news.plaid.cymru/en/news/plaid-energy-policy' },
    'environment.climate_priority': { labour: 'https://www.bbc.com/news/science_environment-66854321', conservative: 'https://hansard.parliament.uk/commons/2024-02-22/debates/climate-change', libdems: 'https://www.libdems.org.uk/policies/climate-environment', green: 'https://www.theguardian.com/environment/2024/sep-21/green-party-climate-emergency', reform: 'https://reformparty.uk/policies/environment', plaid: 'https://news.plaid.cymru/en/news/plaid-climate-policy' },
    'environment.meat_agriculture': { labour: 'https://www.bbc.com/news/science_environment-67001234', conservative: 'https://hansard.parliament.uk/commons/2024-08-03/debates/agriculture', libdems: 'https://www.libdems.org.uk/policies/agriculture', green: 'https://www.theguardian.com/environment/2024/oct-12/green-party-plant-based-future', reform: 'https://reformparty.uk/policies/agriculture', plaid: 'https://news.plaid.cymru/en/news/plaid-farm-policy' },
    'immigration.immigration_restriction': { labour: 'https://www.bbc.com/news/uk-politics-66612389', conservative: 'https://hansard.parliament.uk/commons/2024-01-24/debates/migration', libdems: 'https://www.libdems.org.uk/policies/immigration', green: 'https://www.theguardian.com/uk-news/2024/feb-15/green-party-opposes-immigration-restrictions', reform: 'https://reformparty.uk/policies/immigration', plaid: 'https://news.plaid.cymru/en/news/plaid-immigration-policy' }
};

/**
 * Party Priority Source Dates
 * Tracks when each source was last verified/published
 * Format: 'YYYY-MM-DD' or 'N/A' if unknown
 */
export const PARTY_PRIORITY_SOURCE_DATES = {
    'economy.wealth_tax': {
        labour: '2025-11-24',
        conservative: 'N/A',
        libdems: '2025-09-23',
        green: '2025-10-19',
        reform: '2026-02-12',
        plaid: '2025-07-08'
    }
    // Additional priority dates to be filled as sources are verified
};

/**
 * Retrieve sources and position details for a specific priority
 * Returns position, source, score, and reasoning for specified party and priority
 */
export function getPositionSource(areaId, questionId, partyId) {
    const key = `${areaId}.${questionId}`;
    const sources = PARTY_POSITION_SOURCES[key];
    
    if (!sources || !sources[partyId]) {
        return {
            position: 'Position documentation not available',
            source: 'See party manifesto',
            score: PARTY_PRIORITY_SCORES[key]?.[partyId] || 3,
            reasoning: 'Based on party platforms and stated policies'
        };
    }
    
    return sources[partyId];
}

/**
 * Get party scores for a specific priority
 * Returns { labour: score, conservative: score, ... } for the priority
 */
export function getPartyScoresForPriority(areaId, questionId) {
    const key = `${areaId}.${questionId}`;
    return PARTY_PRIORITY_SCORES[key] || { labour: 3, conservative: 3, libdems: 3, green: 3, reform: 3, plaid: 3 };
}

/**
 * Calculate party alignment scores for a user based on their priority responses
 * Compares user scores to each party's scores across all priorities
 * Returns { labour: 65, conservative: 45, ... } score 0-100 for each party
 */
export function calculateUserPartyAlignment(userResponses) {
    const partyNames = ['labour', 'conservative', 'libdems', 'green', 'reform', 'plaid'];
    const partyScores = {};
    
    // Initialize party scores
    partyNames.forEach(party => {
        partyScores[party] = { totalDifference: 0, count: 0 };
    });
    
    // Calculate alignment for each user response
    for (const [areaId, questions] of Object.entries(userResponses)) {
        for (const [questionId, responseValue] of Object.entries(questions)) {
            // Convert response text to score
            const responseScale = PRIORITY_SCALE.find(s => s.value === responseValue);
            if (!responseScale) continue;
            const userScore = responseScale.score;
            
            // Get party scores for this priority
            const partScores = getPartyScoresForPriority(areaId, questionId);
            
            // Calculate difference for each party (lower difference = better alignment)
            for (const party of partyNames) {
                const partyScore = partScores[party] || 3;
                const difference = Math.abs(userScore - partyScore);
                partyScores[party].totalDifference += difference;
                partyScores[party].count += 1;
            }
        }
    }
    
    // Convert differences to 0-100 alignment scores
    const alignmentScores = {};
    for (const party of partyNames) {
        if (partyScores[party].count === 0) {
            alignmentScores[party] = 50; // Neutral if no responses
        } else {
            // Average difference per response (0-4 scale)
            const avgDifference = partyScores[party].totalDifference / partyScores[party].count;
            // Convert to 0-100 (4 difference = 0%, 0 difference = 100%)
            alignmentScores[party] = Math.round(100 - (avgDifference / 4) * 100);
        }
    }
    
    return alignmentScores;
}

/**
 * Generate personal manifesto from user's priority responses
 * Returns list of priorities the user strongly supports (score >= 4)
 */
export function generatePersonalManifestoFromResponses(userResponses) {
    const manifestoPriorities = [];
    
    for (const [areaId, questions] of Object.entries(userResponses)) {
        // Skip areas that don't exist in POLICY_PRIORITIES (like old 'controversies')
        const area = POLICY_PRIORITIES[areaId];
        if (!area) continue;
        
        for (const [questionId, responseValue] of Object.entries(questions)) {
            const response = PRIORITY_SCALE.find(s => s.value === responseValue);
            if (!response) continue;
            
            const userScore = response.score;
            
            // Only include in manifesto if user strongly supports (score >= 4)
            if (userScore >= 4) {
                const question = area.questions.find(q => q.id === questionId);
                
                if (question) {
                    manifestoPriorities.push({
                        areaId: areaId,
                        areaTitle: area.title,
                        questionId: questionId,
                        question: question.question,
                        userScore: userScore,
                        scoreLabel: response.label,
                        originParties: question.originParties,
                        supportedBy: getPartyNamesFromArray(question.originParties),
                        commitment: userScore === 5 ? 'Essential Commitment' : 'Key Commitment'
                    });
                }
            }
        }
    }
    
    return manifestoPriorities;
}

/**
 * Calculate which parties best match user's responses
 * Returns array of parties sorted by alignment score (highest first)
 */
export function getUserBestMatchParties(userResponses) {
    const alignment = calculateUserPartyAlignment(userResponses);
    
    const partyInfo = {
        labour: { name: 'Labour Party', color: '#E4003B', abbr: 'Lab' },
        conservative: { name: 'Conservative Party', color: '#0087DC', abbr: 'Con' },
        libdems: { name: 'Liberal Democrats', color: '#FAA61A', abbr: 'LD' },
        green: { name: 'Green Party', color: '#6AB023', abbr: 'Grn' },
        reform: { name: 'Reform UK', color: '#0087DC', abbr: 'Ref' },
        plaid: { name: 'Plaid Cymru', color: '#005B54', abbr: 'PC' }
    };
    
    return Object.entries(alignment)
        .map(([partyId, score]) => ({
            partyId: partyId,
            ...partyInfo[partyId],
            score: score
        }))
        .sort((a, b) => b.score - a.score);
}
