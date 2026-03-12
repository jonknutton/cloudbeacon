/**
 * Standardized Manifestos - All 13 Policy Areas
 * Ensures apples-to-apples comparison across all parties
 * 
 * Structure: Each party has all 13 policy areas
 * Missing positions show "No official position" message
 */

/**
 * CREATE STANDARDIZED MANIFESTO WITH ALL 13 AREAS
 */
function createStandardManifesto(baseManifesto, partyName = '') {
    const AREAS = [
        'health',
        'economy',
        'environment',
        'housing',
        'education',
        'employment',
        'transport',
        'costliving',
        'crime',
        'immigration',
        'energy',
        'devolution',
        'defence'
    ];

    const TITLES = {
        health: 'Health & Social Care',
        economy: 'Economy & Business',
        environment: 'Environment & Climate',
        housing: 'Housing & Homelessness',
        education: 'Education & Skills',
        employment: 'Employment & Workers Rights',
        transport: 'Public Transport & Infrastructure',
        costliving: 'Cost of Living & Welfare',
        crime: 'Crime & Justice',
        immigration: 'Immigration & Asylum',
        energy: 'Energy & Utilities',
        devolution: 'Local Government & Devolution',
        defence: 'Defence & Security'
    };

    const ICONS = {
        health: '🏥',
        economy: '💼',
        environment: '🌍',
        housing: '🏠',
        education: '🎓',
        employment: '👷',
        transport: '🚂',
        costliving: '💷',
        crime: '⚖️',
        immigration: '🌐',
        energy: '⚡',
        devolution: '🏛️',
        defence: '🛡️'
    };

    // Create map of existing policies by area
    const existingPolicies = {};
    if (baseManifesto.policies && Array.isArray(baseManifesto.policies)) {
        baseManifesto.policies.forEach(policy => {
            existingPolicies[policy.area] = policy;
        });
    }

    // Build complete policies array with all 13 areas
    const standardPolicies = AREAS.map(areaId => {
        const existing = existingPolicies[areaId];
        
        if (existing) {
            // Use existing policy
            return existing;
        } else {
            // Create placeholder for missing area
            return {
                area: areaId,
                title: TITLES[areaId],
                icon: ICONS[areaId],
                position: `No official position - ${partyName || 'This party'} has not published a policy on this area.`,
                keyCommitments: [],
                hasNoPosition: true
            };
        }
    });

    // Return standardized manifesto
    return {
        ...baseManifesto,
        policies: standardPolicies
    };
}

/**
 * LABOUR PARTY - STANDARDIZED
 */
function getLabourManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'labour',
        party: 'Labour Party',
        leader: 'Keir Starmer',
        version: '1.0',
        colour: '#E4003B',
        sourceUrl: 'https://labour.org.uk/manifesto',
        description: 'Change - Stop the chaos, restore hope, rebuild Britain',
        keyline: 'Five National Missions for growth, clean energy, safety, opportunity, and NHS reform',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'The NHS is at the heart of Labour values. Commitment to 40,000 more appointments per week, 8,500 mental health staff, and double cancer diagnostic capacity. Establish neighbourhood health centres and reform social care with fair pay agreements for care workers.',
                keyCommitments: [
                    '40,000 additional NHS appointments weekly',
                    '8,500 mental health staff',
                    'Double cancer diagnostic capacity',
                    'National Care Service with fair pay',
                    'Neighbourhood health centres'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Deliver sustainable growth through an industrial strategy. £7.3bn National Wealth Fund to invest in green industries and manufacturing. Reform planning laws to unlock 1.5 million new homes.',
                keyCommitments: [
                    '£7.3bn National Wealth Fund',
                    '1.5 million new homes',
                    'Industrial strategy investment',
                    'Business tax capped at 25%',
                    'Manufacturing revival'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Make Britain a clean energy superpower. Major investment in renewable energy infrastructure, creating hundreds of thousands of green jobs. Transition to renewable energy reduces energy costs for families long-term.',
                keyCommitments: [
                    'Clean energy investment',
                    'Renewable energy transition',
                    'Green job creation',
                    'Energy independence',
                    'Carbon reduction targets'
                ]
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Create 1.5 million new homes through planning reform and innovative delivery. Support first-time buyers. Address homelessness comprehensively with dedicated funding and support services.',
                keyCommitments: [
                    '1.5 million new homes',
                    'First-time buyer support',
                    'Homelessness reduction programs',
                    'Planning reform for delivery',
                    'Affordable housing targets'
                ]
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Education is the foundation of opportunity. Enhanced teacher pay to attract talent, reduced class sizes, support for early childhood, and skills training for all. Youth guarantee for all young people.',
                keyCommitments: [
                    'Enhanced teacher pay',
                    'Reduced class sizes',
                    'Universal early childhood',
                    'Skills training programs',
                    'Youth guarantee'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'New Deal for Working People: Ban zero-hours contracts, introduce day-one sick pay, establish living wage, and enforce employment rights. Make work pay with stronger protections for workers.',
                keyCommitments: [
                    'Ban zero-hours contracts',
                    'Sick pay from day one',
                    'Living wage commitment',
                    'Strong employment rights',
                    'Fair pay agreements'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Reform railways into public ownership over time. Improve public transport connectivity. Invest in infrastructure for regional growth and economic development.',
                keyCommitments: [
                    'Public railways ownership',
                    'Public transport investment',
                    'Regional connectivity',
                    'Infrastructure investment',
                    'Integrated transport network'
                ]
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Support families through cost of living challenges with targeted support. Protect welfare safety net while promoting work. Fair benefits system.',
                keyCommitments: [
                    'Cost of living support',
                    'Welfare protection',
                    'Support for vulnerable',
                    'Fair benefit system',
                    'Child poverty reduction'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Take back streets with 13,000 more police officers and neighbourhood policing networks. Community-focused prevention of crime. Focus on serious crime enforcement.',
                keyCommitments: [
                    '13,000 more police',
                    'Neighbourhood policing',
                    'Crime prevention focus',
                    'Serious crime enforcement',
                    'Community safety'
                ]
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Manage immigration within legal frameworks. Asylum protection for genuine refugees. Integration support for migrants.',
                keyCommitments: [
                    'Immigration management',
                    'Asylum protection',
                    'Integration programs',
                    'Fair immigration system',
                    'Refugee support'
                ]
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Transition to renewable energy with public investment. Reduce household energy bills through energy independence and renewable infrastructure. Support businesses with competitive energy costs.',
                keyCommitments: [
                    'Renewable energy transition',
                    'Lower household bills',
                    'Energy independence',
                    'Green infrastructure',
                    'Utility reform'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Strengthen local government and devolved administrations. Devolve power to regions. Support local economic development.',
                keyCommitments: [
                    'Local government support',
                    'Devolution of power',
                    'Regional development',
                    'Council funding',
                    'Community empowerment'
                ]
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Maintain strong defence capabilities. NATO commitment. Cyber security and modern threats. Support armed forces.',
                keyCommitments: [
                    'NATO support',
                    'Defence spending',
                    'Cyber security',
                    'Armed forces support',
                    'National security'
                ]
            }
        ]
    };

    return createStandardManifesto(base, 'Labour Party');
}

/**
 * CONSERVATIVE PARTY - STANDARDIZED
 */
function getConservativeManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'conservative',
        party: 'Conservative Party',
        leader: 'Kemi Badenoch',
        version: '1.0',
        colour: '#0087DC',
        sourceUrl: 'https://www.conservatives.com/our-plan',
        description: 'Stronger Economy, Stronger Country',
        keyline: 'Fiscal responsibility, growth through business freedom, and national security',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'Protect and improve NHS. Address waiting times and capacity issues. Support social care with targeted funding.',
                keyCommitments: [
                    'NHS investment',
                    'Waiting time reduction',
                    'Social care support',
                    'Healthcare modernisation'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Restore fiscal discipline with £47bn savings plan to balance the deficit. Enable business growth through deregulation and tax cuts. Make the UK competitive again.',
                keyCommitments: [
                    '£47bn savings to deficit',
                    'Tax cuts (funded by savings)',
                    'Deregulation for growth',
                    'Fiscal balance'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Environmental protection balanced with economic growth. Reduce carbon emissions while maintaining competitive energy costs.'
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Increase home building through market-led approach. Support first-time buyers. Reduce homelessness.',
                keyCommitments: [
                    'Market-led house building',
                    'First-time buyer support',
                    'Homelessness reduction',
                    'Housing supply increase'
                ]
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Support young people through education and skills development. Student loan interest caps. Apprenticeship expansion.',
                keyCommitments: [
                    'Student loan caps',
                    'Apprenticeship programs',
                    'Skills training',
                    'Education funding'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Support employment and work incentives. Balance worker protections with business flexibility. Making work pay.',
                keyCommitments: [
                    'Work incentives',
                    'Employee protection',
                    'Employment support',
                    'Skills development'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Invest in major transport infrastructure. Improve rail and road networks. Support local transport.'
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Reduce living costs through economic growth and efficiency savings. Support welfare spending through growth not tax rises. Household support targeted at vulnerable.',
                keyCommitments: [
                    'Cost reduction through growth',
                    'Welfare efficiency',
                    'Targeted support',
                    'Energy cost reduction'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Law and order priority. Tougher sentences for serious crimes. Police support and community safety.',
                keyCommitments: [
                    'Tough sentencing',
                    'Police support',
                    'Community safety',
                    'Crime reduction'
                ]
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Strengthen border security and manage immigration levels. Asylum support within sustainable limits. Asylum dispersal to regions.'
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Cheap Power Plan to reduce household energy bills. Mix of energy provision for affordability and security. Balanced energy policy.',
                keyCommitments: [
                    'Lower household bills',
                    'Energy security',
                    'Mixed energy policy',
                    'Cost reduction'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Support local government. Devolved administrations in Scotland, Wales, and Northern Ireland.'
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Strong defence spending. NATO commitment. Protection of UK interests. Support for armed forces.',
                keyCommitments: [
                    'Defence spending',
                    'NATO support',
                    'UK security',
                    'Armed forces support'
                ]
            }
        ]
    };

    return createStandardManifesto(base, 'Conservative Party');
}

/**
 * LIBERAL DEMOCRAT - STANDARDIZED
 */
function getLibDemManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'libdems',
        party: 'Liberal Democrats',
        leader: 'Ed Davey',
        version: '1.0',
        colour: '#FAA61A',
        sourceUrl: 'https://www.libdems.org.uk/our-plans',
        description: 'For a Fair Deal - Everyone deserves freedom, fairness, and opportunity',
        keyline: 'Liberal values, open UK, comprehensive policy coverage, local empowerment',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'NHS fully funded and free at point of use. Significant investment in mental health services. High-quality social care with fair pay for workers. Integrated preventative healthcare.',
                keyCommitments: [
                    'Fully funded NHS',
                    'Free at point of service',
                    'Mental health investment',
                    'Fair pay social care',
                    'Preventative medicine'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Enable business while protecting workers. Progressive taxation system. Support for small businesses. Living wage commitment with regular upratings.',
                keyCommitments: [
                    'Fair business practices',
                    'Progressive taxation',
                    'Small business support',
                    'Living wage',
                    'Tax fairness'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Urgent climate action with fair transition. Renewable energy investment. Protection of natural beauty and biodiversity. Green jobs creation and support for workers.',
                keyCommitments: [
                    'Climate action',
                    'Renewable transition',
                    'Environment protection',
                    'Green jobs',
                    'Sustainability'
                ]
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Housing as a right, not a commodity. Build affordable homes. Support homeownership and first-time buyers. Protect renters. End homelessness.',
                keyCommitments: [
                    'Affordable housing',
                    'Homeownership support',
                    'Renter protections',
                    'Homelessness prevention',
                    'Housing rights'
                ]
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Major investment in state education. Fair funding for all schools. Support for disadvantaged learners. Lifelong learning and skills training.',
                keyCommitments: [
                    'Education investment',
                    'Fair school funding',
                    'Disadvantaged support',
                    'Lifelong learning',
                    'Skills training'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Strong worker protections and rights. Fair wages and conditions. Support for those changing careers. Work-life balance.',
                keyCommitments: [
                    'Worker protections',
                    'Fair wages',
                    'Career support',
                    'Work-life balance',
                    'Training support'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Major investment in public transport. Support for local buses and community transport. Active travel infrastructure for cycling and walking.',
                keyCommitments: [
                    'Public transport investment',
                    'Bus service support',
                    'Cycling infrastructure',
                    'Walking support',
                    'Local connectivity'
                ]
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Support families through cost of living crisis. Fair welfare system. Help for vulnerable. Child poverty reduction and support.',
                keyCommitments: [
                    'Cost of living support',
                    'Welfare protection',
                    'Vulnerable support',
                    'Child poverty help',
                    'Family support'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Justice system reform. Support vulnerable in contact with justice system. Community policing. Crime prevention focus.',
                keyCommitments: [
                    'Justice reform',
                    'Community policing',
                    'Crime prevention',
                    'Vulnerable support',
                    'Rehabilitation focus'
                ]
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Fair immigration system treating people with dignity. Asylum protection. Manage migration humanely. Integration support for migrants.',
                keyCommitments: [
                    'Fair immigration',
                    'Asylum protection',
                    'Humane migration',
                    'Integration support',
                    'Training and jobs'
                ]
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Clean energy transition with investment. Energy cost support for vulnerable households. Renewable energy infrastructure.',
                keyCommitments: [
                    'Clean energy',
                    'Cost support',
                    'Renewable investment',
                    'Energy efficiency',
                    'Utility reform'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Empower local communities and councils. Major devolution of power from Westminster. Support for community initiatives and volunteering.',
                keyCommitments: [
                    'Local power',
                    'Council devolution',
                    'Community support',
                    'Volunteering',
                    'Local empowerment'
                ]
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'NATO commitment and defence spending. Cyber security. Support for armed forces and veterans.',
                keyCommitments: [
                    'NATO support',
                    'Defence spending',
                    'Cyber security',
                    'Armed forces support',
                    'Veterans care'
                ]
            }
        ]
    };

    return createStandardManifesto(base, 'Liberal Democrats');
}

/**
 * GREEN PARTY - STANDARDIZED
 */
function getGreenManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'green',
        party: 'Green Party',
        leader: 'Co-leaders',
        version: '1.0',
        colour: '#6AB023',
        sourceUrl: 'https://policy.greenparty.org.uk',
        description: 'Real hope. Real change. - Environmental sustainability combined with social justice',
        keyline: '£40bn annual green investment, wealth tax, public ownership, climate emergency response',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'Free NHS expansion with mental health priority. Public care services with fair pay. Integrated preventative healthcare approach.',
                keyCommitments: [
                    'NHS expansion',
                    'Mental health priority',
                    'Public care services',
                    'Fair care worker pay',
                    'Preventative medicine'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Wealth tax (1% on assets £10m+, 2% on assets £1bn+) to fund public services. Capital gains tax reform. Public ownership of railways and utilities.',
                keyCommitments: [
                    'Wealth tax implementation',
                    'Capital gains reform',
                    'Public railways',
                    'Public energy utilities',
                    'Fair taxation'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: '£40bn annual investment in green economy. Carbon tax to drive fossil fuels out. Switch to renewable energy infrastructure. Green manufacturing and sustainable industries.',
                keyCommitments: [
                    '£40bn green investment',
                    'Carbon tax',
                    'Fossil fuel phase-out',
                    'Renewable transition',
                    'Green manufacturing'
                ]
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: '150,000 new social homes annually. Rent controls to prevent displacement. End no-fault evictions. Community land trusts. Eliminate homelessness.',
                keyCommitments: [
                    '150,000 social homes yearly',
                    'Rent controls',
                    'End no-fault evictions',
                    'Community land trusts',
                    'Homelessness elimination'
                ]
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Well-funded public education system. Teacher recruitment and pay improvement. Skills training and retraining programs. Community learning centers.',
                keyCommitments: [
                    'Public education funding',
                    'Teacher pay increase',
                    'Skills programs',
                    'Adult retraining',
                    'Learning centers'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Living wage indexed to living costs. Strong worker protections and rights. Support for disabled workers. Sectoral pay agreements.',
                keyCommitments: [
                    'Living wage indexation',
                    'Worker protections',
                    'Disabled support',
                    'Pay agreements',
                    'Fair work conditions'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Public ownership of railways. Expanded public transport network. Cycling and walking infrastructure. Reduce car dependency.',
                keyCommitments: [
                    'Public railways',
                    'Transport expansion',
                    'Cycling infrastructure',
                    'Walking support',
                    'Car dependency reduction'
                ]
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Reduce child poverty through investment. Support vulnerable on low incomes. Fair welfare system. Child benefit investment.',
                keyCommitments: [
                    'Child poverty reduction',
                    'Vulnerable support',
                    'Fair welfare',
                    'Child benefit',
                    'Income support'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Justice system reform. Focus on rehabilitation over punishment. Community policing. Crime prevention through social support.'
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Asylum protection and dignity. Humane migration policies. Integration support. Anti-racism commitment.',
                keyCommitments: [
                    'Asylum protection',
                    'Humane migration',
                    'Integration support',
                    'Anti-racism',
                    'Refugee support'
                ]
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Public ownership of energy companies. Renewable energy infrastructure. Energy efficiency programs. Reduce energy costs for households.',
                keyCommitments: [
                    'Public energy ownership',
                    'Renewable infrastructure',
                    'Energy efficiency',
                    'Cost reduction',
                    'Utility reform'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Community empowerment and local control. Support for local councils and community initiatives. Devolution of power.'
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Reduced military spending, investment in conflict prevention. Cyber security. Peace-focused international relations.'
            }
        ]
    };

    return createStandardManifesto(base, 'Green Party');
}

/**
 * REFORM UK - STANDARDIZED
 */
function getReformManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'reform',
        party: 'Reform UK',
        leader: 'Nigel Farage',
        version: '1.0',
        colour: '#00A3E0',
        sourceUrl: 'https://www.reformparty.uk/manifesto',
        description: 'Restore Britain\'s Power & Prosperity',
        keyline: 'Common sense policies, regain sovereignty, controlled borders, business-friendly',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'NHS improvement through efficiency and choice. Reduce waiting times. Support private healthcare alongside NHS. Healthcare modernisation.',
                keyCommitments: [
                    'NHS efficiency',
                    'Reduce waiting times',
                    'Healthcare choice',
                    'Private options',
                    'Modernisation'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: '£47bn savings from civil service and welfare cuts. Cut business taxes and red tape. Make UK best place for business. Low-tax economy.',
                keyCommitments: [
                    'Business tax cuts',
                    'Red tape reduction',
                    'Regulatory reform',
                    'Competitive environment',
                    'Economic growth'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Scrap Net Zero policies. Pragmatic environmental management. Support fossil fuels alongside new energy sources. Energy independence.',
                keyCommitments: [
                    'Scrap Net Zero',
                    'Energy pragmatism',
                    'Fossil fuel support',
                    'Energy independence',
                    'Practical approach'
                ]
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Increase housing supply through deregulation. Support homeownership. Address homelessness through support services.'
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Education system focused on practical skills. Teacher support. Apprenticeships expansion. Vocational training priority.',
                keyCommitments: [
                    'Skills focus',
                    'Teacher support',
                    'Apprenticeships',
                    'Vocational training',
                    'Employment focus'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Put British workers first. End preferential hiring of foreign workers. Support job creation for British citizens. Competitive wages.',
                keyCommitments: [
                    'British worker priority',
                    'Foreign worker limits',
                    'Job creation',
                    'Competitive wages',
                    'Work support'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Infrastructure investment where economically justified. Transport efficiency. Support bus and rail services.'
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Reduce government spending and bureaucracy. Welfare reform and cuts. Support through economic growth. Lean government.',
                keyCommitments: [
                    'Government cuts',
                    'Welfare reform',
                    'Lean civil service',
                    'Economic growth',
                    'Efficiency focus'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Law and order priority. Tough sentencing for serious crimes. Police support. Community safety enforcement.',
                keyCommitments: [
                    'Tough sentencing',
                    'Police support',
                    'Law and order',
                    'Community safety',
                    'Crime reduction'
                ]
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Stop the boats initiative. Leave ECHR. Secure borders. Illegal immigration zero tolerance. Consistent deportation program.',
                keyCommitments: [
                    'Leave ECHR',
                    'Secure borders',
                    'Illegal immigrant deportation',
                    'Controlled immigration',
                    'Sovereignty protection'
                ]
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Cheap energy for businesses and families. Mix of energy sources. Pragmatic fuel strategy. Energy independence.',
                keyCommitments: [
                    'Low energy costs',
                    'Energy mix',
                    'Fuel independence',
                    'Business support',
                    'Pragmatic approach'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Restore sovereignty to Parliament. Reduce unelected bodies. Support British values and traditions.',
                keyCommitments: [
                    'Parliamentary sovereignty',
                    'Reduce quangos',
                    'British values',
                    'Tradition protection',
                    'Democratic accountability'
                ]
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Rebuild UK defence capabilities. Strong military. Protect national security. Defence spending increase.',
                keyCommitments: [
                    'Defence spending',
                    'Military capability',
                    'UK security',
                    'Armed forces',
                    'Sovereignty protection'
                ]
            }
        ]
    };

    return createStandardManifesto(base, 'Reform UK');
}

/**
 * PLAID CYMRU - STANDARDIZED
 */
function getPlaidCymruManifestoStandardized() {
    const base = {
        country: 'Wales',
        type: 'plaid',
        party: 'Plaid Cymru',
        leader: 'Rhun ap Iorwerth',
        version: '1.0',
        colour: '#005B54',
        sourceUrl: 'https://plaid.cymru/en/about-us/policies/',
        description: 'For Justice, For Ambition, For Wales',
        keyline: 'Welsh interests first, fair funding, devolution, Welsh language protection',
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'Fair funding for NHS Wales. Recruit 500 new GPs. New cancer treatment strategy. Fair pay agreements for care workers. Mental health service expansion.',
                keyCommitments: [
                    'Fair NHS Wales funding',
                    '500 new GPs',
                    'Cancer strategy',
                    'Care worker fair pay',
                    'Mental health services'
                ]
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Support green economy jobs in Wales. Fair taxation system. Business support programs. Digital infrastructure investment. Manufacturing support.',
                keyCommitments: [
                    'Green jobs',
                    'Fair taxation',
                    'Business support',
                    'Digital infrastructure',
                    'Manufacturing revival'
                ]
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Address climate emergency. Community energy initiatives. Green space protection. Sustainable farming support. Environmental protection.',
                keyCommitments: [
                    'Climate action',
                    'Community energy',
                    'Green space',
                    'Sustainable farming',
                    'Environmental protection'
                ]
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Safe, affordable homes for all. Homelessness prevention. Community housing. First-time buyer support.',
                keyCommitments: [
                    'Affordable housing',
                    'Homelessness prevention',
                    'Community housing',
                    'First-time buyers',
                    'Housing security'
                ]
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Quality education funding. Welsh language promotion and protection. Teacher recruitment. Learning excellence. Bilingual education.',
                keyCommitments: [
                    'Education funding',
                    'Welsh language priority',
                    'Teacher recruitment',
                    'Learning quality',
                    'Bilingual education'
                ]
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Fair wages and working conditions. Skills training and apprenticeships. Support for young people. Good jobs creation.',
                keyCommitments: [
                    'Fair wages',
                    'Good conditions',
                    'Skills training',
                    'Youth employment',
                    'Job creation'
                ]
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Secure £4bn for Welsh public transport. Reform railways in Wales. Rural connectivity. Active travel infrastructure.',
                keyCommitments: [
                    '£4bn transport fund',
                    'Railways reform',
                    'Rural connectivity',
                    'Active travel',
                    'Bus services'
                ]
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Increase Child Benefit by £20/week. Lift 60,000 Welsh children from poverty. Support families through cost crisis. Affordable childcare.',
                keyCommitments: [
                    'Child Benefit +£20/week',
                    'Child poverty reduction',
                    'Family support',
                    'Cost crisis relief',
                    'Affordable childcare'
                ]
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Welsh-led justice system reform. Community policing. Crime prevention. Support for victims.'
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Oppose harsh UK immigration policies. Humane asylum approach. Integration support. Welcome refugees.',
                keyCommitments: [
                    'Humane asylum',
                    'Refugee support',
                    'Integration programs',
                    'Anti-racism',
                    'Dignity protection'
                ]
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Clean energy transition with Welsh-led investment. Renewable energy infrastructure. Energy cost support. Utility reform.',
                keyCommitments: [
                    'Clean energy',
                    'Renewable investment',
                    'Cost support',
                    'Utility reform',
                    'Energy security'
                ]
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Fully devolve justice powers to Wales. Strengthen Welsh devolution. Reject Westminster control. Welsh self-determination. Local empowerment.',
                keyCommitments: [
                    'Full justice devolution',
                    'Strengthen devolution',
                    'Welsh self-determination',
                    'Reject Westminster control',
                    'Local empowerment'
                ]
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Welsh-led approach to defence. Support for Welsh regiments. National security with Welsh interests priority.',
                keyCommitments: [
                    'Welsh approach',
                    'Regiment support',
                    'National security',
                    'Welsh interests',
                    'Devolved defence'
                ]
            }
        ]
    };

    return createStandardManifesto(base, 'Plaid Cymru');
}

/**
 * COMMUNITY MANIFESTO - STANDARDIZED
 */
function getCommunityManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'community',
        leader: 'Cloud Beacon Community',
        version: '2.3',
        description: 'Collective policy positions aggregated from community votes',
        totalVotes: 2847,
        contributors: 156,
        billsVotedOn: 24,
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'The community strongly supports investment in NHS capacity and workforce. Consensus position: increase health spending by at least 5% annually, reduce waiting lists to under 6 weeks, protect free at point of service principles.',
                votes: { support: 1247, oppose: 398, abstain: 178 }
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'Community supports establishing fair wage levels indexed to living costs, supporting sectoral pay agreements, and strengthening worker protections. Living wage floor of £15/hour broadly supported.',
                votes: { support: 1834, oppose: 587, abstain: 234 }
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'Climate action is a key community priority. Broad support for accelerating net-zero targets to 2040, investing in renewable energy, and protecting natural habitats. Jobs creation compatibility emphasized.',
                votes: { support: 2156, oppose: 412, abstain: 187 }
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'Community prioritizes building affordable homes and expanding homeownership. Strong support for new build requirements, ending no-fault evictions, first-time buyer assistance, and community land trusts.',
                votes: { support: 2103, oppose: 234, abstain: 89 }
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'Investing in education is a top community priority. Support for increased teacher pay, reduced class sizes, universal early childhood education, and skills retraining for adults.',
                votes: { support: 1741, oppose: 279, abstain: 142 }
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'Community supports fair work standards, strong worker protections, and living wages. Ban zero-hours contracts, sick pay from day one, and strong employment rights enforcement.',
                votes: { support: 1834, oppose: 587, abstain: 234 }
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Community supports investment in public transport, railways reform into public ownership, and regional connectivity improvement.'
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Supporting families through cost of living crisis is a priority. Community supports fair welfare system, targeted support for vulnerable, and child poverty reduction.'
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Community supports community policing, crime prevention focus, and criminal justice reform. Rehabilitation emphasis over purely punitive approaches.'
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Community supports humane immigration system, asylum protection, and integration support for migrants. Rejection of harsh border policies.'
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Community supports renewable energy transition, lower household bills, and public investment in energy infrastructure. Energy independence emphasis.'
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Community supports empowering local government, devolution of power from Westminster, and local community decision-making.'
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Community supports NATO commitment, modern defence capabilities for UK security, and support for armed forces and veterans.'
            }
        ]
    };

    return createStandardManifesto(base, 'Community');
}

/**
 * PERSONAL MANIFESTO - STANDARDIZED
 */
function getPersonalManifestoStandardized() {
    const base = {
        country: 'UK',
        type: 'personal',
        leader: 'Your Personal Manifesto',
        version: '1.0',
        description: 'Your personal policy positions based on your votes',
        totalVotes: 47,
        contributors: 1,
        billsVotedOn: 47,
        
        policies: [
            {
                area: 'health',
                title: 'Health & Social Care',
                icon: '🏥',
                position: 'You support significant NHS investment with particular focus on reducing waiting times and expanding mental health services.',
                yourVote: 'support'
            },
            {
                area: 'economy',
                title: 'Economy & Business',
                icon: '💼',
                position: 'You believe workers deserve fair pay and protections, with living wages indexed to living costs.',
                yourVote: 'support'
            },
            {
                area: 'environment',
                title: 'Environment & Climate',
                icon: '🌍',
                position: 'You prioritize climate action and renewable energy transition for sustainable future.'
            },
            {
                area: 'housing',
                title: 'Housing & Homelessness',
                icon: '🏠',
                position: 'You prioritize building affordable housing and ending homelessness through comprehensive social housing programs.',
                yourVote: 'support'
            },
            {
                area: 'education',
                title: 'Education & Skills',
                icon: '🎓',
                position: 'You support well-funded public education and teacher pay improvements.'
            },
            {
                area: 'employment',
                title: 'Employment & Workers Rights',
                icon: '👷',
                position: 'You support strong worker protections and fair wages.'
            },
            {
                area: 'transport',
                title: 'Public Transport & Infrastructure',
                icon: '🚂',
                position: 'Your position on public transport has not yet been determined by your votes.'
            },
            {
                area: 'costliving',
                title: 'Cost of Living & Welfare',
                icon: '💷',
                position: 'Your position on cost of living support has not yet been determined by your votes.'
            },
            {
                area: 'crime',
                title: 'Crime & Justice',
                icon: '⚖️',
                position: 'Your position on crime and justice has not yet been determined by your votes.'
            },
            {
                area: 'immigration',
                title: 'Immigration & Asylum',
                icon: '🌐',
                position: 'Your position on immigration and asylum has not yet been determined by your votes.'
            },
            {
                area: 'energy',
                title: 'Energy & Utilities',
                icon: '⚡',
                position: 'Your position on energy policy has not yet been determined by your votes.'
            },
            {
                area: 'devolution',
                title: 'Local Government & Devolution',
                icon: '🏛️',
                position: 'Your position on local government has not yet been determined by your votes.'
            },
            {
                area: 'defence',
                title: 'Defence & Security',
                icon: '🛡️',
                position: 'Your position on defence and security has not yet been determined by your votes.'
            }
        ]
    };

    return createStandardManifesto(base, 'Your account');
}
