/**
 * Central Constants Module
 * 
 * Single source of truth for all project-wide constants, configurations,
 * and enumeration values. Eliminates duplication and enables consistent
 * behavior across the entire application.
 * 
 * PURPOSE:
 * - Centralize category definitions (used 3+ times throughout codebase)
 * - Consolidate color schemes and visual constants
 * - Define role hierarchies and permissions
 * - Store enumerations for vote types, statuses, etc.
 * 
 * USAGE:
 * import { CATEGORIES, CATEGORY_CONFIG, SKILLS_BY_CATEGORY } from './constants.js';
 * 
 * ADOPTION GUIDE FOR OTHER DEVELOPERS:
 * This module is designed to be copied and adapted for similar projects.
 * 
 * 1. CATEGORIES - Modify to match your project domains
 * 2. SKILLS_BY_CATEGORY - Update taxonomy for your use case
 * 3. ROLE_HIERARCHY - Adjust permissions as needed
 * 4. Add new constants sections for your features
 * 
 * Each section includes usage examples showing where it's used in the app.
 * 
 * LAST UPDATED: February 25, 2026
 * 
 * @module constants
 */

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT CATEGORIES & VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main project categories and their visual properties
 * 
 * USAGE LOCATIONS:
 * - app.js: Line 1953 - Render project cards in feed
 * - projectpage.js: Line 638 - Display category badge
 * - Everywhere: Filter by category, color-coding UI elements
 * 
 * STRUCTURE:
 * - name: Human-readable name
 * - color: Hex color for UI elements (badges, icons, backgrounds)
 * - icon: Emoji icon for visual identification
 * - description: One-line description for tooltips
 * 
 * ADAPTATION TIPS:
 * - Change colors to match your brand
 * - Update icons to fit your project domains
 * - Add/remove categories based on business needs
 * - Consider accessibility when choosing colors
 */
export const CATEGORY_CONFIG = {
    Tech: {
        name: 'Tech',
        color: '#6366f1',           // Indigo
        icon: '💻',
        description: 'Technology & Software Projects'
    },
    Civil: {
        name: 'Civil',
        color: '#f59f00',           // Amber
        icon: '🏗️',
        description: 'Civil & Infrastructure Projects'
    },
    Community: {
        name: 'Community',
        color: '#ec4899',           // Pink
        icon: '🤝',
        description: 'Community & Social Projects'
    },
    Law: {
        name: 'Law',
        color: '#0ca678',           // Teal
        icon: '⚖️',
        description: 'Legal & Governance Projects'
    },
    // Legacy category mappings for backward compatibility
    Physical: {
        name: 'Physical',
        color: '#f59f00',           // Maps to Civil
        icon: '🏗️',
        description: 'Physical Infrastructure'
    },
    Inventive: {
        name: 'Inventive',
        color: '#6366f1',           // Maps to Tech
        icon: '💡',
        description: 'Creative & Inventive Projects'
    }
};

/**
 * Quick access to category colors (legacy format for backward compatibility)
 * 
 * USAGE:
 * const color = CATEGORY_COLORS[item.category] || '#5c7cfa';
 * 
 * DEPRECATED: Use CATEGORY_CONFIG instead for better structure
 * Kept here for gradual migration in existing code
 */
export const CATEGORY_COLORS = Object.fromEntries(
    Object.entries(CATEGORY_CONFIG).map(([key, val]) => [key, val.color])
);

/**
 * Quick access to category icons (legacy format for backward compatibility)
 * 
 * USAGE:
 * const icon = CATEGORY_ICONS[item.category] || '📁';
 */
export const CATEGORY_ICONS = Object.fromEntries(
    Object.entries(CATEGORY_CONFIG).map(([key, val]) => [key, val.icon])
);

/**
 * List of all valid categories (for validation, filtering)
 * 
 * USAGE:
 * if (!VALID_CATEGORIES.includes(selectedCategory)) { throw error; }
 * projects.filter(p => VALID_CATEGORIES.includes(p.category));
 */
export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIG);

/**
 * Default category (fallback if not specified)
 */
export const DEFAULT_CATEGORY = 'Tech';

/**
 * Default color (fallback if category not found)
 */
export const DEFAULT_COLOR = '#5c7cfa';

/**
 * Default icon (fallback if category not found)
 */
export const DEFAULT_ICON = '📁';


// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY-SPECIFIC RENDERING TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Category rendering templates for project metadata display
 * 
 * REPLACES: Long if/else chains in projectpage.js renderMetaGrid() function
 * 
 * PROBLEM SOLVED:
 * Previously, category-specific rendering had separate if statements for each
 * category, with duplicated patterns and scattered logic.
 * 
 * USAGE:
 * const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.default;
 * renderProjectFields(template.fields);
 * 
 * STRUCTURE:
 * - fields: Array of field names to display for this category
 * - labels: Custom labels for fields (if different from defaults)
 * - icons: Visual indicators for category
 * - validation: Field-specific validation rules
 * 
 * ADAPTATION:
 * - Add new categories by extending this object
 * - Modify field order to prioritize important data
 * - Add validation rules as categories grow
 */
export const CATEGORY_TEMPLATES = {
    Tech: {
        name: 'Technology Project',
        fields: ['problem', 'solution', 'technology_stack', 'timeline', 'budget'],
        icon: '💻',
        color: CATEGORY_CONFIG.Tech.color,
        description: 'Software, web, or technology-focused project'
    },
    Civil: {
        name: 'Civil Infrastructure',
        fields: ['problem', 'solution', 'location', 'materials', 'timeline', 'budget', 'environmental_impact'],
        icon: '🏗️',
        color: CATEGORY_CONFIG.Civil.color,
        description: 'Infrastructure, construction, or civil engineering project'
    },
    Community: {
        name: 'Community Project',
        fields: ['problem', 'solution', 'community_impact', 'timeline', 'participants'],
        icon: '🤝',
        color: CATEGORY_CONFIG.Community.color,
        description: 'Community-driven social impact project'
    },
    Law: {
        name: 'Legal/Governance Project',
        fields: ['problem', 'solution', 'legislative_area', 'stakeholders', 'timeline'],
        icon: '⚖️',
        color: CATEGORY_CONFIG.Law.color,
        description: 'Policy, legal reform, or governance-related project'
    },
    Physical: {
        name: 'Physical Infrastructure',
        fields: ['problem', 'solution', 'location', 'materials', 'timeline', 'budget'],
        icon: '🏗️',
        color: CATEGORY_CONFIG.Physical.color,
        description: 'Physical infrastructure or construction project'
    },
    Inventive: {
        name: 'Innovative Project',
        fields: ['problem', 'solution', 'innovation_focus', 'timeline', 'budget'],
        icon: '💡',
        color: CATEGORY_CONFIG.Inventive.color,
        description: 'Creative or innovative project'
    },
    default: {
        name: 'General Project',
        fields: ['problem', 'solution', 'timeline'],
        icon: '📁',
        color: DEFAULT_COLOR,
        description: 'General project'
    }
};


// ═══════════════════════════════════════════════════════════════════════════
// FEED FILTER RULES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feed filter rules for categorizing content
 * 
 * REPLACES: Long if/else chains in app.js loadPosts() function
 * 
 * PROBLEM SOLVED:
 * Filter logic was scattered across multiple if statements with complex
 * type checking. This centralizes all filter definitions.
 * 
 * USAGE:
 * const rule = FILTER_RULES[activeFilter];
 * const filtered = items.filter(rule);
 * 
 * STRUCTURE:
 * - Key: Filter name (e.g., 'posts', 'projects')
 * - Value: Function that tests if item matches this filter
 * 
 * ADAPTATION:
 * - Add new filters by adding new entries
 * - Modify filter logic without editing app.js
 * - Combine filters with combined rule functions
 */
export const FILTER_RULES = {
    posts: (item) => item.type === 'post' || item.type === 'project-update',
    
    projects: (item) => item.type === 'project' || item.type === 'legislation' || item.type === 'repost',
    
    legislation: (item) => item.type === 'legislation',
    
    government: (item) => item.type === 'legislation' && item.category === 'Government Bill',
    
    private: (item) => item.type === 'legislation' && item.category === "Private Member's Bill",
    
    lords: (item) => item.type === 'legislation' && item.category === 'Lords Bill',
    
    // Default filter - show all non-archived items
    all: (item) => !item.archived,
    
    // Combine multiple filters with AND
    combine: (...filters) => (item) => filters.every(f => f(item)),
    
    // Find any matching filter with OR
    any: (...filters) => (item) => filters.some(f => f(item))
};


// ═══════════════════════════════════════════════════════════════════════════
// SKILLS TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Professional skills organized by category
 * 
 * USAGE LOCATIONS:
 * - profile.js: Line 18 - Display/edit user skills
 * - profile.js: Line 1400+ - Handle skill search and validation
 * - talent search: Filter users by skills
 * - project matching: Suggest collaborators
 * 
 * STRUCTURE:
 * - Key: Skill category name
 * - Value: Array of specific skills within that category
 * 
 * ADAPTATION TIPS:
 * - Add new categories as your industry expands
 * - Update skills yearly based on market demands
 * - Remove skills that are obsolete
 * - Keep categories at 15-20 max for better UX
 * - Each category should have 10-50 skills
 * 
 * STATISTICS:
 * - Total categories: 18
 * - Total skills: 350+
 * - Most common category: Software & Development
 */
export const SKILLS_BY_CATEGORY = {
    'Software & Development': [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift',
        'Kotlin', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
        'Django', 'Flask', 'Spring Boot', 'AWS', 'Azure', 'Google Cloud', 'Docker',
        'Kubernetes', 'Git', 'CI/CD', 'DevOps', 'Linux', 'Windows Server', 'Bash', 'SQL',
        'MongoDB', 'PostgreSQL', 'REST APIs', 'GraphQL', 'Cybersecurity', 'Penetration Testing',
        'Machine Learning', 'AI'
    ],
    'Design & Creative': [
        'UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
        'InDesign', 'Graphic Design', 'Web Design', 'Mobile Design', 'Animation',
        'Motion Graphics', 'Video Editing', 'Premiere Pro', 'After Effects', 'Final Cut Pro',
        'DaVinci Resolve', 'Color Grading', 'Photography', 'Photo Retouching', 'Branding',
        'Logo Design', '3D Design', 'Blender'
    ],
    'Business & Management': [
        'Project Management', 'Agile', 'Scrum', 'Kanban', 'Change Management',
        'Strategic Planning', 'Business Analysis', 'Market Research', 'Product Management',
        'Stakeholder Management', 'Risk Management', 'Compliance', 'Supply Chain',
        'Operations Management'
    ],
    'Trades & Construction': [
        'Carpentry', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Masonry', 'Welding',
        'Painting', 'Drywall', 'Tile Work', 'Flooring', 'Framing', 'Finishing', 'Demolition',
        'Excavation', 'Heavy Equipment', 'Concrete Work', 'General Contracting'
    ],
    'Manufacturing & Engineering': [
        'CAD', 'AutoCAD', 'SolidWorks', 'CATIA', '3D Modeling', 'CNC Programming', 'Machining',
        'Quality Control', 'Technical Drawing', 'Mechanical Engineering', 'Manufacturing Engineering',
        'Process Improvement', 'Production Planning'
    ],
    'Finance & Accounting': [
        'Bookkeeping', 'Tax Preparation', 'Financial Analysis', 'Auditing', 'QuickBooks', 'Excel',
        'Accounting Software', 'Payroll Processing', 'Budget Planning', 'Cost Analysis',
        'Financial Reporting', 'Accounts Payable', 'Accounts Receivable', 'Payroll Administration',
        'Tax Planning', 'Investment Analysis', 'Treasury Management'
    ],
    'Sales & Customer Service': [
        'Sales', 'B2B Sales', 'B2C Sales', 'Sales Management', 'Customer Service',
        'Customer Support', 'Technical Support', 'Telemarketing', 'Lead Generation', 'CRM',
        'Salesforce', 'Negotiation', 'Client Relationship', 'Account Management',
        'Retention Management', 'Complaint Resolution', 'Service Recovery'
    ],
    'Writing & Content': [
        'Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing', 'Article Writing',
        'SEO Writing', 'Journalism', 'Editing', 'Proofreading', 'Scriptwriting', 'Screenwriting',
        'Ghostwriting', 'Documentation', 'Translation', 'Localization', 'Content Marketing',
        'Social Media Content'
    ],
    'Teaching & Training': [
        'K-12 Teaching', 'Higher Education', 'Corporate Training', 'Online Teaching',
        'Curriculum Development', 'Lesson Planning', 'Student Assessment', 'English Teaching',
        'Math Teaching', 'Science Teaching', 'Language Teaching', 'Technical Training',
        'Professional Development', 'Mentoring', 'Coaching'
    ],
    'Marketing & Communications': [
        'Digital Marketing', 'Social Media Marketing', 'Email Marketing', 'Content Marketing',
        'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'LinkedIn Marketing', 'Brand Strategy',
        'Public Relations', 'Communications', 'Event Marketing', 'Influencer Marketing'
    ],
    'Healthcare & Wellness': [
        'Nursing', 'Medical Assistant', 'Physical Therapy', 'Occupational Therapy', 'Counseling',
        'Psychology', 'Nutrition', 'Fitness Training', 'Massage Therapy', 'Acupuncture',
        'Mental Health Support', 'Healthcare Administration', 'Medical Coding', 'Pharmacy', 'Dentistry'
    ],
    'Legal & Compliance': [
        'Contract Law', 'Corporate Law', 'Employment Law', 'Intellectual Property',
        'Regulatory Compliance', 'Legal Research', 'Document Review', 'Paralegal Services',
        'Legal Writing', 'Compliance Auditing', 'Policy Development', 'Risk Assessment'
    ],
    'Logistics & Operations': [
        'Supply Chain Management', 'Warehousing', 'Inventory Management', 'Logistics Planning',
        'Distribution', 'Procurement', 'Vendor Management', 'Quality Assurance', 'Process Optimization',
        'Systems Management', 'Operations Planning', 'Route Planning'
    ],
    'Data & Analytics': [
        'Data Analysis', 'Business Intelligence', 'Data Visualization', 'Tableau', 'Power BI',
        'Google Analytics', 'SQL', 'R Programming', 'Python Data Science', 'Statistics',
        'Data Science', 'Data Engineering', 'Big Data', 'Predictive Analytics', 'Data Mining'
    ],
    'Hospitality & Service': [
        'Hotel Management', 'Restaurant Management', 'Event Planning', 'Catering', 'Bartending',
        'Sommelier', 'Front Desk Operations', 'Housekeeping', 'Concierge Service'
    ],
    'Agriculture & Environment': [
        'Farming', 'Crop Management', 'Livestock Management', 'Soil Analysis', 'Irrigation',
        'Pest Management', 'Environmental Consulting', 'Sustainability', 'Water Management',
        'Forest Management', 'Organic Farming'
    ],
    'Transportation & Logistics': [
        'Truck Driving', 'Commercial Driving', 'Fleet Management', 'Route Optimization',
        'Cargo Handling', 'Transportation Coordination', 'Vehicle Maintenance', 'Logistics Coordination'
    ],
    'Miscellaneous Services': [
        'Handyperson', 'IKEA Assembly', 'Furniture Repair', 'Appliance Repair', 'Locksmith',
        'Home Cleaning', 'Yard Work', 'Pet Sitting', 'Dog Walking', 'Babysitting',
        'Virtual Assistant', 'Data Entry', 'Transcription', 'Research Assistant'
    ]
};

/**
 * Quick lookup: Get all skills or skills by category
 * 
 * USAGE:
 * const allSkills = getAllSkills();
 * const selected = SKILLS_BY_CATEGORY['Software & Development'];
 */
export function getAllSkills() {
    return Object.values(SKILLS_BY_CATEGORY).flat();
}

/**
 * Quick lookup: Get category for a specific skill
 * 
 * USAGE:
 * const category = getSkillCategory('React');  // Returns 'Software & Development'
 */
export function getSkillCategory(skill) {
    for (const [category, skills] of Object.entries(SKILLS_BY_CATEGORY)) {
        if (skills.includes(skill)) return category;
    }
    return null;
}


// ═══════════════════════════════════════════════════════════════════════════
// ROLE HIERARCHY & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Team member roles and their permissions
 * 
 * USAGE LOCATIONS:
 * - projectpage.js: Line 630 - Role assignment in team management
 * - projectpage.js: Line 1500+ - Permission checks before actions
 * - project.html: Role dropdown in team modal
 * 
 * ROLE HIERARCHY (highest to lowest):
 * 1. Creator (auto-assigned, can't be changed)
 * 2. Admin (full permissions except delete project)
 * 3. Lead (manage team, edit content, but not settings)
 * 4. Member (contribute, edit own content)
 * 5. Viewer (read-only access)
 * 
 * ADAPTATION TIPS:
 * - Add new roles if your workflow needs them
 * - Adjust permissions based on business requirements
 * - Keep role count < 6 for simpler UX
 */
export const ROLE_HIERARCHY = {
    Creator: {
        level: 5,
        label: 'Creator',
        permissions: ['view', 'edit', 'delete', 'manage_team', 'manage_settings'],
        canDelete: true,
        canTransfer: true,
        canRemove: true,
        canChangeRoles: true,
        description: 'Project creator - full access'
    },
    Admin: {
        level: 4,
        label: 'Admin',
        permissions: ['view', 'edit', 'delete', 'manage_team'],
        canDelete: false,
        canTransfer: false,
        canRemove: true,
        canChangeRoles: true,
        description: 'Administrator - can manage team and content'
    },
    Lead: {
        level: 3,
        label: 'Lead',
        permissions: ['view', 'edit', 'manage_team'],
        canDelete: false,
        canTransfer: false,
        canRemove: false,
        canChangeRoles: false,
        description: 'Lead - can edit content and manage team'
    },
    Member: {
        level: 2,
        label: 'Member',
        permissions: ['view', 'edit'],
        canDelete: false,
        canTransfer: false,
        canRemove: false,
        canChangeRoles: false,
        description: 'Team member - can view and contribute'
    },
    Viewer: {
        level: 1,
        label: 'Viewer',
        permissions: ['view'],
        canDelete: false,
        canTransfer: false,
        canRemove: false,
        canChangeRoles: false,
        description: 'Viewer - can view only (read-only)'
    }
};

/**
 * Valid roles list (for validation)
 */
export const VALID_ROLES = Object.keys(ROLE_HIERARCHY);

/**
 * Check if user with role A can manage user with role B
 * 
 * USAGE:
 * if (canManageRole(userRole, targetRole)) { allowAction(); }
 */
export function canManageRole(managerRole, targetRole) {
    const managerLevel = ROLE_HIERARCHY[managerRole]?.level || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole]?.level || 0;
    return managerLevel > targetLevel;
}

/**
 * Check if role has specific permission
 * 
 * USAGE:
 * if (hasPermission('Admin', 'manage_team')) { allowAction(); }
 */
export function hasPermission(role, permission) {
    return ROLE_HIERARCHY[role]?.permissions?.includes(permission) || false;
}


// ═══════════════════════════════════════════════════════════════════════════
// VOTING & ENGAGEMENT CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vote types available in the platform
 * 
 * USAGE LOCATIONS:
 * - votingSystem.js: Record user votes
 * - posts.js: Handle upvote/downvote
 * - projectpage.js: Vote on project proposals
 */
export const VOTE_TYPES = {
    UP: 'up',
    DOWN: 'down',
    NEUTRAL: 'neutral'
};

/**
 * Project status states
 * 
 * USAGE:
 * - projectpage.js: Filter projects by status
 * - projects.js: Update project state
 * - UI: Show status badges
 */
export const PROJECT_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
};

/**
 * Proposal states (for voting on new projects)
 * 
 * USAGE:
 * - app.js: Show upcoming projects
 * - projects.js: Vote on proposals
 */
export const PROPOSAL_STATUS = {
    PROPOSED: 'proposed',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn'
};


// ═══════════════════════════════════════════════════════════════════════════
// UI & DISPLAY CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safe domains for embedded media
 * 
 * USAGE:
 * - profile.js: Validate embed URLs before displaying
 * - Prevents XSS and other security issues
 */
export const SAFE_EMBED_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'spotify.com',
    'soundcloud.com',
    'vimeo.com',
    'twitch.tv',
    'codepen.io'
];

/**
 * Maximum file sizes for uploads (in bytes)
 * 
 * USAGE:
 * - projectpage.js: Validate files before upload
 * - profile.js: Validate profile images
 */
export const FILE_SIZE_LIMITS = {
    IMAGE: 5 * 1024 * 1024,              // 5 MB
    DOCUMENT: 10 * 1024 * 1024,          // 10 MB
    VIDEO: 50 * 1024 * 1024,             // 50 MB
    PROFILE_IMAGE: 2 * 1024 * 1024       // 2 MB
};

/**
 * Allowed file types by category
 * 
 * USAGE:
 * - projectpage.js: Validate file uploads
 */
export const ALLOWED_FILE_TYPES = {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
    SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

/**
 * Pagination defaults
 * 
 * USAGE:
 * - Feed: Show 20 posts per page
 * - Projects: Show 15 per page
 */
export const PAGINATION = {
    FEED_ITEMS: 20,
    PROJECTS: 15,
    TEAM_MEMBERS: 10,
    SEARCH_RESULTS: 25
};


// ═══════════════════════════════════════════════════════════════════════════
// SPACING & SIZING CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standardized spacing values for consistent UI layout
 * 
 * These values are used heavily throughout CSS files and should be
 * referenced in CSS custom properties. Common patterns:
 * - gap, margin, padding use these values
 * - Keeps design consistent without needing to know exact pixel values
 * 
 * USAGE in CSS files:
 * gap: var(--spacing-lg);        (20px gaps)
 * padding: var(--spacing-md);    (16px padding)
 * 
 * CUSTOMIZATION:
 * To adjust all spacing globally, update these values
 * This will cascade through CSS via custom properties
 */
export const SPACING = {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px',
    xxxl: '20px'
};

/**
 * Standardized font sizes for consistent typography
 * 
 * USAGE in CSS:
 * font-size: var(--size-font-base);
 * 
 * CONSISTENCY:
 * - Headlines: xl or xxl
 * - Body text: base or sm
 * - Meta text: xs or sm
 */
export const TYPOGRAPHY = {
    sizes: {
        xs: '11px',
        sm: '12px',
        base: '13px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        xxl: '20px',
        xxxl: '28px'
    },
    weights: {
        normal: '400',
        medium: '500',
        semibold: '600'
    }
};

/**
 * Standardized border radius values for consistent rounded corners
 * 
 * USAGE:
 * border-radius: var(--br-md);
 * 
 * PATTERN:
 * - Cards and containers: md
 * - Buttons and tags: sm
 * - Pills and badges: full
 */
export const BORDER_RADIUS = {
    none: '0',
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '12px'
};

/**
 * Standardized shadows for consistent depth effects
 * 
 * USAGE:
 * box-shadow: var(--shadow-sm);
 */
export const SHADOWS = {
    sm: '0 1px 4px rgba(0,0,0,0.1)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    lg: '0 8px 24px rgba(0,0,0,0.15)'
};

/**
 * Component sizing constants
 * 
 * Used for consistent component dimensions
 */
export const COMPONENT_SIZES = {
    BUTTON_PADDING_SM: '6px 12px',
    BUTTON_PADDING_MD: '8px 16px',
    BUTTON_PADDING_LG: '10px 20px',
    
    INPUT_PADDING: '8px 12px',
    INPUT_MIN_WIDTH: '200px',
    
    MODAL_WIDTH_SM: '500px',
    MODAL_WIDTH_MD: '600px',
    MODAL_WIDTH_LG: '800px',
    
    AVATAR_SM: '32px',
    AVATAR_MD: '55px',
    AVATAR_LG: '80px'
};

/**
 * Z-index layer constants for stacking context
 * 
 * USAGE in CSS:
 * z-index: var(--z-modal);
 * 
 * HIERARCHY:
 * - Base elements: 0
 * - Dropdowns/menus: 100
 * - Floating UI: 100-999
 * - Modals: 1000+
 */
export const Z_INDEX = {
    BASE: 0,
    DROPDOWN: 100,
    FLOATING_MENU: 100,
    MODAL: 2000,
    OVERLAY: 2000
};

/**
 * Transition/animation timing
 * 
 * USAGE in CSS:
 * transition: all var(--transition-fast);
 */
export const TRANSITIONS = {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease'
};


// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature flags for enabling/disabling features
 * 
 * USAGE:
 * if (FEATURES.MESSAGING_ENABLED) { renderChatTab(); }
 * 
 * ADAPTATION: Set to false to disable features during development
 */
export const FEATURES = {
    MESSAGING_ENABLED: true,
    NOTIFICATIONS_ENABLED: true,
    PROPOSALS_VOTING: true,
    TEAM_MANAGEMENT: true,
    FILE_UPLOADS: true,
    PUBLIC_PROFILES: true,
    SEARCH_ENABLED: true,
    VOTING_SYSTEM: true
};

/**
 * API endpoints for external services
 * 
 * USAGE:
 * - Legislation.js: Fetch Parliament bills
 * - functions/index.js: CORS proxy routes
 */
export const API_ENDPOINTS = {
    PARLIAMENT_BILLS: 'https://bills-api.parliament.uk/api/bills',
    PARLIAMENT_MEMBERS: 'https://data.parliament.uk/api/Members',
    ELECTION_DATA: 'https://api.elections.example.com/data',
    // Cloud Function proxies (for CORS avoidance)
    FUNCTION_BASE: 'https://us-central1-cloud-beacon-55a40.cloudfunctions.net'
};


// ═══════════════════════════════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get color for a category (backward compatibility wrapper)
 * 
 * USAGE:
 * const color = getCategoryColor('Tech');  // Returns '#6366f1'
 */
export function getCategoryColor(category) {
    return CATEGORY_CONFIG[category]?.color || DEFAULT_COLOR;
}

/**
 * Get icon for a category
 * 
 * USAGE:
 * const icon = getCategoryIcon('Tech');  // Returns '💻'
 */
export function getCategoryIcon(category) {
    return CATEGORY_CONFIG[category]?.icon || DEFAULT_ICON;
}

/**
 * Validate if value is valid category
 * 
 * USAGE:
 * if (!isValidCategory(input)) { throwError('Invalid category'); }
 */
export function isValidCategory(category) {
    return VALID_CATEGORIES.includes(category);
}

/**
 * Validate if value is valid role
 */
export function isValidRole(role) {
    return VALID_ROLES.includes(role);
}

/**
 * Get role level (for permission checking)
 * 
 * USAGE:
 * const level = getRoleLevel('Admin');  // Returns 4
 */
export function getRoleLevel(role) {
    return ROLE_HIERARCHY[role]?.level || 0;
}

/**
 * Get all permissions for a role (flattened array)
 * 
 * @param {string} role - Role name
 * @returns {array} Array of permission strings
 * 
 * USAGE:
 * const perms = getRolePermissions('Admin');
 * // Returns ['view', 'edit', 'delete', 'manage_team']
 */
export function getRolePermissions(role) {
    return ROLE_HIERARCHY[role]?.permissions || [];
}

/**
 * Get category template for category-specific rendering
 * 
 * @param {string} category - Category name
 * @returns {object} Template object with fields, icons, colors, etc.
 * 
 * USAGE:
 * const template = getCategoryTemplate('Tech');
 * const fieldsToDisplay = template.fields;
 */
export function getCategoryTemplate(category) {
    return CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.default;
}

/**
 * Apply filter rule from FILTER_RULES
 * 
 * @param {string} filterName - Filter key ('posts', 'projects', 'legislation', etc.)
 * @param {object} item - Feed item to test
 * @returns {boolean} True if item matches filter
 * 
 * USAGE:
 * items.filter(item => applyFilter('projects', item));
 * 
 * // Or use the filter rule directly:
 * items.filter(FILTER_RULES.projects);
 */
export function applyFilter(filterName, item) {
    const rule = FILTER_RULES[filterName];
    if (!rule) return true; // Unknown filter shows all
    return rule(item);
}

/**
 * Export everything as a single object (legacy support)
 * 
 * USAGE (not recommended):
 * import * as Constants from './constants.js';
 * const colors = Constants.CATEGORY_COLORS;
 */
