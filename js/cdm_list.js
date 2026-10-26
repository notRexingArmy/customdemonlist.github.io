// --- TAB LOGIC ---
const listTabClassic = document.getElementById('listTabClassic');
const listTabPlatformer = document.getElementById('listTabPlatformer');

let currentRecordPage = 1;
const recordsPerPage = 10;

function switchListTab(type) {
    if (!listTabClassic || !listTabPlatformer) return;

    currentListType = type;
    currentLevelIndex = 0; 
    
    // Ensure activeFilters exists
    if (typeof activeFilters === 'undefined') {
        window.activeFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
    }
    // Note: We don't reset filters on tab switch to keep UX consistent if user wants to see "Long" levels in both lists?
    // Actually, usually you reset. Let's keep reset for now.
    activeFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
    
    if (typeof updateFilterIndicator === 'function') updateFilterIndicator();

    if (type === 'classic') {
        listTabClassic.classList.add('bg-accent-orange', 'text-white', 'shadow-lg', 'shadow-orange-500/20', 'hover:bg-orange-600');
        listTabClassic.classList.remove('bg-dark-800', 'text-gray-400', 'border', 'border-dark-600', 'hover:bg-dark-700', 'hover:text-white');
        
        listTabPlatformer.classList.remove('bg-accent-orange', 'text-white', 'shadow-lg', 'shadow-orange-500/20', 'hover:bg-orange-600');
        listTabPlatformer.classList.add('bg-dark-800', 'text-gray-400', 'border', 'border-dark-600', 'hover:bg-dark-700', 'hover:text-white');
    } else {
        listTabPlatformer.classList.add('bg-accent-orange', 'text-white', 'shadow-lg', 'shadow-orange-500/20', 'hover:bg-orange-600');
        listTabPlatformer.classList.remove('bg-dark-800', 'text-gray-400', 'border', 'border-dark-600', 'hover:bg-dark-700', 'hover:text-white');
        
        listTabClassic.classList.remove('bg-accent-orange', 'text-white', 'shadow-lg', 'shadow-orange-500/20', 'hover:bg-orange-600');
        listTabClassic.classList.add('bg-dark-800', 'text-gray-400', 'border', 'border-dark-600', 'hover:bg-dark-700', 'hover:text-white');
    }

    renderSidebarList(getFilteredLevels());
    selectLevel(0);
}

// --- FILTERING LOGIC ---
const listSearchInput = document.getElementById('listSearchInput');

function getFilteredLevels() {
    const term = listSearchInput?.value.toLowerCase().trim() || '';
    
    if (typeof getActiveData !== 'function') {
        console.error("getActiveData function missing in cdm_core.js");
        return [];
    }
    const data = getActiveData();
    if (!data) return [];
    
    let filtered = data.filter((level) => {
        const processedLevel = getProcessedLevel(level);
        const globalIndex = data.indexOf(level);
        const rank = globalIndex + 1;

        const creatorsText = processedLevel.creators ? processedLevel.creators.join(' ') : (processedLevel.creator || '');
        const matchesText = processedLevel.name.toLowerCase().includes(term) || 
                            creatorsText.toLowerCase().includes(term) ||
                            (term.startsWith('#') && rank.toString().includes(term.substring(1)));
        
        let matchesTags = true;
        if (activeFilters.tags.size > 0) {
            const levelTags = processedLevel.tags || [];
            for (let tag of activeFilters.tags) {
                if (!levelTags.includes(tag)) {
                    matchesTags = false;
                    break;
                }
            }
        }

        let matchesRank = true;
        if (activeFilters.rankMin !== '' && rank < parseInt(activeFilters.rankMin)) matchesRank = false;
        if (activeFilters.rankMax !== '' && rank > parseInt(activeFilters.rankMax)) matchesRank = false;

        return matchesText && matchesTags && matchesRank;
    });

    if (activeFilters.sort === 'enjoyment') {
        filtered.sort((a, b) => getAverageEnjoyment(b) - getAverageEnjoyment(a));
    } else if (activeFilters.sort === 'in_packs') {
        if (typeof packsData !== 'undefined') {
            const allPackLevels = new Set();
            packsData.forEach(pack => {
                if (pack.levels) {
                    pack.levels.forEach(l => allPackLevels.add(l.toLowerCase()));
                }
            });
            filtered = filtered.filter(l => allPackLevels.has(l.name.toLowerCase()));
        }
    }

    return filtered;
}

if (listSearchInput) {
    listSearchInput.addEventListener('input', () => {
        renderSidebarList(getFilteredLevels());
    });
}


// --- FILTER MODAL LOGIC (LIVE UPDATE) ---
const filterModal = document.getElementById('filterModal');
const filterTagsContainer = document.getElementById('filterTagsContainer');
const applyFiltersBtn = document.getElementById('applyFiltersBtn'); // Now acts as "Done"
const cancelFiltersBtn = document.getElementById('cancelFiltersBtn'); // Now acts as "Close"
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const closeFilterModalBtn = document.getElementById('closeFilterModalBtn');
const activeFiltersDot = document.getElementById('activeFiltersDot');
const filterBtn = document.getElementById('filterBtn');
const filterRankMin = document.getElementById('filterRankMin');
const filterRankMax = document.getElementById('filterRankMax');
const sortRadios = document.getElementsByName('sortType');

function openFilterModal() {
    // No temp filters, use active directly
    renderFilterOptions();
    if(filterRankMin) filterRankMin.value = activeFilters.rankMin;
    if(filterRankMax) filterRankMax.value = activeFilters.rankMax;
    
    if (sortRadios) {
        for(const radio of sortRadios) {
            if(radio.value === activeFilters.sort) radio.checked = true;
            // LIVE UPDATE ON RADIO CHANGE
            radio.onclick = () => { 
                activeFilters.sort = radio.value;
                updateFilterIndicator();
                renderSidebarList(getFilteredLevels());
            };
        }
    }

    if(filterRankMin) filterRankMin.oninput = (e) => {
        activeFilters.rankMin = e.target.value;
        updateFilterIndicator();
        renderSidebarList(getFilteredLevels());
    };
    if(filterRankMax) filterRankMax.oninput = (e) => {
        activeFilters.rankMax = e.target.value;
        updateFilterIndicator();
        renderSidebarList(getFilteredLevels());
    };

    if(filterModal) {
        filterModal.classList.remove('hidden');
        filterModal.classList.add('flex');
    }
}

function closeFilterModal() {
    if(filterModal) {
        filterModal.classList.add('hidden');
        filterModal.classList.remove('flex');
    }
}

if (filterBtn) filterBtn.addEventListener('click', openFilterModal);
if (closeFilterModalBtn) closeFilterModalBtn.addEventListener('click', closeFilterModal);
if (cancelFiltersBtn) cancelFiltersBtn.addEventListener('click', closeFilterModal);

if (filterModal) {
    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            closeFilterModal();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filterModal && !filterModal.classList.contains('hidden')) {
        closeFilterModal();
    }
});

// "Apply" button essentially just closes now since updates are live
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
        closeFilterModal();
    });
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        if (typeof activeFilters === 'undefined') window.activeFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
        activeFilters.tags.clear();
        activeFilters.sort = 'rank';
        activeFilters.rankMin = '';
        activeFilters.rankMax = '';
        
        renderFilterOptions();
        
        if(filterRankMin) filterRankMin.value = '';
        if(filterRankMax) filterRankMax.value = '';
        if(sortRadios) { for(const radio of sortRadios) { if(radio.value === 'rank') radio.checked = true; } }
        
        updateFilterIndicator();
        renderSidebarList(getFilteredLevels());
    });
}

function renderFilterOptions() {
    if (!filterTagsContainer) return;
    const tagsToShow = currentListType === 'classic' ? classicTags : platformerTags;
    const tagsWithUnrated = new Set([...tagsToShow, "Unrated"]);
    
    // Sort
    const sortedTags = Array.from(tagsWithUnrated).sort((a, b) => a.localeCompare(b));
    
    // Get active data to check usage
    const data = getActiveData();
    // Build set of used tags
    const usedTags = new Set();
    if(data) {
        data.forEach(level => {
            if(level.tags) {
                level.tags.forEach(t => usedTags.add(t));
            }
            if(level.unrated) usedTags.add("Unrated");
        });
    }

    filterTagsContainer.innerHTML = sortedTags.map(tag => {
        // Only show if used
        if (!usedTags.has(tag)) return '';

        const isActive = activeFilters.tags.has(tag);
        return `
            <button onclick="toggleTag('${tag}')" class="px-3 py-1.5 text-xs rounded transition-all border ${isActive ? 'bg-accent-orange border-accent-orange text-black font-bold' : 'bg-dark-900 border-dark-600 text-gray-400 hover:border-gray-400'}">
                ${tag}
            </button>
        `;
    }).join('');
}

// LIVE UPDATE ON TAG TOGGLE
function toggleTag(tag) {
    if (activeFilters.tags.has(tag)) {
        activeFilters.tags.delete(tag);
    } else {
        activeFilters.tags.add(tag);
    }
    renderFilterOptions();
    updateFilterIndicator();
    renderSidebarList(getFilteredLevels());
}

window.toggleTagFromList = function(tag) {
    if (activeFilters.tags.has(tag)) {
        activeFilters.tags.delete(tag);
    } else {
        activeFilters.tags.add(tag);
    }
    
    // Sync tempFilters to prevent desync
    if (typeof tempFilters === 'undefined') window.tempFilters = { tags: new Set(), sort: 'rank', rankMin: '', rankMax: '' };
    tempFilters.tags = new Set(activeFilters.tags);
    
    updateFilterIndicator();
    renderSidebarList(getFilteredLevels());
    selectLevel(currentLevelIndex);
}

function updateFilterIndicator() {
    const hasFilters = activeFilters.tags.size > 0 || activeFilters.sort !== 'rank' || activeFilters.rankMin !== '' || activeFilters.rankMax !== '';
    if (activeFiltersDot && filterBtn) {
        if (hasFilters) {
            activeFiltersDot.classList.remove('hidden');
            filterBtn.classList.add('text-accent-orange', 'border-accent-orange');
        } else {
            activeFiltersDot.classList.add('hidden');
            filterBtn.classList.remove('text-accent-orange', 'border-accent-orange');
        }
    }
}


// --- SIDEBAR RENDERING ---
const levelSidebar = document.getElementById('levelSidebar');
const levelDetailsContainer = document.getElementById('levelDetailsContainer');
const levelRecords = document.getElementById('levelRecords');
const recordsHeader = document.getElementById('recordsHeader');

function renderSidebarList(levels) {
    if (!levelSidebar) return;
    levelSidebar.innerHTML = '';
    
    if (!levels || levels.length === 0) {
        levelSidebar.innerHTML = `<div class="p-4 text-center text-gray-500 text-xs">No levels match criteria</div>`;
        return;
    }

    const data = getActiveData(); 

    levels.forEach((level) => {
        const globalIndex = data.indexOf(level);
        const realRank = globalIndex + 1;
        
        const item = document.createElement('div');
        item.className = `flex items-center gap-3 p-3 border-b border-dark-600/50 cursor-pointer hover:bg-dark-800 transition-colors ${globalIndex === currentLevelIndex ? 'bg-accent-orange/10 border-l-4 border-l-accent-orange' : 'border-l-4 border-l-transparent'}`;
        
        item.onclick = () => {
            currentLevelIndex = globalIndex;
            renderSidebarList(levels); 
            selectLevel(globalIndex); 
        };

        let rankColorClass = 'text-gray-500';
        if (realRank === 1) rankColorClass = 'text-accent-gold';
        else if (realRank <= 3) rankColorClass = 'text-gray-300';
        else if (realRank <= 10) rankColorClass = 'text-accent-red';

        const starHtml = level.formerTop1 ? 
            `<span class="tooltip-trigger" data-tooltip-text="Former Top 1"><i data-lucide="star" class="w-3 h-3 text-accent-gold fill-accent-gold ml-1"></i></span>` 
            : '';

        let extraInfo = '';
        if (activeFilters.sort === 'enjoyment') {
            const score = getAverageEnjoyment(level);
            const val = score >= 0 ? score.toFixed(0) : '-';
            extraInfo = `<span class="ml-auto text-xs font-bold text-accent-green">${val}%</span>`;
        }

        item.innerHTML = `
            <div class="w-8 text-right font-bold text-sm ${rankColorClass}">#${realRank}</div>
            <div class="flex-1 min-w-0 flex items-center gap-1">
                <div class="text-sm font-bold text-white truncate">${level.name}</div>
                ${starHtml}
            </div>
            ${extraInfo}
        `;
        levelSidebar.appendChild(item);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectLevel(index) {
    const data = getActiveData();
    const level = data[index];
    if (!level) return;

    if (index !== currentLevelIndex) {
        currentRecordPage = 1;
    }
    
    const processedLevel = getProcessedLevel(level);

    const rank = data.indexOf(level) + 1;
    const points = calculatePoints(rank);
    const embedData = getVideoEmbed(processedLevel.videoUrl);
    
    let tagsHtml = '';
    if (processedLevel.tags && processedLevel.tags.length > 0) {
        tagsHtml = `<div class="flex flex-wrap gap-2 mt-4">` + 
            processedLevel.tags.map(tag => {
                const desc = tagDescriptions[tag];
                const isActive = activeFilters.tags.has(tag);
                
                const activeClasses = isActive 
                    ? 'bg-accent-orange border-accent-orange text-black font-bold hover:bg-orange-600 hover:border-orange-600' 
                    : 'bg-dark-800 border-dark-600 text-gray-400 font-mono hover:border-accent-orange hover:text-accent-orange';

                return `<button 
                            onclick="toggleTagFromList('${tag}')" 
                            title="${desc || tag}" 
                            class="tag-item px-2 py-1 rounded text-xs cursor-pointer transition-colors duration-200 ${activeClasses}">
                            ${tag}
                        </button>`
            }).join('') +
            `</div>`;
    }

    let packsHtml = '';
    if (typeof packsData !== 'undefined') {
        const containingPacks = packsData.filter(p => 
            p.levels.some(l => l.toLowerCase() === processedLevel.name.toLowerCase())
        );

        if (containingPacks.length > 0) {
            packsHtml = `<div class="flex flex-wrap gap-2 mt-3 mb-2">` + 
                containingPacks.map(p => {
                    const safeName = p.name.replace(/'/g, "\\'");
                    return `<button 
                                onclick="goToPackFromList('${safeName}')" 
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400 transition-all group">
                                <i data-lucide="layers" class="w-3 h-3 group-hover:scale-110 transition-transform"></i>
                                ${p.name}
                            </button>`
                }).join('') +
                `</div>`;
        }
    }

    let creatorsHtml = '';
    const creatorsArray = (processedLevel.creators && processedLevel.creators.length > 0) 
        ? processedLevel.creators 
        : [processedLevel.creator || 'Unknown'];

    creatorsHtml = creatorsArray.map(creatorName => {
        let isRegistered = false;
        if (typeof users !== 'undefined') {
            isRegistered = users.some(u => u.username === creatorName);
        }
        
        if (isRegistered) {
            return `<span class="text-accent-gold font-medium bg-dark-800 px-3 py-1 rounded cursor-pointer hover:bg-dark-700 hover:text-white transition-colors" onclick="renderProfile('${creatorName}')">${creatorName}</span>`;
        } else {
            return `<span class="text-accent-gold font-medium bg-dark-800 px-3 py-1 rounded">${creatorName}</span>`;
        }
    }).join(''); 

    const verifierName = processedLevel.verifier || 'Unknown';
    let verifierHtml = `<span class="text-accent-blue font-medium bg-dark-800 px-3 py-1 rounded">${verifierName}</span>`;
    
    if (typeof users !== 'undefined' && users.some(u => u.username === verifierName)) {
        verifierHtml = `<span class="text-accent-blue font-medium bg-dark-800 px-3 py-1 rounded cursor-pointer hover:bg-dark-700 hover:text-white transition-colors" onclick="renderProfile('${verifierName}')">${verifierName}</span>`;
    }

    const publisherName = processedLevel.publisher || 'Unknown';
    let publisherHtml = `<span class="text-white font-medium bg-dark-800 px-3 py-1 rounded">${publisherName}</span>`;

    if (typeof users !== 'undefined' && users.some(u => u.username === publisherName)) {
        publisherHtml = `<span class="text-white font-medium bg-dark-800 px-3 py-1 rounded cursor-pointer hover:bg-dark-700 hover:text-white transition-colors" onclick="renderProfile('${publisherName}')">${publisherName}</span>`;
    }

    let enjoymentDisplay = '-';
    if (processedLevel.enjoymentRatings && Array.isArray(processedLevel.enjoymentRatings) && processedLevel.enjoymentRatings.length > 0) {
        const sum = processedLevel.enjoymentRatings.reduce((a, b) => a + b, 0);
        const avg = sum / processedLevel.enjoymentRatings.length;
        enjoymentDisplay = avg.toFixed(2);
        if (enjoymentDisplay.endsWith('.00')) enjoymentDisplay = enjoymentDisplay.slice(0, -3);
    }

    levelDetailsContainer.innerHTML = `
        <div class="space-y-6">
            <div>
                <div class="flex items-center">
                    <h1 class="text-4xl font-black text-white uppercase tracking-tighter mb-2">${processedLevel.name}</h1>
                </div>
                <p class="text-gray-400 text-sm leading-relaxed">
                   ${processedLevel.description || 'No description provided.'}
                </p>
                ${packsHtml}
                ${tagsHtml}
            </div>

            <div class="flex justify-center">
                <div class="relative w-[95%] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-dark-600 group">
                    ${embedData ? `
                        <iframe class="absolute inset-0 w-full h-full" src="${embedData.url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    ` : `
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-4">
                            <i data-lucide="video-off" class="w-12 h-12"></i>
                            <div class="text-sm">
                                ${processedLevel.videoUrl ? 
                                    `<a href="${processedLevel.videoUrl}" target="_blank" class="text-accent-blue hover:underline font-bold">Watch Video on External Site</a>` 
                                    : "No video available"
                                }
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-dark-800/50 rounded-xl p-4 border border-dark-600">
                 <div class="text-center">
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Level ID</div>
                    <div class="text-xl font-bold text-white">${processedLevel.level_id || '-'}</div>
                </div>
                <div class="text-center">
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">List Points</div>
                    <div class="text-xl font-bold text-accent-green">${points.toFixed(1)}</div>
                </div>
                <div class="text-center">
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Enjoyment</div>
                    <div class="text-xl font-bold text-white">${enjoymentDisplay}<span class="text-xs text-gray-500">/100</span></div>
                </div>
                <div class="text-center cursor-pointer hover:bg-dark-800 transition-colors rounded" onclick="window.open('https://gdladder.com/references', '_blank')">
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-accent-orange">GDDL Tier</div>
                    <div class="text-xl font-bold text-white group-hover:text-accent-orange">${processedLevel.tier || '-'}</div>
                </div>
            </div>
            
            <div class="space-y-4 text-sm border-t border-dark-600 pt-4">
                <div class="flex justify-between items-center border-b border-dark-600/50 pb-2">
                     <span class="text-gray-500 font-bold tracking-wider">PUBLISHER</span>
                     ${publisherHtml}
                </div>
                <div class="flex justify-between items-center border-b border-dark-600/50 pb-2">
                     <span class="text-gray-500 font-bold tracking-wider">VERIFIER</span>
                     ${verifierHtml}
                </div>
                <div class="flex justify-between items-center">
                     <span class="text-gray-500 font-bold tracking-wider">CREATORS</span>
                     <div class="flex flex-wrap gap-2 justify-end">
                        ${creatorsHtml}
                     </div>
                </div>
            </div>
        </div>
    `;

    currentRecordPage = 1;
    renderLevelRecords(processedLevel.victors || []);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderLevelRecords(victors) {
    if (!recordsHeader || !levelRecords) return;
    
    recordsHeader.textContent = `Records (${victors.length})`;
    levelRecords.innerHTML = '';

    if (victors.length > 0) {
        const start = (currentRecordPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pageVictors = victors.slice(start, end);

        pageVictors.forEach(victor => {
            const userObj = (typeof users !== 'undefined' ? users : []).find(u => u.username === victor.name);
            const countryCode = (userObj && userObj.country) ? userObj.country.toLowerCase() : 'us';
            const flag = `https://flagcdn.com/w20/${countryCode}.png`;
            
            const row = document.createElement('div');
            row.className = "flex items-center justify-between p-2 hover:bg-dark-800 rounded group transition-colors";
            
            let mobileIcon = '';
            if (victor.mobile) {
                mobileIcon = `<span class="ml-2 text-accent-blue font-bold text-xs cursor-pointer" title="Mobile Completion">M</span>`;
            }

            row.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden" onclick="renderProfile('${victor.name}')">
                    <img src="${flag}" class="w-4 h-auto rounded-sm flex-shrink-0">
                    <span class="text-sm font-bold text-gray-300 group-hover:text-white truncate cursor-pointer transition-colors">${victor.name}</span>
                    ${mobileIcon}
                </div>
                ${(victor.link && victor.link.startsWith('https')) ? `
                <a href="${victor.link}" target="_blank" class="p-1.5 bg-dark-700 hover:bg-white hover:text-black text-gray-400 rounded transition-colors flex-shrink-0">
                    <i data-lucide="youtube" class="w-3 h-3"></i>
                </a>` : ''}
            `;
            levelRecords.appendChild(row);
        });

        if (victors.length > recordsPerPage) {
            const existingPagination = levelRecordsContainer.querySelector('.border-t.border-dark-600.flex.justify-center.gap-2'); 
            const totalPages = Math.ceil(victors.length / recordsPerPage);

            if(existingPagination) {
                existingPagination.innerHTML = `
                    <button onclick="changeRecordPage(-1)" class="px-2 py-1 text-xs text-gray-500 hover:text-white ${currentRecordPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentRecordPage === 1 ? 'disabled' : ''}>Previous</button>
                    <span class="w-6 h-6 bg-accent-orange text-black font-bold text-xs rounded flex items-center justify-center">${currentRecordPage}</span>
                    <button onclick="changeRecordPage(1)" class="px-2 py-1 text-xs text-gray-500 hover:text-white ${currentRecordPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentRecordPage === totalPages ? 'disabled' : ''}>Next</button>
                `;
                existingPagination.style.display = 'flex';
            }
        } else {
             const existingPagination = levelRecordsContainer.querySelector('.border-t.border-dark-600.flex.justify-center.gap-2');
             if(existingPagination) existingPagination.style.display = 'none';
        }

    } else {
        levelRecords.innerHTML = `
            <div class="text-center py-10 text-gray-600">
                <i data-lucide="shield-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-xs">No records yet.</p>
            </div>
        `;
        const existingPagination = levelRecordsContainer.querySelector('.border-t.border-dark-600.flex.justify-center.gap-2');
        if(existingPagination) existingPagination.style.display = 'none';
    }
}

window.changeRecordPage = function(direction) {
    const data = getActiveData();
    const level = data[currentLevelIndex];
    if (!level) return;
    
    const victors = getProcessedLevel(level).victors || [];
    const totalPages = Math.ceil(victors.length / recordsPerPage);
    
    const newPage = currentRecordPage + direction;
    if (newPage > 0 && newPage <= totalPages) {
        currentRecordPage = newPage;
        renderLevelRecords(victors);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

window.goToPackFromList = function(packName) {
    if (typeof showPacks === 'function') {
        showPacks();
        
        if (typeof packsData !== 'undefined' && typeof switchPackTab === 'function') {
            const pack = packsData.find(p => p.name === packName);
            if (pack) {
                if (pack.platformer) {
                    switchPackTab('platformer');
                } else {
                    switchPackTab('classic');
                }
            }
        }
        
        if (typeof viewPack === 'function') {
            setTimeout(() => viewPack(packName), 50);
        }
    } else {
        console.error("Navigation functions missing");
    }
}

function initList() {
    if (listTabClassic) {
        listTabClassic.addEventListener('click', () => switchListTab('classic'));
    }
    if (listTabPlatformer) {
        listTabPlatformer.addEventListener('click', () => switchListTab('platformer'));
    }
    
    switchListTab('classic');
}

initList();