/**
 * Voting Eligibility System
 * Determines whether users can vote on legislation based on their account details
 */

const VotingEligibility = {
    /**
     * Country jurisdiction mappings
     * Maps user countries to eligible legislation territories
     */
    jurisdictionMap: {
        'GB': ['GB', 'UK'], // GB users can vote on UK legislation
        'IE': ['IE', 'IRELAND'], // Ireland users can vote on Irish legislation
        'US': ['US'], // US users can vote on US legislation
        'CA': ['CA', 'CANADA'], // Canada users
        'AU': ['AU', 'AUSTRALIA'], // Australia users
        'NZ': ['NZ', 'NEW_ZEALAND'], // New Zealand users
        'EU': ['EU', 'EUROPEAN', 'FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'NETHERLANDS', 'BELGIUM', 'AUSTRIA', 'POLAND', 'CZECH', 'SLOVAKIA', 'SLOVENIA', 'HUNGARY', 'ROMANIA', 'BULGARIA', 'CROATIA', 'GREECE', 'CYPRUS', 'MALTA', 'PORTUGAL', 'SWEDEN', 'DENMARK', 'FINLAND', 'LUXEMBOURG'], // EU countries and EU-wide legislation
        'OTHER': ['INTERNATIONAL', 'GLOBAL'] // Other countries can vote on international legislation only
    },

    /**
     * Check if user can vote on legislation
     * Returns: { canVote: boolean, reason: string, blockingReason?: string }
     * 
     * NOTE: Only requires COUNTRY to be set. Full name is optional.
     * Users can vote on posts/comments anonymously, but legislation voting requires location.
     */
    async canUserVote(userId, legislationCountries) {
        try {
            // Get user account details
            const userDetails = await this.getUserAccountDetails(userId);
            
            if (!userDetails) {
                return {
                    canVote: false,
                    reason: 'Account details not found',
                    blockingReason: 'Please set your country in Account Settings to vote on legislation'
                };
            }

            // Only check for country - full name is optional
            if (!userDetails.country) {
                return {
                    canVote: false,
                    reason: 'Country not set',
                    blockingReason: 'Please set your country in Account Settings → Account to vote on legislation'
                };
            }

            // Get user's eligible jurisdictions
            const userCountry = userDetails.country;
            const eligibleJurisdictions = this.jurisdictionMap[userCountry] || this.jurisdictionMap['OTHER'];

            // Normalize legislation countries to uppercase for comparison
            const normalizeLegislation = legislationCountries.map(c => c.toUpperCase());

            // Check if any of the legislation countries match user's eligible jurisdictions
            const canVote = normalizeLegislation.some(legCountry => 
                eligibleJurisdictions.some(userJur => 
                    legCountry.includes(userJur) || userJur.includes(legCountry)
                )
            );

            if (!canVote) {
                return {
                    canVote: false,
                    reason: `Your account (${userCountry}) is ineligible for this legislation`,
                    blockingReason: `This legislation is for ${legislationCountries.join(', ')}. You can only vote on ${eligibleJurisdictions.join(', ')} legislation.`
                };
            }

            return {
                canVote: true,
                reason: 'User is eligible to vote',
                userCountry,
                eligibleJurisdictions
            };

        } catch (error) {
            console.error('[Voting] Error checking voting eligibility:', error);
            return {
                canVote: false,
                reason: 'Error checking eligibility',
                blockingReason: error.message
            };
        }
    },

    /**
     * Get user account details from Firestore
     */
    async getUserAccountDetails(userId) {
        try {
            const { db } = await import('./firebase.js');
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (!userDoc.exists()) {
                console.warn(`[Voting] User document not found: ${userId}`);
                return null;
            }

            return userDoc.data();
        } catch (error) {
            console.error('[Voting] Error fetching user details:', error);
            throw error;
        }
    },

    /**
     * Get user's eligible jurisdictions without fetching full details
     */
    async getUserEligibleJurisdictions(userId) {
        try {
            const userDetails = await this.getUserAccountDetails(userId);
            if (!userDetails || !userDetails.country) return [];
            
            return this.jurisdictionMap[userDetails.country] || this.jurisdictionMap['OTHER'];
        } catch (error) {
            console.error('[Voting] Error getting eligible jurisdictions:', error);
            return [];
        }
    },

    /**
     * Validate a project/legislation has proper country metadata
     */
    validateLegislationMetadata(legislation) {
        if (!legislation) {
            return { valid: false, errors: ['Legislation not found'] };
        }

        const errors = [];

        // Check for country/territory field
        if (!legislation.countries && !legislation.country && !legislation.territory && !legislation.territories) {
            errors.push('Legislation missing country/territory information');
        }

        // Check for title
        if (!legislation.title) {
            errors.push('Legislation missing title');
        }

        // Check for description content
        if (!legislation.description && !legislation.content) {
            errors.push('Legislation missing description');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Extract country codes from legislation
     * Handles various metadata field names
     */
    extractCountriesFromLegislation(legislation) {
        const countries = [];

        // Check various possible field names
        if (legislation.countries) {
            countries.push(...(Array.isArray(legislation.countries) ? legislation.countries : [legislation.countries]));
        }
        if (legislation.country) {
            countries.push(...(Array.isArray(legislation.country) ? legislation.country : [legislation.country]));
        }
        if (legislation.territory) {
            countries.push(...(Array.isArray(legislation.territory) ? legislation.territory : [legislation.territory]));
        }
        if (legislation.territories) {
            countries.push(...(Array.isArray(legislation.territories) ? legislation.territories : [legislation.territories]));
        }

        // Remove duplicates and empty strings
        return [...new Set(countries.filter(c => c && c.trim()))];
    },

    /**
     * Check if current user can vote and return detailed info
     */
    async checkCurrentUserVoting(legislationCountries) {
        try {
            const { auth } = await import('./firebase.js');
            const user = auth.currentUser;

            if (!user) {
                return {
                    canVote: false,
                    reason: 'Not logged in',
                    blockingReason: 'Please sign in to vote'
                };
            }

            return await this.canUserVote(user.uid, legislationCountries);
        } catch (error) {
            console.error('[Voting] Error checking current user voting:', error);
            return {
                canVote: false,
                reason: 'Error checking voting eligibility',
                blockingReason: error.message
            };
        }
    }
};

// Expose to window
window.VotingEligibility = VotingEligibility;
console.log('VotingEligibility exposed to window');
