// --- NAVIGATION LOGIC ---
const getEl = (id) => document.getElementById(id);

window.hideAllSections = function() {
    const sections = [
        'homeSection', 
        'mainListSection', 
        'leaderboardSection', 
        'profileSection', 
        'settingsSection', 
        'clanSection', 
        'submitRecordSection', 
        'modPanelSection', 
        'rouletteSection',
        'packsSection' 
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

window.showHome = function() {
    hideAllSections();
    const el = document.getElementById('homeSection');
    if (el) {
        el.classList.remove('hidden');
    } else {
        console.warn("showHome: 'homeSection' not found in DOM.");
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    if (typeof renderChangelog === 'function') {
        renderChangelog();
    }
}

window.showList = function() {
    hideAllSections();
    const el = document.getElementById('mainListSection');
    if (el) el.classList.remove('hidden');
    
    if (typeof switchListTab === 'function' && typeof currentListType !== 'undefined') {
        switchListTab(currentListType);
    }
}

window.showLeaderboard = function() {
    hideAllSections();
    const el = document.getElementById('leaderboardSection');
    if (el) el.classList.remove('hidden');
    
    if (typeof switchLeaderboardTab === 'function' && typeof currentListType !== 'undefined') {
        switchLeaderboardTab(currentListType);
    }
}

window.showPacks = function() {
    hideAllSections();
    const el = document.getElementById('packsSection');
    if (el) {
        el.classList.remove('hidden');
        // Render packs every time we show to ensure updated status if user logged in/out
        if (typeof renderPacks === 'function') renderPacks();
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.showClanPage = function() {
    hideAllSections();
    const el = document.getElementById('clanSection');
    if (el) el.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.showSubmitPage = function() {
    hideAllSections();
    const el = document.getElementById('submitRecordSection');
    if (el) el.classList.remove('hidden');

    if (typeof initSubmitPage === 'function') initSubmitPage();
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.showModPanel = function() {
    hideAllSections();
    const el = document.getElementById('modPanelSection');
    if (el) el.classList.remove('hidden');
    
    if (typeof renderModSubmissions === 'function') renderModSubmissions(); 
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

//--- INITIALIZATION ---
function initUI() {
    console.log("Initializing UI...");
    
    //Navigation Listeners
    getEl('navLogo')?.addEventListener('click', showHome);
    getEl('navMainList')?.addEventListener('click', showList);
    getEl('heroViewListBtn')?.addEventListener('click', showList);
    getEl('navLeaderboard')?.addEventListener('click', showLeaderboard);
    getEl('navPacks')?.addEventListener('click', showPacks); 
    
    //Website Updates Modal Listeners
    const webUpdatesBtn = getEl('navWebUpdates');
    const webUpdatesModal = getEl('webUpdatesModal');
    const closeWebUpdatesBtn = getEl('closeWebUpdatesBtn');
    const otherDropdown = getEl('otherDropdown');

    if (webUpdatesBtn && webUpdatesModal) {
        webUpdatesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            webUpdatesModal.classList.remove('hidden');
            webUpdatesModal.classList.add('flex');
            if (otherDropdown) otherDropdown.classList.add('hidden');
            if (typeof renderWebChangelog === 'function') renderWebChangelog();
        });
    }

    if (closeWebUpdatesBtn && webUpdatesModal) {
        closeWebUpdatesBtn.addEventListener('click', () => {
            webUpdatesModal.classList.add('hidden');
            webUpdatesModal.classList.remove('flex');
        });
        webUpdatesModal.addEventListener('click', (e) => {
            if (e.target === webUpdatesModal) {
                webUpdatesModal.classList.add('hidden');
                webUpdatesModal.classList.remove('flex');
            }
        });
    }
    
    //Module Initialization
    setTimeout(() => {
        if (typeof renderChangelog === 'function') renderChangelog();
        if (typeof renderSubmittedRecords === 'function') renderSubmittedRecords(); 
        if (typeof renderFilterOptions === 'function') renderFilterOptions(); 
        if (typeof renderStaff === 'function') renderStaff(); 
        if (typeof initResizers === 'function') initResizers();
        
        // Mod Panel Init
        if (typeof initModPanel === 'function') initModPanel();
        
        // Submit Page Init (Pre-load listener)
        if (typeof initSubmitPage === 'function') initSubmitPage();

        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Default Tab
        if (typeof switchListTab === 'function') {
            switchListTab('classic');
        }

        // Default View
        if (typeof showHome === 'function') showHome();
    }, 50); 
}

initUI();

//--- RESIZERS LOGIC ---
const resizerLeft = document.getElementById('resizerLeft');
const resizerRight = document.getElementById('resizerRight');

function initResizers() {
    let isResizing = false;
    let currentResizer = null;
    
    if(resizerLeft) resizerLeft.addEventListener('mousedown', (e) => { 
        isResizing = true; 
        currentResizer = 'left'; 
        document.body.classList.add('resizing'); 
    });
    
    if(resizerRight) resizerRight.addEventListener('mousedown', (e) => { 
        isResizing = true; 
        currentResizer = 'right'; 
        document.body.classList.add('resizing'); 
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const levelSidebarContainer = document.getElementById('levelSidebarContainer');
        const levelRecordsContainer = document.getElementById('levelRecordsContainer');
        
        if (currentResizer === 'left' && levelSidebarContainer) {
            const newWidth = e.clientX;
            if (newWidth >= 300 && newWidth <= 600) levelSidebarContainer.style.width = `${newWidth}px`;
        } else if (currentResizer === 'right' && levelRecordsContainer) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 600) levelRecordsContainer.style.width = `${newWidth}px`;
        }
    });
    
    document.addEventListener('mouseup', () => { 
        isResizing = false; 
        currentResizer = null; 
        document.body.classList.remove('resizing'); 
    });
}