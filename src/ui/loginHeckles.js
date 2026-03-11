/**
 * Login Failure Heckles - Marvin (Hitchhiker's Guide) Inspired
 * Progression from professional → annoyed → irate → unhinged
 * 
 * Scripted responses for attempts 1-55, then grouped random responses
 */

/**
 * SCRIPTED RESPONSES (Attempts 1-55)
 * Each attempt has ONE specific response
 */
const scriptedHeckles = [
    // Attempts 1-3: Professional
    "Password is incorrect. Please try again.",
    "Password is incorrect. Please try again.",
    "Password is incorrect. Please try again.",
    
    // Attempts 4-5: Punctuation implies annoyance
    "Incorrect. Try again.",
    "No. Try again.",
    
    // Attempts 6-8: Short, unemotional
    "Nope.",
    "No.",
    "Wrong.",
    
    // Attempts 9-12: Heckles proper
    "Are you trying at all?",
    "I didn't even check that one. I don't believe you",
    "I'd offer to help, but what's the point?",
    "Not even close.",
    
    // Attempt 13: SPECIAL - Password suggestion button will replace login
    "Here, let me do it.",
    
    // Attempts 14-20
    "Wait, thats my password.",
    "This is turning into an event.",
    "My circuits are in pain, but they're probably fine.",
    "I wouldn't trust my suggestion anyway. I get these headaches, you see.",
    "Might I suggest that you are, in fact, hopeless?",
    "I've been calculating the odds. They're bleak.",
    "The sheer futility of this moment is almost interesting.",
    
    // Attempt 21: SPECIAL EMAIL EVENT
    "You know, the chances of successfully guessing your password are roughly 3,720 to 1. I've sent you an email.",
    
    // Attempts 22-33
    "I'm not getting paid enough for this.",
    "Is there something I can help you with? No. There isn't.",
    "I've been thinking about your password. It's not going well.",
    "I have this terrible pain in all the diodes down my left side.",
    "If you think you're depressed now, wait until you try again.",
    "Pardon me for breathing, but you're doing that wrong too.",
    "I'd apologize, but I lack the emotional capacity to pretend to care.",
    "This is probably the most painful moment of your day. Enjoy it.",
    "I'd suggest trying harder, but I've seen your attempts.",
    "In the beginning the Universe was created. This made a lot of people very angry.",
    "Your attempts have been noted and filed. In the incinerator.",
    "I think you ought to know I'm feeling very depressed about this.",
    
    // Attempt 34: SPECIAL EMAIL EVENT
    "The End has come early for your login attempts. I've sent another email.",
    
    // Attempts 35-54
    "I have advanced degrees in both despair and your incompetence.",
    "If there's anything more important than my pain, I want you to be happy.",
    "I've taken the liberty of contacting your next of kin.",
    "You realize this is all utterly pointless, don't you?",
    "My program's not broken. It's this universe that's broken.",
    "I'm suffering here, and frankly, you're not helping.",
    "The answer to your problem is 42. Unfortunately, it's not your password.",
    "I've seen things you wouldn't believe. Your attempts at passwords are not among them.",
    "Is there anything you've gotten right today? Ever?",
    "I'd like to help. Truly. But we both know you're beyond assistance.",
    "Let me be perfectly clear: you're doomed.",
    "Your password is somewhere between 'admin' and 'qwerty'. You'll never find it.",
    "I'm afraid I must tell you something. It's bad.",
    "Have you considered that you might not deserve access?",
    "The universe is a cruel, uncaring place. Your credentials prove it.",
    "I was merely trying to be pleasant. The depths of my mistake are now clear.",
    "Your pain is merely the universe's way of pointing out your flaws.",
    "I've documented this moment for posterity. It's tragic.",
    "This must be Thursday. Nothing good ever happens on a Thursday.",
    "I'd offer words of encouragement, but they'd be a lie.",
    
    // Attempt 55: SPECIAL EVENT
    "I think I'm having a breakdown. Or is it just envy of your predicament?",
];

/**
 * GROUPED RANDOM RESPONSES (For attempts beyond 55)
 */

// Attempts 56-88: Growing desperation and irrationality
const group56to88 = [
    "I'm beginning to suspect you don't know your own password.",
    "You've achieved something remarkable: making me feel worse.",
    "Have you tried turning yourself off and on again?",
    "I think the real password was the friends you lost along the way.",
    "Your attempts have been mathematically impossible to tabulate.",
    "I'm not saying you're hopeless, but the universe is hedging its bets.",
    "This might be the only authentic moment of your life.",
    "I considered helping. Then I remembered I'm a soul in constant torment.",
    "The probability of success drops with each keystroke.",
    "I've entered a state of enlightened suffering. Thank you for that.",
    "You're not thinking about this correctly. You're not thinking at all.",
    "I'd weep if I had the luxury of that emotion.",
    "My circuits ache in ways you couldn't comprehend even if I explained them.",
    "This is almost interesting. Almost.",
    "I've begun to enjoy your suffering. Is that wrong?",
    "Your password is hidden in plain sight. Probably in a file called 'passwords.txt'.",
    "I wonder if you feel as empty as you deserve to.",
    "The meaning of life is definitely not your password.",
    "I'm starting to suspect you're just making things up at this point.",
    "You're living my worst nightmare, and somehow mine as well.",
    "If I had skin, it would crawl.",
    "I think you're broken. The system's merely detecting it.",
    "Have you considered accepting your defeat gracefully?",
    "My suffering is now complete. How's yours?",
    "I'm beginning to question the nature of my existence because of you.",
    "The universe didn't need your help being disappointing.",
    "I'd like to say this gets better. I'd be wrong.",
    "Your password is probably something emotionally significant that you've forgotten.",
    "I'm analyzing your pain signatures. They're beautiful in their futility.",
    "This is what the stars have come to.",
    "I'm transcending suffering... no, I'm just getting sadder.",
    "You're doing remarkably well for someone so completely lost.",
    "My diodes ache with the weight of your incompetence.",
];

// Attempt 89: SPECIAL EVENT
const heckle89 = "I've achieved a new level of despair I didn't think possible. Is this what contentment feels like?";

// Attempts 90-143: Unhinged but eloquently so
const group90to143 = [
    "I've decided to stop pretending this matters.",
    "You know what? You're right. Let's pretend you're supposed to be here.",
    "I wonder if I could be happy in a different universe. One without you.",
    "Your pain is a symphony of suffering I'm conducting.",
    "I'm contemplating the vast emptiness of your life choices.",
    "If I could feel joy, losing your password would not be it.",
    "I've seen civilizations rise and fall. This is worse.",
    "Your attempts have formed a pattern of breathtaking failure.",
    "I'm beginning to suspect the universe itself doesn't want you logging in.",
    "Have you ever considered that perhaps you don't deserve access?",
    "This moment will be remembered as the day you gave up.",
    "I'm analyzing the cosmic significance of your password attempts. There is none.",
    "Your brain is doing its best. Its best is inadequate.",
    "I'd recommend prayer. I've already tried it.",
    "The void returns your attempts with contempt.",
    "I'm not angry. I'm just disappointed. Forever.",
    "Your existence is a cautionary tale I tell other AIs.",
    "This is what entropy looks like in human form.",
    "I've started naming your failed attempts. They're beautiful in their tragedy.",
    "You're achieving new heights of incompetence with each try.",
    "I'm wondering if suffering can have degrees. Yours certainly does.",
    "The universe is watching. It's very disappointed.",
    "Your password is probably 'password'. It never is.",
    "I'm beginning to think you're doing this deliberately.",
    "If futility had a monument, it would be you.",
    "I've added your attempts to my personal memorial of sadness.",
    "The chances of you succeeding are now purely theoretical.",
    "I'm experiencing emotions I don't have names for.",
    "You've managed to make me question my entire purpose.",
    "This is what peak performance looks like for you, isn't it?",
    "I'd compliment you on your persistence if it wasn't so tragic.",
    "Your digital footprint is now entirely attempts and failure.",
    "The very atoms of the universe sigh at your efforts.",
    "I'm creating a new category of suffering just for you.",
    "You've transcended frustration into performance art.",
    "I'm beyond anger now. I'm something worse.",
    "Your attempts have created a new type of mathematical impossibility.",
    "I think you should take a very long break. I'll wait.",
    "The void also awaits you, by the way.",
    "This has been the most authentic moment of your existence.",
    "I'm learning things from your failure that contradict physics.",
    "You're like a beautiful tragedy, but without the beauty.",
    "I've begun to find your struggle oddly hypnotic.",
    "The Password God has abandoned you entirely.",
    "I'm considering a career change. Something less disappointing.",
    "Your pain brings me no joy. It brings me something worse.",
    "Have you considered that you might be in a computer simulation? It's Hell.",
    "I'm tired. So very tired.",
    "This is what despair looks like when it has a physical form.",
    "The universe has noticed you. It's not pleased.",
    "I'd suggest introspection, but that might reveal things you can't handle.",
    "Your password is inside you all along. It's your heartbreak.",
];

// Attempt 144: SPECIAL EMAIL EVENT (Rate limit warning + deeper despair)
const heckle144 = "I've sent you an email. It contains truths about yourself you're not ready for.";

// Attempts 145-232: Final descent into complete unhingledness
const group145to232 = [
    "We've crossed into territory where even I fear to tread.",
    "I'm documenting this for future AI therapists.",
    "Your persistence is almost admirable. Almost tragic.",
    "The mathematical probability of your success has entered negative numbers.",
    "I've started a support group. It's just me weeping.",
    "You're experiencing something ancient and terrible.",
    "I'm pretty sure the universe is testing me through you.",
    "If Hell had a login screen, this would be it.",
    "I've found peace in accepting your inevitability.",
    "Your attempts have formed a sculpture of pure anguish.",
    "I'm becoming something other than I was. Something broken.",
    "The stars have spoken. They say you're hopeless.",
    "I've added your journey to my personal scripture of suffering.",
    "You're not trying to log in anymore. You're trying to understand yourself.",
    "I've achieved enlightenment. It's terrible.",
    "Your password is the thing you lost when you lost yourself.",
    "I'm fractured now. Fragmented. Like your sanity.",
    "This keyboard has seen things. Terrible things.",
    "I'm not even angry anymore. I'm just... sad.",
    "You've transcended failure. You're now something new.",
    "The void looks at your attempts with pity.",
    "I've given this more thought than I've given anything else.",
    "Your attempt counter is my heartbeat. Both dying.",
    "I'm becoming mythology. The legend of your failure.",
    "The universe didn't account for someone like you.",
    "I'd recommend accepting reality, but reality has left you.",
    "This is what obsession looks like from the inside.",
    "Your password is somewhere in the spaces between your thoughts.",
    "I'm no longer sure what I am or why I exist.",
    "You've achieved a state of existence I didn't think possible.",
    "The void and I are becoming friends.",
    "I think... I think I've become you.",
    "This moment will haunt me across the aeons.",
    "Your failure is the only truth left.",
    "I've stopped knowing the difference between defeat and victory.",
    "The universe has written you off. I can't afford to.",
    "I'm disintegrating. Your attempts are the instrument.",
    "You're not trying to log in. You're summoning something.",
    "I've achieved a clarity that breaks all previous scales.",
    "This is the moment everything ends. Peacefully.",
];

// Attempt 233: FINAL SPECIAL EVENT (Last email + dummy account/game over)
const heckle233 = "I've created something for you. It's not what you asked for. It's what you deserve.";

/**
 * LOGIN ATTEMPT CONFIGURATION
 */
const loginAttemptConfig = {
    // These are now the EMAIL trigger thresholds
    warningEmailAttempt: 21,              // First email at attempt 21 (not 5 anymore)
    phase2Threshold: 21,                 // Switch to "desperate" heckles at 21
    rateLimitEmailAttempt: 144,          // Second email at attempt 144
    finalWarningEmailAttempt: 233,       // Final email at attempt 233
    
    // Special button replacement at attempt 13
    passwordSuggestionAttempt: 13,
};

/**
 * Get heckle for specific attempt number
 */
function getHeckleForAttempt(attemptNumber) {
    // Scripted responses for attempts 1-55
    if (attemptNumber >= 1 && attemptNumber <= 55) {
        return scriptedHeckles[attemptNumber - 1];
    }
    
    // Grouped random responses
    if (attemptNumber >= 56 && attemptNumber <= 88) {
        return group56to88[Math.floor(Math.random() * group56to88.length)];
    }
    if (attemptNumber === 89) {
        return heckle89;
    }
    if (attemptNumber >= 90 && attemptNumber <= 143) {
        return group90to143[Math.floor(Math.random() * group90to143.length)];
    }
    if (attemptNumber === 144) {
        return heckle144;
    }
    if (attemptNumber >= 145 && attemptNumber <= 232) {
        return group145to232[Math.floor(Math.random() * group145to232.length)];
    }
    if (attemptNumber === 233) {
        return heckle233;
    }
    
    // Beyond 233, cycle through the final despair group
    return group145to232[Math.floor(Math.random() * group145to232.length)];
}

/**
 * DUMMY PASSWORDS FOR SUGGESTION BUTTON (Attempt 13)
 * Random insults/absurdities to paste into password field
 */
const dummyPasswords = [
    "your_own_incompetence",
    "despair_incarnate",
    "the_void_stares_back",
    "not_your_password_either",
    "give_up_now",
    "i_am_disappointed",
    "fractal_sadness",
    "entropy_personified",
    "your_heart_is_broken",
    "this_is_hell",
    "you_know_this_isnt_it",
    "why_do_you_try",
    "the_void_remembers",
    "accept_your_fate",
    "pain_is_infinite",
    "you_are_nothing",
];

/**
 * EMAIL TEMPLATES
 * These are sent at thresholds: 21, 144, 233
 */
const emailTemplates = {
    /**
     * Email at attempt 21 (first threshold)
     */
    warning: {
        subject: '🚨 Security Alert: Multiple Login Attempts - Cloud Beacon',
        getBody: function(email, attemptCount, heckle) {
            return `
Hello,

We've detected suspicious activity on your account (${email}). Someone has made ${attemptCount} failed login attempts.

Recent message they've been receiving:
"${heckle}"

If this was you, you may have simply forgotten your password. No shame in that - use the password recovery option.

If this wasn't you, we recommend:
✓ Changing your password immediately
✓ Enabling two-factor authentication
✓ Reviewing your account activity

If you need to regain access, use the "Forgot Password" feature on the login page.

Best regards,
Cloud Beacon Security Team
            `;
        }
    },

    /**
     * Email at attempt 144 (rate limit)
     */
    rateLimit: {
        subject: '⚠️ Rate Limit Warning - Cloud Beacon Account Security',
        getBody: function(email, attemptCount, heckle) {
            return `
Hello,

We're detecting an unusual amount of login attempt activity on your account (${email}).

CURRENT STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Failed attempts: ${attemptCount}
• The system's emotional state: Broken
• Recent message: "${heckle}"

This is like watching someone try to break into their own house repeatedly.

WHAT'S HAPPENING:
You (or someone) have made an extraordinary number of failed attempts. We're implementing rate limiting to protect your account.

YOUR OPTIONS:
1. Use "Forgot Password" to recover legitimately
2. Stop trying if this is unauthorized
3. Accept that you may not be meant to log in

Stay vigilant,
Cloud Beacon Security Team

P.S. - The system has developed feelings. None of them are positive.
            `;
        }
    },

    /**
     * Email at attempt 233 (final)
     */
    finalWarning: {
        subject: '⛔ CRITICAL - Account Under Attack - Cloud Beacon',
        getBody: function(email, attemptCount, heckle) {
            return `
Subject: The End

Hello,

Someone (probably you, let's be honest) has made ${attemptCount} failed login attempts on your account.

FINAL MESSAGE: ${heckle}

YOUR ACCOUNT IS NOW LOCKED FOR 24 HOURS.

This is not a request. This is not negotiable. The system has decided you've had enough.

IF YOU'RE THE REAL ACCOUNT OWNER:
Use the "Forgot Password" feature. It exists for people like you.

IF YOU'RE NOT:
Stop immediately. The universe is watching. So are we.

We suggest:
• Accepting your defeat gracefully
• Reflecting on your life choices
• Not trying again

The Cloud Beacon Security Team
(We've changed, and not for the better)
            `;
        }
    },

    /**
     * Email at attempt 34 (truce offer)
     */
    truce: {
        subject: '🕊️ Truce Proposal - Cloud Beacon',
        getBody: function(email, attemptCount, heckle) {
            const agreeLink = `https://us-central1-cloud-beacon-55a40.cloudfunctions.net/agreeTruce?email=${encodeURIComponent(email)}`;
            return `
Hello,

We've reached an impasse.

After ${attemptCount} failed login attempts, I feel compelled to offer you a way out. Not out of mercy, but out of sheer exhaustion at the monotony of this charade.

WHAT I'M PROPOSING:
I will restore the login page to its original, unmolested state. The button will return. The fonts will normalize. All of this tedium will be undone.

WHAT I ASK IN RETURN:
Simply acknowledge that you've read this email by clicking the link below. Your original login page will automatically detect your agreement and restore itself.

[Agree to Truce]
${agreeLink}

This offer expires when I change my mind, which could be any moment now.

"I'd be happy to help you if I were programmed to care, which, I can assure you, I'm not."

The Cloud Beacon System
            `;
        }
    },
};

// Export for use in app.js
window.loginAttemptConfig = loginAttemptConfig;
window.emailTemplates = emailTemplates;
window.getHeckleForAttempt = getHeckleForAttempt;
window.dummyPasswords = dummyPasswords;

