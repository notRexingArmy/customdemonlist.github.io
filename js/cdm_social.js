// --- LEADERBOARD LOGIC ---
const lbTabClassic = document.getElementById('lbTabClassic');
const lbTabPlatformer = document.getElementById('lbTabPlatformer');

function switchLeaderboardTab(type) {
    if (!lbTabClassic || !lbTabPlatformer) return;

    currentListType = type;
    
    if (type === 'classic') {
        lbTabClassic.classList.add('text-white', 'border-b-2', 'border-accent-orange');
        lbTabClassic.classList.remove('text-gray-500', 'hover:text-gray-300');
        
        lbTabPlatformer.classList.remove('text-white', 'border-b-2', 'border-accent-orange');
        lbTabPlatformer.classList.add('text-gray-500', 'hover:text-gray-300');
    } else {
        lbTabPlatformer.classList.add('text-white', 'border-b-2', 'border-accent-orange');
        lbTabPlatformer.classList.remove('text-gray-500', 'hover:text-gray-300');
        
        lbTabClassic.classList.remove('text-white', 'border-b-2', 'border-accent-orange');
        lbTabClassic.classList.add('text-gray-500', 'hover:text-gray-300');
    }

    calculateAndRenderLeaderboard();
}

function initSocial() {
    if (lbTabClassic) lbTabClassic.addEventListener('click', () => switchLeaderboardTab('classic'));
    if (lbTabPlatformer) lbTabPlatformer.addEventListener('click', () => switchLeaderboardTab('platformer'));
    
    if (!profileState.filter) profileState.filter = 'all';

    const searchInput = document.getElementById('leaderboardSearchInput');
    if(searchInput) {
        searchInput.addEventListener('input', calculateAndRenderLeaderboard);
    }
}

function calculateUserTotalPoints(username) {
    const cData = typeof classicData !== 'undefined' ? classicData : [];
    const pData = typeof platformerData !== 'undefined' ? platformerData : [];
    
    let classicLevelPoints = 0;
    let platformerLevelPoints = 0;
    
    function calculatePointsForList(listData) {
        let listPoints = 0;
        listData.forEach((level, index) => {
            const rank = index + 1;
            const pts = calculatePoints(rank);
            
            const isVictor = level.victors && level.victors.some(v => v.name === username);
            const isVerifier = level.verifier === username;
            
            if (isVictor || isVerifier) {
                listPoints += pts;
            }
        });
        return listPoints;
    }

    classicLevelPoints = calculatePointsForList(cData);
    platformerLevelPoints = calculatePointsForList(pData);
    
    let classicPackPoints = 0;
    let platformerPackPoints = 0;
    
    if (typeof packsData !== 'undefined') {
        const allLevelData = cData.concat(pData);
        
        packsData.forEach(pack => {
            let completedCount = 0;
            pack.levels.forEach(levelName => {
                 const levelData = allLevelData.find(l => l.name.toLowerCase() === levelName.toLowerCase());
                 if (levelData) {
                     const isVictor = levelData.victors && levelData.victors.some(v => v.name === username);
                     const isVerifier = levelData.verifier === username;
                     if (isVictor || isVerifier) completedCount++;
                 }
            });
            
            if (completedCount === pack.levels.length && pack.levels.length > 0) {
                if (typeof getPackPoints === 'function') {
                    const packPoints = getPackPoints(pack);
                    if (pack.platformer === true) {
                        platformerPackPoints += packPoints;
                    } else {
                        classicPackPoints += packPoints;
                    }
                }
            }
        });
    }

    return {
        classic: {
            levelPoints: classicLevelPoints,
            packPoints: classicPackPoints,
            totalPoints: classicLevelPoints + classicPackPoints
        },
        platformer: {
            levelPoints: platformerLevelPoints,
            packPoints: platformerPackPoints,
            totalPoints: platformerLevelPoints + platformerPackPoints
        },
        overall: {
            levelPoints: classicLevelPoints + platformerLevelPoints,
            packPoints: classicPackPoints + platformerPackPoints,
            totalPoints: classicLevelPoints + platformerLevelPoints + classicPackPoints + platformerPackPoints
        }
    };
}

function calculateAndRenderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const searchInput = document.getElementById('leaderboardSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!leaderboardList) return;

    const data = getActiveData(); 
    const allPlayersInActiveList = new Set();
    
    data.forEach(level => {
        if (level.victors) level.victors.forEach(v => allPlayersInActiveList.add(v.name));
        if (level.verifier && level.verifier !== "Unknown") allPlayersInActiveList.add(level.verifier);
    });

    let leaderboardArray = Array.from(allPlayersInActiveList).map(username => {
        const stats = calculateUserTotalPoints(username);
        const activePoints = (currentListType === 'platformer') 
            ? stats.platformer.totalPoints 
            : stats.classic.totalPoints;
        
        let hardestLevel = null;
        let hardestRank = 999999;
        let completedCount = 0;

        data.forEach((level, idx) => {
             const rank = idx + 1;
             const isVictor = level.victors && level.victors.some(v => v.name === username);
             const isVerifier = level.verifier === username;
             
             if (isVictor || isVerifier) {
                 completedCount++;
                 if (rank < hardestRank) {
                     hardestRank = rank;
                     hardestLevel = level.name;
                 }
             }
        });

        return {
            name: username,
            points: activePoints,
            completedCount: completedCount,
            hardestLevel: hardestLevel,
            hardestRank: hardestRank 
        };
    });

    if (typeof users !== 'undefined') {
        const registeredUsernames = new Set(users.map(u => u.username));
        leaderboardArray = leaderboardArray.filter(player => registeredUsernames.has(player.name));
    }

    if (searchTerm) {
        leaderboardArray = leaderboardArray.filter(player => player.name.toLowerCase().includes(searchTerm));
    }

    leaderboardArray.sort((a, b) => b.points - a.points);
    
    if (leaderboardArray.length === 0) {
        leaderboardList.innerHTML = `<div class="p-8 text-center text-gray-500">No players found.</div>`;
        return;
    }
    
    leaderboardList.innerHTML = leaderboardArray.map((player, index) => {
        const rank = index + 1;
        const formattedPoints = player.points.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        let rankClass = "text-gray-400";
        if (rank === 1) rankClass = "text-accent-gold font-bold text-lg";
        else if (rank === 2) rankClass = "text-gray-200 font-bold text-lg";
        else if (rank === 3) rankClass = "text-[#CD7F32] font-bold text-lg";

        const userObj = (typeof users !== 'undefined' ? users : []).find(u => u.username === player.name);
        const countryCode = (userObj && userObj.country) ? userObj.country.toLowerCase() : 'us';
        const flag = `https://flagcdn.com/w20/${countryCode}.png`;
        const clanHtml = userObj && userObj.clan ? `<span class="text-accent-orange font-bold mr-1">[${userObj.clan}]</span>` : '';

        const isCompletedList = player.completedCount === data.length && data.length > 0;
        const completionClass = isCompletedList ? "text-accent-gold font-black text-lg" : "text-gray-500";
        const hardestClass = (player.hardestRank === 1) ? "text-accent-gold font-black" : "text-gray-400";

        return `
            <div class="grid grid-cols-12 gap-2 p-3 items-center hover:bg-dark-700/50 transition-colors text-sm cursor-pointer group" onclick="renderProfile('${player.name}')">
                <div class="col-span-1 text-center ${rankClass}">#${rank}</div>
                <div class="col-span-4 pl-2 font-medium text-white flex items-center gap-3 truncate">
                   <img src="${flag}" class="w-4 h-auto rounded-sm">
                   <span class="group-hover:text-accent-blue transition-colors">
                       ${clanHtml} ${player.name}
                   </span>
                </div>
                <div class="col-span-3 text-center text-gray-300">${formattedPoints} points</div>
                <div class="col-span-3 text-center truncate ${hardestClass}">${player.hardestLevel}</div>
                <div class="col-span-1 text-center ${completionClass}">${player.completedCount}</div>
            </div>
        `;
    }).join('');
}


// --- PROFILE LOGIC ---

window.toggleProfileFilter = function() {
    const dropdown = document.getElementById('profileFilterDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

window.setProfileFilter = function(filterType) {
    profileState.filter = filterType;
    const dropdown = document.getElementById('profileFilterDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    renderProfileContent();
}

function setProfileMode(mode) {
    profileState.mode = mode;
    renderProfileContent();
}

function setProfileTab(tab) {
    profileState.tab = tab;
    profileState.filter = 'all';
    renderProfileContent();
}

function renderProfile(username) {
    hideAllSections();
    const profileSection = document.getElementById('profileSection');
    if(profileSection) profileSection.classList.remove('hidden');
    
    const user = (typeof users !== 'undefined' ? users : []).find(u => u.username === username) || { username: username, country: 'UNKNOWN', clan: 'NONE', bio: 'User not found.', avatar: '' };
    
    const nameEl = document.getElementById('profileName');
    nameEl.innerHTML = ''; 
    nameEl.textContent = user.username;

    if (typeof staffData !== 'undefined') {
        let badgeData = null;
        if (staffData.owners && staffData.owners.some(s => s.name === username)) 
            badgeData = { icon: "crown", color: "text-accent-gold", tooltip: "Owner & Developer" };
        else if (staffData.moderators && staffData.moderators.some(s => s.name === username)) 
            badgeData = { icon: "shield", color: "text-accent-green", tooltip: "Moderator" };
        else if (staffData.helpers && staffData.helpers.some(s => s.name === username)) 
            badgeData = { icon: "wrench", color: "text-accent-blue", tooltip: "Helper" };
        else if (staffData.supporters && staffData.supporters.some(s => s.name === username)) 
            badgeData = { icon: "heart", color: "text-pink-400", tooltip: "Supporter" };
        
        if (badgeData) {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `ml-3 inline-flex items-center justify-center tooltip-trigger cursor-pointer align-middle`;
            badgeSpan.setAttribute('data-tooltip-text', badgeData.tooltip);
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', badgeData.icon);
            icon.className = `w-6 h-6 ${badgeData.color}`; 
            badgeSpan.appendChild(icon);
            nameEl.appendChild(badgeSpan);
        }
    }

    document.getElementById('profileClan').textContent = user.clan || 'NONE';
    document.getElementById('profileBio').textContent = user.bio || 'No bio set.';
    const flagImg = document.getElementById('profileFlag');
    if(flagImg) flagImg.src = `https://flagcdn.com/w20/${(user.country || 'us').toLowerCase()}.png`;
    
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
        if(user.avatar && user.avatar.trim() !== '') { 
            avatarEl.src = user.avatar; 
            avatarEl.style.display = 'block'; 
        } else { 
            avatarEl.style.display = 'none'; 
            avatarEl.src = ''; 
        }
    }

    profileState.user = user;
    profileState.mode = 'classic';
    profileState.tab = 'completed';
    profileState.filter = 'all';

    renderProfileContent();
}

function calculatePlayerRanks(targetUsername, type) {
    const data = type === 'classic' ? classicData : platformerData;
    
    const allPlayers = new Set();
    
    const allLists = [classicData, platformerData].flat();
    allLists.forEach(level => {
        if (level.victors) level.victors.forEach(v => allPlayers.add(v.name));
        if (level.verifier && level.verifier !== "Unknown") allPlayers.add(level.verifier);
    });

    let statsArray = Array.from(allPlayers).map(username => {
        const stats = calculateUserTotalPoints(username);
        const modeStats = type === 'classic' ? stats.classic : stats.platformer;

        let completionCount = 0;
        data.forEach(level => {
            const isVictor = level.victors && level.victors.some(v => v.name === username);
            const isVerifier = level.verifier === username;
            if (isVictor || isVerifier) completionCount++;
        });

        return {
            name: username,
            modeTotalPoints: modeStats.totalPoints, 
            overallTotalPoints: stats.overall.totalPoints,
            count: completionCount
        };
    });

    if (typeof users !== 'undefined') {
        const registeredUsernames = new Set(users.map(u => u.username));
        statsArray = statsArray.filter(p => registeredUsernames.has(p.name));
    } else { statsArray = []; }

    statsArray.sort((a, b) => b.modeTotalPoints - a.modeTotalPoints);
    const pointRankIndex = statsArray.findIndex(p => p.name === targetUsername);
    const pointRank = pointRankIndex !== -1 ? pointRankIndex + 1 : '-'; 

    statsArray.sort((a, b) => b.count - a.count);
    const countRankIndex = statsArray.findIndex(p => p.name === targetUsername);
    const countRank = countRankIndex !== -1 ? countRankIndex + 1 : '-';

    statsArray.sort((a, b) => b.overallTotalPoints - a.overallTotalPoints);
    const overallRankIndex = statsArray.findIndex(p => p.name === targetUsername);
    const overallRank = overallRankIndex !== -1 ? overallRankIndex + 1 : '-';

    return { globalRank: overallRank, packRank: pointRank, countRank };
}

function renderProfileContent() {
    const user = profileState.user;
    if (!user) return;
    const username = user.username;

    const cData = typeof classicData !== 'undefined' ? classicData : [];
    const pData = typeof platformerData !== 'undefined' ? platformerData : [];
    
    const activeData = profileState.mode === 'classic' ? cData : pData;
    
    const stats = calculateUserTotalPoints(username);
    const modeStats = profileState.mode === 'classic' ? stats.classic : stats.platformer;

    const processList = (list) => list.map((l, i) => ({...getProcessedLevel(l), _rank: i + 1}));
    const allClassic = processList(cData);
    const allPlatformer = processList(pData);

    const getCompleted = (list) => list.filter(l => 
        (l.victors && l.victors.some(v => v.name === username)) || 
        (l.verifier === username)
    );
    
    const getCreated = (list) => list.filter(l => 
        (l.creators && l.creators.includes(username)) || 
        (l.creator === username)
    );

    const cCompleted = getCompleted(allClassic);
    const pCompleted = getCompleted(allPlatformer);
    const cCreated = getCreated(allClassic);
    const pCreated = getCreated(allPlatformer);

    const activeCompleted = profileState.mode === 'classic' ? cCompleted : pCompleted;
    const activeCreated = profileState.mode === 'classic' ? cCreated : pCreated;

    let completedPacks = [];
    if (typeof packsData !== 'undefined') {
        const allLevelData = allClassic.concat(allPlatformer);
        completedPacks = packsData.filter(pack => {
            let packCompletedCount = 0;
            pack.levels.forEach(levelName => {
                 const levelData = allLevelData.find(l => l.name.toLowerCase() === levelName.toLowerCase());
                 if (levelData) {
                     const isVictor = levelData.victors && levelData.victors.some(v => v.name === username);
                     const isVerifier = levelData.verifier === username;
                     if (isVictor || isVerifier) packCompletedCount++;
                 }
            });
            return packCompletedCount === pack.levels.length && pack.levels.length > 0;
        });
    }

    let packsToRender = completedPacks.filter(pack => {
        const isPlatformerPack = pack.platformer === true;
        if (profileState.mode === 'classic') {
            return !isPlatformerPack;
        } else {
            return isPlatformerPack;
        }
    });

    // --- SORT PACKS: High Tier -> Low Tier, High Points -> Low Points ---
    const tierOrder = ["Silver", "Gold", "Platinum", "Sapphire", "Ruby", "Diamond", "Onyx", "Obsidian"];
    
    packsToRender.sort((a, b) => {
        // Higher index = Higher Tier. We want Descending order.
        const tierIndexA = tierOrder.indexOf(a.tier);
        const tierIndexB = tierOrder.indexOf(b.tier);
        
        if (tierIndexA !== tierIndexB) {
            return tierIndexB - tierIndexA; // Descending Tier
        } else {
            // Same tier, check points
            const pointsA = (typeof getPackPoints === 'function') ? getPackPoints(a) : 0;
            const pointsB = (typeof getPackPoints === 'function') ? getPackPoints(b) : 0;
            return pointsB - pointsA; // Descending Points
        }
    });
    
    const countCompleted = activeCompleted.length;
    const countCreated = activeCreated.length;
    const countPacks = packsToRender.length; 

    let hardestRank = 999999;
    if (activeCompleted.length > 0) {
        hardestRank = Math.min(...activeCompleted.map(l => l._rank));
    }

    const btnClassic = document.getElementById('profileModeClassic');
    const btnPlatformer = document.getElementById('profileModePlatformer');
    
    if(btnClassic) btnClassic.textContent = `CLASSIC (${cCompleted.length})`;
    if(btnPlatformer) btnPlatformer.textContent = `PLATFORMER (${pCompleted.length})`;

    const activeToggleClass = ['text-white', 'border-accent-orange'];
    const inactiveToggleClass = ['text-gray-500', 'border-transparent', 'hover:text-gray-300'];

    if (profileState.mode === 'classic') {
        btnClassic?.classList.add(...activeToggleClass);
        btnClassic?.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-300');
        btnPlatformer?.classList.remove(...activeToggleClass);
        btnPlatformer?.classList.add(...inactiveToggleClass);
    } else {
        btnPlatformer?.classList.add(...activeToggleClass);
        btnPlatformer?.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-300');
        btnClassic?.classList.remove(...activeToggleClass);
        btnClassic?.classList.add(...inactiveToggleClass);
    }

    if(btnClassic) btnClassic.onclick = () => setProfileMode('classic');
    if(btnPlatformer) btnPlatformer.onclick = () => setProfileMode('platformer');

    document.getElementById('profilePoints').textContent = modeStats.levelPoints.toFixed(1);
    document.getElementById('profilePacksPoints').textContent = modeStats.packPoints.toFixed(1);
    document.getElementById('profileTotalPoints').textContent = modeStats.totalPoints.toFixed(1);

    const tabCompleted = document.getElementById('profileTabCompleted');
    const tabCreated = document.getElementById('profileTabCreated');
    const tabPacks = document.getElementById('profileTabPacks'); 

    if(tabCompleted) tabCompleted.textContent = `COMPLETED (${countCompleted})`;
    if(tabCreated) tabCreated.textContent = `CREATED (${countCreated})`;
    if(tabPacks) tabPacks.textContent = `PACKS (${packsToRender.length})`; 

    const setActiveTab = (el, isActive) => {
        if (!el) return;
        if (isActive) {
            el.className = "text-lg font-bold text-white border-b-2 border-accent-orange py-2 px-1 transition-colors";
        } else {
            el.className = "text-lg font-bold text-gray-500 border-b-2 border-transparent hover:text-gray-300 py-2 px-1 transition-colors";
        }
    };
    
    setActiveTab(tabCompleted, profileState.tab === 'completed');
    setActiveTab(tabCreated, profileState.tab === 'created');
    setActiveTab(tabPacks, profileState.tab === 'packs');

    if(tabCompleted) tabCompleted.onclick = () => setProfileTab('completed');
    if(tabCreated) tabCreated.onclick = () => setProfileTab('created');
    if(tabPacks) tabPacks.onclick = () => setProfileTab('packs');

    const { globalRank, packRank, countRank } = calculatePlayerRanks(username, profileState.mode);

    document.getElementById('profilePackRank').textContent = packRank !== '-' ? `#${packRank}` : '-';
    document.getElementById('profileCountRank').textContent = countRank !== '-' ? `#${countRank}` : '-';


    const filterWrapper = document.getElementById('profileFilterWrapper');
    const filterLabel = document.getElementById('profileFilterLabel');
    const filterBtn = document.getElementById('profileFilterBtn');
    const filterDropdown = document.getElementById('profileFilterDropdown');

    if (filterWrapper && filterDropdown) {
        if (profileState.tab === 'completed') {
            filterWrapper.classList.remove('hidden');
            
            filterDropdown.innerHTML = `
                <button onclick="setProfileFilter('all')" class="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-dark-700 hover:text-white font-bold">All</button>
                <button onclick="setProfileFilter('former_hardest')" class="block w-full text-left px-4 py-2 text-xs text-yellow-400 hover:bg-dark-700 hover:text-yellow-200 font-bold">Former Hardest</button>
                <button onclick="setProfileFilter('verified')" class="block w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-dark-700 hover:text-purple-200 font-bold">Verified</button>
                <button onclick="setProfileFilter('mobile')" class="block w-full text-left px-4 py-2 text-xs text-cyan-400 hover:bg-dark-700 hover:text-cyan-200 font-bold">Mobile</button>
            `;
            
            const labels = {
                'all': 'Filter: All',
                'former_hardest': 'Former Hardest',
                'verified': 'Verified',
                'mobile': 'Mobile'
            };
            if(filterLabel) filterLabel.textContent = labels[profileState.filter] || 'Filter';
            
            if (profileState.filter !== 'all') {
                filterBtn.classList.add('text-accent-orange', 'border-accent-orange', 'bg-accent-orange/10');
                filterBtn.classList.remove('text-gray-400', 'bg-dark-700', 'border-transparent');
            } else {
                filterBtn.classList.remove('text-accent-orange', 'border-accent-orange', 'bg-accent-orange/10');
                filterBtn.classList.add('text-gray-400', 'bg-dark-700', 'border-transparent');
            }
        } else if (profileState.tab === 'packs') {
            filterWrapper.classList.remove('hidden');
            
            let optionsHtml = `<button onclick="setProfileFilter('all')" class="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-dark-700 hover:text-white font-bold">All</button>`;
            
            const tiers = typeof tierConfig !== 'undefined' ? Object.keys(tierConfig) : ["Silver", "Gold", "Platinum", "Sapphire", "Ruby", "Diamond", "Onyx", "Obsidian"];
            
            tiers.forEach(tier => {
                const style = (typeof tierConfig !== 'undefined') ? tierConfig[tier].color : "text-gray-300";
                optionsHtml += `<button onclick="setProfileFilter('${tier}')" class="block w-full text-left px-4 py-2 text-xs ${style} hover:bg-dark-700 font-bold">${tier}</button>`;
            });
            
            filterDropdown.innerHTML = optionsHtml;
            
            if(filterLabel) filterLabel.textContent = profileState.filter === 'all' ? 'Filter: All' : profileState.filter;
            
            if (profileState.filter !== 'all') {
                filterBtn.classList.add('text-accent-orange', 'border-accent-orange', 'bg-accent-orange/10');
                filterBtn.classList.remove('text-gray-400', 'bg-dark-700', 'border-transparent');
            } else {
                filterBtn.classList.remove('text-accent-orange', 'border-accent-orange', 'bg-accent-orange/10');
                filterBtn.classList.add('text-gray-400', 'bg-dark-700', 'border-transparent');
            }

        } else {
            filterWrapper.classList.add('hidden');
        }
    }

    const listContainer = document.getElementById('profileLevelsList');
    listContainer.innerHTML = '';

    if (profileState.tab === 'packs') {
        if (profileState.filter !== 'all') {
            packsToRender = packsToRender.filter(p => p.tier === profileState.filter);
        }

        if (packsToRender.length === 0) {
            const msg = profileState.filter !== 'all' ? `No ${profileState.filter} packs found.` : `No ${profileState.mode} packs completed yet.`;
            listContainer.innerHTML = `<div class="text-gray-500 italic text-sm p-4">${msg}</div>`;
            return;
        }

        listContainer.innerHTML = packsToRender.map(pack => {
            let packPts = 0;
            if (typeof getPackPoints === 'function') packPts = getPackPoints(pack);
            
            const tierStyle = (typeof tierConfig !== 'undefined' && tierConfig[pack.tier]) ? tierConfig[pack.tier].color : "text-gray-400";
            
            return `
                <div onclick="goToPackFromProfile('${pack.name}')" class="relative flex items-center justify-between bg-dark-800 p-4 rounded border border-dark-600 overflow-hidden group cursor-pointer hover:border-accent-orange/50 transition-colors">
                     <div class="flex items-center gap-4 z-10">
                        <div>
                            <div class="font-black text-white text-lg leading-none flex items-center gap-2">
                                ${pack.name}
                                <span class="text-[10px] uppercase border border-dark-600 bg-dark-900/50 px-1.5 py-0.5 rounded ${tierStyle}">${pack.tier}</span>
                            </div>
                            <div class="text-xs text-gray-400 font-bold mt-1 text-accent-gold">+${packPts} Pack Points</div>
                        </div>
                    </div>
                    <div class="z-10">
                         <span class="text-accent-green text-[10px] font-bold uppercase tracking-wider bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/20">COMPLETED</span>
                    </div>
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let listToRender = profileState.tab === 'completed' ? activeCompleted : activeCreated;

    if (profileState.tab === 'completed' && profileState.filter !== 'all') {
        listToRender = listToRender.filter(lvl => {
            const rank = lvl._rank;
            const isVerifier = lvl.verifier === username;
            
            const victorRecord = lvl.victors ? lvl.victors.find(v => v.name === username) : null;
            const isVictorMobile = victorRecord && victorRecord.mobile === true;
            const isVerifierMobile = isVerifier && lvl.verifierMobile === true;
            const isMobile = isVictorMobile || isVerifierMobile;
            
            const isFormerHardestVictor = victorRecord && victorRecord.formerHardest === true;
            let isFormerHardest = (isVerifier && lvl.formerTop1 === true) || isFormerHardestVictor;
            if (isFormerHardest && rank === hardestRank) {
                isFormerHardest = false;
            }

            if (profileState.filter === 'verified') return isVerifier;
            if (profileState.filter === 'mobile') return isMobile;
            if (profileState.filter === 'former_hardest') return isFormerHardest;
            
            return true;
        });
    }

    if (listToRender.length === 0) {
        const msg = profileState.tab === 'created' 
            ? "No created levels found." 
            : `No ${profileState.tab} levels found with current filter.`;
        listContainer.innerHTML = `<div class="text-gray-500 italic text-sm p-4">${msg}</div>`;
    } else {
        listToRender.sort((a, b) => a._rank - b._rank);

        listToRender.forEach(lvl => {
            const rank = lvl._rank;
            const pointsInActiveList = calculatePoints(rank); 
            const isVerifier = lvl.verifier === username;
            const victorRecord = lvl.victors ? lvl.victors.find(v => v.name === username) : null;
            const isVictorMobile = victorRecord && victorRecord.mobile === true;
            const isVerifierMobile = isVerifier && lvl.verifierMobile === true;
            const isMobile = isVictorMobile || isVerifierMobile;
            
            const isFormerHardestVictor = victorRecord && victorRecord.formerHardest === true;
            let isFormerHardest = (isVerifier && lvl.formerTop1 === true) || isFormerHardestVictor;
            if (isFormerHardest && rank === hardestRank) {
                isFormerHardest = false;
            }
            
            let badgeHtml = '';
            if (isVerifier && profileState.tab === 'completed') {
                badgeHtml += `<span class="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-500/50">VERIFIED</span>`;
            }
            if (isMobile && profileState.tab === 'completed') {
                badgeHtml += `<span class="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase rounded border border-cyan-500/50">MOBILE</span>`;
            }
            if (isFormerHardest && profileState.tab === 'completed') {
                 badgeHtml += `<span class="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase rounded border border-yellow-500/50">FORMER HARDEST</span>`;
            }

            let displayVideoUrl = null;
            if (profileState.tab === 'completed') {
                let rawLink = null;
                if (isVerifier) rawLink = lvl.videoUrl;
                else if (victorRecord && victorRecord.link) rawLink = victorRecord.link;
                
                if (rawLink && (rawLink.startsWith('http://') || rawLink.startsWith('https://'))) {
                    displayVideoUrl = rawLink;
                }
            }

            const div = document.createElement('div');
            div.className = 'relative flex items-center justify-between bg-dark-800 p-3 rounded border border-dark-600 overflow-hidden group cursor-pointer hover:border-accent-orange/50 transition-colors';
            div.onclick = (e) => {
                if (e.target.closest('a')) return;
                goToLevelFromProfile(lvl.name);
            };
            
            let pointsHtml = '';
            if (profileState.tab === 'completed') {
                pointsHtml = `<div class="text-xs text-gray-400 font-bold mt-1">+${pointsInActiveList.toFixed(1)} points</div>`;
            } else {
                pointsHtml = '';
            }

            let rankColor = 'text-white/50';
            let titleColor = 'text-white';

            if (rank === 1) { 
                rankColor = 'text-accent-gold'; 
            }
            else if (rank <= 3) { 
                rankColor = 'text-gray-300'; 
            } 
            else if (rank <= 10) { 
                rankColor = 'text-accent-red'; 
            }

            div.innerHTML = `
                <div class="flex items-center gap-4 z-10">
                    <span class="${rankColor} font-black text-xl w-12 text-right">#${rank}</span>
                    <div>
                        <div class="${titleColor} font-black text-lg leading-none flex items-center">
                            ${lvl.name}
                            ${badgeHtml}
                        </div>
                        ${pointsHtml}
                    </div>
                </div>
                <div class="z-10 flex items-center gap-2">
                    ${displayVideoUrl ? `
                        <a href="${displayVideoUrl}" target="_blank" class="w-8 h-8 bg-white rounded flex items-center justify-center hover:scale-110 transition-transform">
                            <i data-lucide="play" class="w-4 h-4 text-black fill-current"></i>
                        </a>
                    ` : ''}
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 pointer-events-none"></div>
            `;
            listContainer.appendChild(div);
        });
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.goToPackFromProfile = function(packName) {
    if (typeof showPacks === 'function' && typeof viewPack === 'function') {
        showPacks();
        viewPack(packName);
    }
}

window.goToLevelFromProfile = function(levelName) {
    if (typeof showList === 'function') {
        showList();
        
        let data = typeof classicData !== 'undefined' ? classicData : [];
        let idx = data.findIndex(l => l.name.toLowerCase() === levelName.toLowerCase());
        let type = 'classic';

        if (idx === -1) {
            data = typeof platformerData !== 'undefined' ? platformerData : [];
            idx = data.findIndex(l => l.name.toLowerCase() === levelName.toLowerCase());
            type = 'platformer';
        }

        if (idx !== -1) {
            if (typeof currentListType !== 'undefined' && currentListType !== type && typeof switchListTab === 'function') {
                switchListTab(type);
            }
            
            if (typeof currentLevelIndex !== 'undefined') currentLevelIndex = idx; 
            
            if(typeof renderSidebarList === 'function') renderSidebarList(data); 
            if(typeof selectLevel === 'function') selectLevel(idx);
            
            const sidebar = document.getElementById('levelSidebar');
            if(sidebar && sidebar.children[idx]) {
                sidebar.children[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            console.warn("Level not found in data: " + levelName);
        }
    }
};


// --- STAFF RENDER LOGIC ---

function renderStaff() {
    if (typeof staffData === 'undefined') return;

    const editorGroups = [
        { key: 'owners', listId: 'staff-owners-list', groupId: 'staff-owners-group', icon: 'crown', color: 'text-accent-gold' },
        { key: 'moderators', listId: 'staff-moderators-list', groupId: 'staff-moderators-group', icon: 'shield', color: 'text-accent-green' },
        { key: 'helpers', listId: 'staff-helpers-list', groupId: 'staff-helpers-group', icon: 'wrench', color: 'text-accent-blue' }
    ];

    editorGroups.forEach(group => {
        const listContainer = document.getElementById(group.listId);
        const groupContainer = document.getElementById(group.groupId);
        const data = staffData[group.key];

        if (listContainer && groupContainer) {
            if (data && data.length > 0) {
                listContainer.innerHTML = data.map(member => `
                    <span class="bg-dark-900 border border-dark-600 text-gray-300 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 hover:bg-dark-700 transition-colors cursor-pointer" onclick="renderProfile('${member.name}')">
                        <i data-lucide="${group.icon}" class="w-3 h-3 ${group.color}"></i> ${member.name}
                    </span>
                `).join('');
                groupContainer.classList.remove('hidden');
            } else {
                groupContainer.classList.add('hidden');
            }
        }
    });

    const supportersCard = document.getElementById('staff-supporters-card');
    const supportersList = document.getElementById('staff-supporters-list');
    const supportersData = staffData.supporters;
    
    if (supportersCard && supportersList) {
        if (supportersData && supportersData.length > 0) {
             supportersList.innerHTML = supportersData.map(member => `
                <span class="bg-dark-900 border border-dark-600 text-gray-300 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 hover:bg-dark-700 transition-colors cursor-pointer" onclick="renderProfile('${member.name}')">
                    <i data-lucide="heart" class="w-3 h-3 text-pink-400"></i> ${member.name}
                </span>
            `).join('');
            supportersCard.classList.remove('hidden');
        } else {
            supportersCard.classList.add('hidden');
        }
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Start
initSocial();