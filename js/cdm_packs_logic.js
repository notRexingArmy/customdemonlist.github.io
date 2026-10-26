// --- STATE ---
let currentPackType = 'classic';

// --- RENDER LOGIC ---

// Configuration for Tiers
const tierConfig = {
    "Silver":   { color: "text-gray-300",       bg: "bg-gray-300",      border: "border-gray-400" },
    "Gold":     { color: "text-yellow-400",     bg: "bg-yellow-400",    border: "border-yellow-500" },
    "Platinum": { color: "text-teal-200",       bg: "bg-teal-200",      border: "border-teal-300" },
    "Sapphire": { color: "text-blue-500",       bg: "bg-blue-500",      border: "border-blue-600" },
    "Ruby":     { color: "text-red-500",        bg: "bg-red-500",       border: "border-red-600" },
    "Diamond":  { color: "text-cyan-400",       bg: "bg-cyan-400",      border: "border-cyan-500" },
    "Onyx":     { color: "text-gray-500",       bg: "bg-gray-500",      border: "border-gray-600" },
    "Obsidian": { color: "text-purple-500",     bg: "bg-purple-500",    border: "border-purple-600" }
};

const tierOrder = ["Silver", "Gold", "Platinum", "Sapphire", "Ruby", "Diamond", "Onyx", "Obsidian"];

// Init function
function initPacks() {
    const tabClassic = document.getElementById('packsTabClassic');
    const tabPlatformer = document.getElementById('packsTabPlatformer');

    if (tabClassic) {
        tabClassic.addEventListener('click', () => switchPackTab('classic'));
    }
    if (tabPlatformer) {
        tabPlatformer.addEventListener('click', () => switchPackTab('platformer'));
    }

    // Close modal on outside click
    const modal = document.getElementById('packDetailsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePackDetails();
            }
        });
    }
}

function switchPackTab(type) {
    currentPackType = type;
    const tabClassic = document.getElementById('packsTabClassic');
    const tabPlatformer = document.getElementById('packsTabPlatformer');

    if (type === 'classic') {
        tabClassic.classList.add('text-white', 'border-b-2', 'border-accent-orange');
        tabClassic.classList.remove('text-gray-500', 'hover:text-gray-300');
        
        tabPlatformer.classList.remove('text-white', 'border-b-2', 'border-accent-orange');
        tabPlatformer.classList.add('text-gray-500', 'hover:text-gray-300');
    } else {
        tabPlatformer.classList.add('text-white', 'border-b-2', 'border-accent-orange');
        tabPlatformer.classList.remove('text-gray-500', 'hover:text-gray-300');
        
        tabClassic.classList.remove('text-white', 'border-b-2', 'border-accent-orange');
        tabClassic.classList.add('text-gray-500', 'hover:text-gray-300');
    }

    renderPacks();
}

// Helper to calculate points for a pack dynamically
function getPackPoints(pack) {
    if (!pack || !pack.levels) return 0;
    
    let targetData = [];
    if (pack.platformer === true) {
        targetData = typeof platformerData !== 'undefined' ? platformerData : [];
    } else {
        targetData = typeof classicData !== 'undefined' ? classicData : [];
    }
    
    let totalLevelPoints = 0;
    
    pack.levels.forEach(levelName => {
        const idx = targetData.findIndex(l => l.name.toLowerCase() === levelName.toLowerCase());
        
        if (idx !== -1) {
             const rank = idx + 1;
             if (typeof calculatePoints === 'function') {
                 totalLevelPoints += calculatePoints(rank);
             }
        }
    });

    return Math.round(totalLevelPoints / 2);
}

function toggleTier(tierName) {
    const content = document.getElementById(`tier-content-${tierName}`);
    const icon = document.getElementById(`tier-icon-${tierName}`);
    
    if (content) {
        // Toggle Expanded State
        const isCollapsed = content.classList.contains('max-h-0');
        
        if (isCollapsed) {
            // Expand
            content.classList.remove('max-h-0', 'opacity-0', 'mb-0');
            content.classList.add('max-h-[10000px]', 'opacity-100', 'mb-8'); // Allow large height
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            // Collapse
            content.classList.remove('max-h-[10000px]', 'opacity-100', 'mb-8');
            content.classList.add('max-h-0', 'opacity-0', 'mb-0');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
}

function renderPacks() {
    const container = document.getElementById('packsGrid');
    if (!container) return;

    if (typeof packsData === 'undefined' || !packsData || packsData.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-12">No packs available yet.</div>';
        return;
    }

    const cData = typeof classicData !== 'undefined' ? classicData : [];
    const pData = typeof platformerData !== 'undefined' ? platformerData : [];
    
    let htmlContent = '';

    const filteredPacks = packsData.filter(pack => {
        const isPlatformerPack = pack.platformer === true;
        if (currentPackType === 'platformer') return isPlatformerPack;
        return !isPlatformerPack;
    });

    if (filteredPacks.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-12">No packs found for this category.</div>';
        return;
    }

    tierOrder.forEach(tier => {
        const tierPacks = filteredPacks.filter(p => p.tier === tier);
        
        if (tierPacks.length > 0) {
            const style = tierConfig[tier] || tierConfig["Silver"];
            
            // Check if ALL packs in this tier are completed
            let isTierCompleted = false;
            if (typeof currentUser !== 'undefined' && currentUser) {
                isTierCompleted = tierPacks.every(pack => {
                    const targetData = pack.platformer === true ? pData : cData;
                    return pack.levels.every(levelName => {
                        const levelData = targetData.find(l => l.name.toLowerCase() === levelName.toLowerCase());
                        if (levelData) {
                            const isVictor = levelData.victors && levelData.victors.some(v => v.name === currentUser.username);
                            const isVerifier = levelData.verifier === currentUser.username;
                            return isVictor || isVerifier;
                        }
                        return false; 
                    });
                });
            }

            const tierCheckmark = isTierCompleted 
                ? `<div class="ml-3 bg-accent-green/20 p-1 rounded-full border border-accent-green/50"><i data-lucide="check" class="w-5 h-5 text-accent-green"></i></div>` 
                : '';

            // --- TIER ICON LOGIC ---
            const tierIconFile = `assets/${tier.toLowerCase()}tier.png`; 
            const tierIconHtml = `<img src="${tierIconFile}" alt="${tier}" class="w-10 h-10 object-contain mr-2">`; 

            // --- COLLAPSIBLE HEADER ---
            htmlContent += `
                <div class="border-b-0">
                    <div onclick="toggleTier('${tier}')" class="flex items-center justify-between cursor-pointer group select-none border-b border-dark-600 pb-2 mb-4 hover:bg-dark-800/30 rounded px-2 transition-colors">
                        <h2 class="text-2xl font-black uppercase tracking-widest flex items-center gap-2 ${style.color}">
                            ${tierIconHtml}
                            ${tier} Tier
                            ${tierCheckmark}
                        </h2>
                        <i id="tier-icon-${tier}" data-lucide="chevron-down" class="w-6 h-6 text-gray-500 group-hover:text-white transition-transform duration-200" style="transform: rotate(180deg);"></i>
                    </div>
                    
                    <div id="tier-content-${tier}" class="flex flex-col gap-4 overflow-hidden transition-all duration-200 ease-in-out max-h-[10000px] opacity-100 mb-8">
            `;

            htmlContent += tierPacks.map(pack => {
                const targetData = pack.platformer === true ? pData : cData;
                
                let completedCount = 0;
                let totalCount = pack.levels.length;

                if (typeof currentUser !== 'undefined' && currentUser) {
                    pack.levels.forEach(levelName => {
                         const levelData = targetData.find(l => l.name.toLowerCase() === levelName.toLowerCase());
                         if (levelData) {
                             const isVictor = levelData.victors && levelData.victors.some(v => v.name === currentUser.username);
                             const isVerifier = levelData.verifier === currentUser.username;
                             if (isVictor || isVerifier) completedCount++;
                         }
                    });
                }
                
                const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                const isCompleted = completedCount === totalCount && totalCount > 0;
                const packIdSafe = pack.name.replace(/'/g, "\\'");
                const packPoints = getPackPoints(pack);
                
                return `
                    <div onclick="viewPack('${packIdSafe}')" class="group bg-dark-800 rounded-xl border border-dark-600 p-4 cursor-pointer hover:border-dark-400 transition-all duration-200 shadow-md hover:shadow-lg flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                        ${isCompleted ? `<div class="absolute top-0 right-0 bg-accent-green/20 p-1.5 rounded-bl-lg border-l border-b border-accent-green/30"><i data-lucide="check" class="w-4 h-4 text-accent-green"></i></div>` : ''}
                        
                        <!-- Left: Info -->
                        <div class="flex-1 w-full text-center md:text-left">
                            <h3 class="text-xl font-bold text-white group-hover:text-accent-blue transition-colors mb-1 flex items-center justify-center md:justify-start gap-2">
                                ${pack.name}
                            </h3>
                            <div class="text-xs text-gray-400 font-bold flex items-center justify-center md:justify-start gap-2">
                                <span class="text-accent-gold">+${packPoints} Points</span>
                            </div>
                        </div>

                        <!-- Right: Progress Bar -->
                        <div class="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-1">
                            <div class="flex justify-between text-xs font-mono font-bold text-gray-500 mb-1">
                                <span>Progress</span>
                                <span class="${isCompleted ? 'text-accent-green' : ''}">${completedCount} / ${totalCount}</span>
                            </div>
                            <div class="h-3 w-full bg-dark-900 rounded-full overflow-hidden border border-dark-700">
                                <div class="h-full ${style.bg} transition-all duration-700 ease-out relative" style="width: ${percent}%">
                                    <div class="absolute inset-0 bg-white/20"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Arrow Icon -->
                        <div class="hidden md:flex text-gray-600 group-hover:text-white transition-colors">
                            <i data-lucide="chevron-right" class="w-6 h-6"></i>
                        </div>
                    </div>
                `;
            }).join('');

            htmlContent += `
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = htmlContent;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function viewPack(packName) {
    const pack = packsData.find(p => p.name === packName);
    if (!pack) return;

    const modal = document.getElementById('packDetailsModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    const packPoints = getPackPoints(pack);
    document.getElementById('packDetailName').textContent = pack.name;
    document.getElementById('packDetailDesc').textContent = `${pack.tier} Tier Collection • Reward: ${packPoints} Points`;
    
    const targetData = pack.platformer === true 
        ? (typeof platformerData !== 'undefined' ? platformerData : [])
        : (typeof classicData !== 'undefined' ? classicData : []);
    
    let completedCount = 0;

    const levelsList = document.getElementById('packLevelsList');
    if (levelsList) {
        levelsList.innerHTML = pack.levels.map((levelName, index) => {
            const levelData = targetData.find(l => l.name.toLowerCase() === levelName.toLowerCase());
            
            let statusIcon = '<div class="w-6 h-6 rounded-full border-2 border-dark-600"></div>'; 
            let cardClass = 'border-dark-600/50 hover:bg-dark-800/50';
            let titleColor = 'text-gray-300';
            let rankColor = 'text-gray-500';
            let linkAction = '';
            let rank = '-';
            let points = 0;

            if (levelData) {
                const idx = targetData.indexOf(levelData);
                rank = idx + 1;
                
                if (typeof calculatePoints === 'function') {
                    points = calculatePoints(rank);
                }

                if (rank === 1) { 
                    rankColor = 'text-accent-gold'; 
                    titleColor = 'text-accent-gold'; 
                }
                else if (rank <= 3) { 
                    rankColor = 'text-gray-300'; 
                    titleColor = 'text-gray-300'; 
                } 
                else if (rank <= 10) { 
                    rankColor = 'text-accent-red'; 
                    titleColor = 'text-accent-red'; 
                }
                else { 
                    rankColor = 'text-gray-500'; 
                    titleColor = 'text-white'; 
                }

                if (typeof currentUser !== 'undefined' && currentUser) {
                    const isVictor = levelData.victors && levelData.victors.some(v => v.name === currentUser.username);
                    const isVerifier = levelData.verifier === currentUser.username;
                    
                    if (isVictor || isVerifier) {
                        completedCount++;
                        statusIcon = `<div class="w-6 h-6 rounded-full bg-accent-green flex items-center justify-center text-black"><i data-lucide="check" class="w-4 h-4"></i></div>`;
                        cardClass = 'border-accent-green/30 bg-accent-green/5';
                    }
                }
                
                linkAction = `closePackDetails(); goToLevelFromProfile('${levelData.name}')`;
            } else {
                return `
                    <div class="flex items-center justify-between p-3 border-b border-dark-700/50 opacity-50">
                        <span class="text-red-400 text-sm font-mono">${levelName} (Missing)</span>
                    </div>`;
            }
            
            return `
                <div class="flex items-center justify-between p-4 border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors cursor-pointer group" onclick="${linkAction}">
                    <div class="flex items-center gap-4">
                        <span class="${rankColor} font-black text-xl w-8 text-right">#${rank}</span>
                        <div>
                            <div class="${titleColor} font-bold text-lg group-hover:underline decoration-dark-500 underline-offset-4">${levelData.name}</div>
                            <div class="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold">
                                <span class="text-gray-500">by ${levelData.publisher || "Unknown"}</span>
                                <span class="text-accent-green">• ${points.toFixed(1)} Pts</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        ${statusIcon}
                    </div>
                </div>
            `;
        }).join('');
    }

    const percent = Math.round((completedCount / pack.levels.length) * 100);
    const bar = document.getElementById('packProgressBar');
    const text = document.getElementById('packProgressText');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${completedCount}/${pack.levels.length} (${percent}%)`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closePackDetails() {
    const modal = document.getElementById('packDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('packDetailsModal');
        if (modal && !modal.classList.contains('hidden')) {
            closePackDetails();
        }
    }
});

// Make global
window.renderPacks = renderPacks;
window.viewPack = viewPack;
window.closePackDetails = closePackDetails;
window.getPackPoints = getPackPoints;
window.initPacks = initPacks;
window.switchPackTab = switchPackTab;
window.toggleTier = toggleTier;
window.tierConfig = tierConfig; // Exported for use in cdm_social.js

initPacks();