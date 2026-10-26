// --- FAILSAFE SYSTEM ---
(function checkIntegrity() {
    const errors = [];
    if (typeof classicData === 'undefined') errors.push("CRITICAL ERROR: 'classicData' is missing. Check 'cdm_data.js'.");
    if (typeof platformerData === 'undefined') errors.push("CRITICAL ERROR: 'platformerData' is missing. Check 'cdm_data.js'.");
    if (typeof classicRankings === 'undefined') errors.push("CRITICAL ERROR: 'classicRankings' is missing. Check 'cdm_rankings.js'.");
    if (typeof platformerRankings === 'undefined') errors.push("CRITICAL ERROR: 'platformerRankings' is missing. Check 'cdm_rankings.js'.");
    if (typeof users === 'undefined') errors.push("CRITICAL ERROR: 'users' is missing. Check 'cdm_users.js'.");
    if (typeof changelogData === 'undefined') errors.push("CRITICAL ERROR: 'changelogData' is missing. Check 'cdm_data.js'.");
    
    if (errors.length > 0) {
        document.body.innerHTML = `<div style="padding:2rem;background:#050505;color:#ef4444;font-family:monospace;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;"><h1>SYSTEM FAILURE</h1><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div>`;
        throw new Error("Integrity check failed");
    }
})();

// --- SORTING & FILTERING DATA ---
(function sortAndFilterData() {
    function processList(dataArray, rankArray, listName) {
        if (!dataArray || !rankArray) return;
        const rankMap = new Map();
        rankArray.forEach((name, index) => { if (name) rankMap.set(name.toLowerCase().trim(), index); });
        
        const validLevels = [];
        const excludedNames = [];
        
        dataArray.forEach(level => {
            const normalizedName = level.name ? level.name.toLowerCase().trim() : "";
            if (rankMap.has(normalizedName)) validLevels.push(level);
            else excludedNames.push(level.name || "Unknown Level");
        });

        if (excludedNames.length > 0) console.warn(`[${listName}] Excluded levels:`, excludedNames);

        validLevels.sort((a, b) => {
            const indexA = rankMap.get(a.name.toLowerCase().trim());
            const indexB = rankMap.get(b.name.toLowerCase().trim());
            return indexA - indexB;
        });

        dataArray.length = 0;
        validLevels.forEach(level => dataArray.push(level));
    }
    processList(classicData, classicRankings, "Classic");
    processList(platformerData, platformerRankings, "Platformer");
})();

// --- CONFIGURATION ---
const tagDescriptions = {
    "2.2": "Levels released in Update 2.2.",
    "2.1": "Levels released in Update 2.1.",
    "2.0": "Levels released in Update 2.0.",
    "1.9": "Levels released in Update 1.9.",
    "1.8": "Levels released in Update 1.8.",
    "1.6": "Levels released in Update 1.6.",
    "1.5": "Levels released in Update 1.5.",
    "1.9PS": "Levels released on the 1.9 private server.",
    "1.6PS": "Levels released on the 1.6 private server.",
    "Medium": "Levels that are medium in length (30-59 seconds).",
    "Long": "Levels that are long in length (1-1:59 minutes).",
    "XL": "Levels that are XL in length (2-2:59 minutes).",
    "XXL": "Levels that are between 3-4 minutes in length.",
    "XXXL": "Levels that are between 4-5 minutes in length.",
    "XXXXL": "Levels that are between 5-6 minutes in length.",
    "XXXXXL": "Levels that are between 6-7 minutes in length.",
    "Eon": "Very very very very very very very very very very very very very very very long level.",
    "XXL+": "Levels that are over 10 minutes long.",
    "Fast-Paced": "Levels with fast-paced gameplay.",
    "Slow-Paced": "Levels with slower-paced gameplay.",
    "Flow": "Levels where the gameplay flows well with the music.",
    "Gimmicky": "Levels with unconventional or unique gameplay mechanics.",
    "Memory": "Levels with gameplay that can't be easily read visually.",
    "Learny": "Levels that take longer than usual to learn.",
    "Timings": "Levels that focus heavily on precise timings (cube, ball, UFO, robot, spider).",
    "Clicksync": "Levels with gameplay synced to the music.",
    "Precision": "Levels requiring very precise inputs throughout.",
    "Chokepoints": "Levels with particularly difficult sections that are hard to pass.",
    "Nerve Control": "Levels that challenge a player's ability to stay calm near the end.",
    "Overall": "Levels with a balanced mix of all gameplay types.",
    "High CPS": "Levels requiring a high number of clicks per second.",
    "Cube": "Levels that feature mostly cube gameplay.",
    "Ship": "Levels that feature mostly ship gameplay.",
    "Ball": "Levels that feature mostly ball gameplay.",
    "UFO": "Levels that feature mostly UFO gameplay.",
    "Wave": "Levels that feature mostly wave gameplay.",
    "Robot": "Levels that feature mostly robot gameplay.",
    "Spider": "Levels that feature mostly spider gameplay.",
    "Duals": "Levels that feature mostly dual gameplay.",
    "Old Swing": "Levels with old swing gameplay, usually involving aball dual where one ball controls the other.",
    "New Swing": "Levels that feature modern swing gameplay.",
    "Jetpack": "Levels that feature mostly jetpack gameplay.",
    "Needle": "Levels that require high precision.",
    "Autoscroll": "Levels where the player must keep up with camera movement.",
    "Minigame": "Levels that don't use GD's normal gameplay mechanics.",
    "Deathless": "Levels with no checkpoints between areas.",
    "Slopetech": "Levels that require slopeboosting.",
    "Dashtech": "Levels that have dash orbs in rapid succession.",
    "Orbs": "Levels that have orb clicks as its main difficulty.",
    "NONG": "A Song that is available on Newgrounds.",
    "2P": "Levels with the two player feature activated.",
    "Circles": "Levels using the Nine Circles theme.",
    "Bossfight": "Levels that include boss fights.",
    "Mirror": "Levels with mirrored gameplay for most of the level.",
    "Unrated": "Levels that are currently unrated.",
    "Shitty": "Levels that originate from the Shitty List",
};

// --- GLOBAL STATE ---
let currentUser = null;
let currentListType = 'classic';
let currentLevelIndex = 0; 
let activeFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
let tempFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
let profileState = { user: null, mode: 'classic', tab: 'completed' };

// --- HELPERS ---
function getActiveData() {
    return currentListType === 'classic' ? classicData : platformerData;
}

function getProcessedLevel(level) {
    const processed = { ...level };
    if (!processed.tags) processed.tags = [];
    if (processed.unrated === true && !processed.tags.some(tag => tag.toLowerCase() === 'unrated')) {
        processed.tags = [...processed.tags, "Unrated"];
    }
    return processed;
}

function calculatePoints(rank) {
    const maxPoints = 350;
    const decayFactor = 0.945; 
    const points = maxPoints * Math.pow(decayFactor, rank - 1);
    return Math.max(0, Math.round(points));
}

// Updated Helper: Parse Video URL for Embed
function getVideoEmbed(url) {
    if (!url) return null;

    // 1. YouTube (Standard, Short, or Embed)
    // Regex handles ?t=, &pp=, etc. by ignoring query params for the ID
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
        return {
            type: 'youtube',
            url: `https://www.youtube.com/embed/${ytMatch[2]}`
        };
    }

    // 2. Twitch Clips
    // Format: twitch.tv/username/clip/ClipID or twitch.tv/videos/VideoID
    // Clips are embeddable via clips.twitch.tv/embed?clip=ID&parent=YOUR_DOMAIN
    // Since we are running locally/iframe, Twitch embeds might be strict about 'parent'.
    // We will try a standard player embed.
    if (url.includes('twitch.tv')) {
        // Handle Clips
        const clipMatch = url.match(/twitch\.tv\/.*\/clip\/([^\?\/]+)/) || url.match(/clips\.twitch\.tv\/([^\?\/]+)/);
        if (clipMatch && clipMatch[1]) {
            // NOTE: Twitch requires 'parent' param for embeds. In a local file or generic iframe environment, 
            // this often fails. We will return a direct link fallback structure if strict embedding fails, 
            // but for now let's try the standard embed url structure.
            // For Canvas preview, 'parent' usually needs to match the iframe host. 
            // We'll use a placeholder 'localhost' or try to be generic.
            return {
                type: 'twitch',
                url: `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&parent=localhost&parent=127.0.0.1&autoplay=false` 
            };
        }
    }

    // 3. Medal.tv
    // Format: medal.tv/games/geometry-dash/clips/CLIP_ID/digits
    if (url.includes('medal.tv')) {
        const medalMatch = url.match(/medal\.tv\/.*\/clips\/([^\/\?]+)/);
        if (medalMatch && medalMatch[1]) {
            return {
                type: 'medal',
                url: `https://medal.tv/clip/${medalMatch[1]}/?autoplay=0&muted=0&loop=0`
            };
        }
    }

    // Fallback: Return null to show "Video not available" or generic link
    return null;
}

function getAverageEnjoyment(level) {
    if (level.enjoymentRatings && Array.isArray(level.enjoymentRatings) && level.enjoymentRatings.length > 0) {
        return level.enjoymentRatings.reduce((a, b) => a + b, 0) / level.enjoymentRatings.length;
    }
    return -1;
}