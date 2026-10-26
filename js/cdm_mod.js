// --- MOD PANEL STATE ---
let currentModTab = 'submissions'; 
let currentModListType = 'classic';
let pendingAction = null; 

let mockSubmissions = [];

// Listen for new submissions
window.addEventListener('newSubmissionAdded', (e) => {
    if (e.detail) {
        // Changed unshift to push so newest submissions go to the end of the queue
        mockSubmissions.push(e.detail);
        const panel = document.getElementById('modPanelSection');
        if (panel && !panel.classList.contains('hidden') && currentModTab === 'submissions') {
            renderModSubmissions();
        }
    }
});

// --- INITIALIZATION ---
function initModPanel() {
    document.getElementById('modTabSubmissions')?.addEventListener('click', () => switchModTab('submissions'));
    document.getElementById('modTabBans')?.addEventListener('click', () => switchModTab('bans'));
    document.getElementById('modTabAudit')?.addEventListener('click', () => switchModTab('audit'));
    document.getElementById('modTabListManager')?.addEventListener('click', () => switchModTab('listmanager'));

    document.getElementById('modListTabClassic')?.addEventListener('click', () => switchModListType('classic'));
    document.getElementById('modListTabPlatformer')?.addEventListener('click', () => switchModListType('platformer'));
    document.getElementById('btnSaveListOrder')?.addEventListener('click', generateListCode);

    document.getElementById('confirmModActionBtn')?.addEventListener('click', executeModAction);
    document.getElementById('cancelModActionBtn')?.addEventListener('click', closeModModal);
}

// --- TABS ---
function switchModTab(tab) {
    currentModTab = tab;
    const tabs = ['submissions', 'bans', 'audit', 'listmanager'];
    tabs.forEach(t => {
        const btn = document.getElementById(`modTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const content = document.getElementById(`modContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
        
        if (t === tab) {
            btn?.classList.add('border-accent-gold', 'text-white');
            btn?.classList.remove('border-transparent', 'text-gray-500');
            if(content) content.classList.remove('hidden');
        } else {
            btn?.classList.remove('border-accent-gold', 'text-white');
            btn?.classList.add('border-transparent', 'text-gray-500');
            if(content) content.classList.add('hidden');
        }
    });

    if (tab === 'submissions') renderModSubmissions();
    if (tab === 'listmanager') renderListManager();
}

// --- SUBMISSIONS LOGIC ---
function renderModSubmissions() {
    const list = document.getElementById('modSubmissionsList');
    if (!list) return;

    if (mockSubmissions.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-gray-500 italic">No pending submissions.</div>`;
        return;
    }

    list.innerHTML = mockSubmissions.map((sub, index) => {
        // Find Rank Logic
        const levelName = sub.level.toLowerCase();
        let data = typeof classicData !== 'undefined' ? classicData : [];
        let rank = data.findIndex(l => l.name.toLowerCase() === levelName) + 1;
        let rankClass = "text-gray-500"; // default

        // If not found in classic, try platformer
        if (rank === 0 && typeof platformerData !== 'undefined') {
            data = platformerData;
            rank = data.findIndex(l => l.name.toLowerCase() === levelName) + 1;
        }

        if (rank > 0) {
            if (rank === 1) rankClass = "text-accent-gold";
            else if (rank === 2) rankClass = "text-gray-300";
            else if (rank === 3) rankClass = "text-[#CD7F32]";
            else if (rank <= 10) rankClass = "text-accent-red";
        } else {
            rank = "-"; // Not found
        }

        return `
        <div class="grid grid-cols-12 gap-4 p-4 bg-dark-800 border-b border-dark-600 items-center hover:bg-dark-700 transition-colors cursor-pointer group" onclick="openSubmissionDetail('${sub.id}')">
            <div class="col-span-3 font-bold text-white flex items-center gap-2">
                <span class="font-mono ${rankClass} text-sm w-8 text-right">#${rank}</span>
                ${sub.level}
            </div>
            <div class="col-span-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                ${sub.user}
            </div>
            <div class="col-span-2 text-xs font-mono text-gray-500">
                ${index + 1}
            </div>
            <div class="col-span-3">
                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">${sub.status}</span>
            </div>
            <div class="col-span-2 text-right flex justify-end gap-2">
                <button onclick="event.stopPropagation(); promptModAction('accept', '${sub.id}')" class="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition-colors" title="Accept">
                    <i data-lucide="check" class="w-4 h-4"></i>
                </button>
                <button onclick="event.stopPropagation(); promptModAction('deny', '${sub.id}')" class="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors" title="Deny">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- DETAIL MODAL LOGIC ---
window.openSubmissionDetail = function(submissionId) {
    const sub = mockSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const modal = document.getElementById('modSubmissionDetailModal');
    const index = mockSubmissions.indexOf(sub) + 1;

    // Populate Data
    document.getElementById('modDetailLevelName').textContent = sub.level;
    document.getElementById('modDetailUser').textContent = sub.user;
    document.getElementById('modDetailQueue').textContent = `#${index}`;

    // --- COMMENT FIX: Apply sizing and scrolling styles dynamically ---
    const commentEl = document.getElementById('modDetailComments');
    commentEl.textContent = sub.comments || "No comments.";
    commentEl.className = "text-sm text-gray-300 bg-dark-900/50 p-3 rounded border border-dark-600 whitespace-pre-wrap break-words max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent";
    
    // Links
    const vidLink = document.getElementById('modDetailVideo');
    vidLink.href = sub.link;
    vidLink.textContent = sub.link;

    const rawContainer = document.getElementById('modDetailRawContainer');
    const rawLink = document.getElementById('modDetailRaw');
    if (sub.raw) {
        rawContainer.classList.remove('hidden');
        rawLink.href = sub.raw;
        rawLink.textContent = sub.raw;
    } else {
        rawContainer.classList.add('hidden');
    }

    // Rank Logic Re-used
    let rankHtml = '<span class="text-gray-500 font-bold">Rank: Unranked</span>';
    const levelName = sub.level.toLowerCase();
    let data = typeof classicData !== 'undefined' ? classicData : [];
    let rank = data.findIndex(l => l.name.toLowerCase() === levelName) + 1;
    let rankClass = "text-gray-500";

    if (rank === 0 && typeof platformerData !== 'undefined') {
        data = platformerData;
        rank = data.findIndex(l => l.name.toLowerCase() === levelName) + 1;
    }

    if (rank > 0) {
        if (rank === 1) rankClass = "text-accent-gold";
        else if (rank === 2) rankClass = "text-gray-300";
        else if (rank === 3) rankClass = "text-[#CD7F32]";
        else if (rank <= 10) rankClass = "text-accent-red";
        
        rankHtml = `<span class="${rankClass} font-bold text-2xl">#${rank}</span>`;
    }
    document.getElementById('modDetailRank').innerHTML = rankHtml;

    // Bind Buttons in Detail Modal
    document.getElementById('btnDetailAccept').onclick = () => { closeSubmissionDetail(); promptModAction('accept', sub.id); };
    document.getElementById('btnDetailDeny').onclick = () => { closeSubmissionDetail(); promptModAction('deny', sub.id); };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

window.closeSubmissionDetail = function() {
    const modal = document.getElementById('modSubmissionDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// --- NAVIGATION HELPERS ---
window.modGoToLevel = function(levelName) {
    if (typeof showList === 'function') {
        showList();
        setTimeout(() => {
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
                alert("Level not found in database.");
            }
        }, 100);
    }
}

window.modGoToUser = function(userName) {
    if (typeof renderProfile === 'function') {
        renderProfile(userName);
    } else {
        alert("Profile function not found.");
    }
}

// --- CONFIRMATION MODAL ---
window.promptModAction = function(type, id) {
    pendingAction = { type, id };
    const modal = document.getElementById('modActionModal');
    const title = document.getElementById('modActionTitle');
    const desc = document.getElementById('modActionDesc');
    const confirmBtn = document.getElementById('confirmModActionBtn');

    if (type === 'accept') {
        title.textContent = "Accept Submission";
        desc.textContent = "Are you sure you want to accept this record? This will add it to the leaderboard.";
        confirmBtn.className = "flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors";
        confirmBtn.textContent = "Accept";
    } else {
        title.textContent = "Deny Submission";
        desc.textContent = "Are you sure you want to deny this record?";
        confirmBtn.className = "flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors";
        confirmBtn.textContent = "Deny";
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModModal() {
    document.getElementById('modActionModal').classList.add('hidden');
    document.getElementById('modActionModal').classList.remove('flex');
    pendingAction = null;
}

function executeModAction() {
    if (!pendingAction) return;

    // Execute Logic (Mock)
    const index = mockSubmissions.findIndex(s => s.id === pendingAction.id);
    if (index !== -1) {
        mockSubmissions.splice(index, 1); 
    }

    closeModModal();
    renderModSubmissions();
    
    const toast = document.getElementById('toastNotification');
    const msg = document.getElementById('toastMessage');
    if (toast && msg) {
        msg.textContent = pendingAction.type === 'accept' ? "Submission Accepted!" : "Submission Denied.";
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
    }
}

// --- LIST MANAGER LOGIC ---
function switchModListType(type) {
    currentModListType = type;
    const cBtn = document.getElementById('modListTabClassic');
    const pBtn = document.getElementById('modListTabPlatformer');
    
    if (type === 'classic') {
        cBtn.classList.add('bg-accent-orange', 'text-white');
        cBtn.classList.remove('bg-dark-700', 'text-gray-400');
        pBtn.classList.remove('bg-accent-orange', 'text-white');
        pBtn.classList.add('bg-dark-700', 'text-gray-400');
    } else {
        pBtn.classList.add('bg-accent-orange', 'text-white');
        pBtn.classList.remove('bg-dark-700', 'text-gray-400');
        cBtn.classList.remove('bg-accent-orange', 'text-white');
        cBtn.classList.add('bg-dark-700', 'text-gray-400');
    }
    renderListManager();
}

function renderListManager() {
    const listContainer = document.getElementById('modListManagerList');
    if (!listContainer) return;

    const rankings = currentModListType === 'classic' ? classicRankings : platformerRankings;

    listContainer.innerHTML = rankings.map((levelName, index) => `
        <div class="flex items-center gap-3 p-2 bg-dark-800 border border-dark-600 rounded mb-2 group">
            <span class="font-mono text-gray-500 w-8 text-right">#${index + 1}</span>
            <span class="font-bold text-white flex-grow">${levelName}</span>
            <div class="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <button onclick="moveLevel(${index}, -1)" class="p-1 hover:bg-dark-600 rounded text-gray-300" ${index === 0 ? 'disabled' : ''}>
                    <i data-lucide="arrow-up" class="w-4 h-4"></i>
                </button>
                <button onclick="moveLevel(${index}, 1)" class="p-1 hover:bg-dark-600 rounded text-gray-300" ${index === rankings.length - 1 ? 'disabled' : ''}>
                    <i data-lucide="arrow-down" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.moveLevel = function(index, direction) {
    const rankings = currentModListType === 'classic' ? classicRankings : platformerRankings;
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= rankings.length) return;

    const temp = rankings[index];
    rankings[index] = rankings[newIndex];
    rankings[newIndex] = temp;

    renderListManager();
}

function generateListCode() {
    const rankings = currentModListType === 'classic' ? classicRankings : platformerRankings;
    const varName = currentModListType === 'classic' ? 'classicRankings' : 'platformerRankings';
    
    const code = `const ${varName} = [\n    "${rankings.join('",\n    "')}"\n];`;
    
    navigator.clipboard.writeText(code).then(() => {
        alert(`New ${varName} code copied to clipboard! Paste it into cdm_rankings.js`);
    }).catch(err => {
        console.error('Failed to copy', err);
        try {
            const textArea = document.createElement("textarea");
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert(`New ${varName} code copied to clipboard! Paste it into cdm_rankings.js`);
        } catch (e) {
            alert("Failed to copy. Check console for code.");
            console.log(code);
        }
    });
}

// Hook into global scope
window.initModPanel = initModPanel;
window.renderModSubmissions = renderModSubmissions;