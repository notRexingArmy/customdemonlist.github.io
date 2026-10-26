let submitMode = 'new'; // 'new' or 'resubmit'
let submitListType = 'classic'; // 'classic' or 'platformer'
let mySubmissions = []; // Store session submissions

function initSubmitPage() {
    // Listeners for Mode Toggle
    const toggleLink = document.getElementById('submitModeToggle');
    if (toggleLink) {
        toggleLink.replaceWith(toggleLink.cloneNode(true));
        const newToggle = document.getElementById('submitModeToggle');
        
        newToggle.addEventListener('click', () => {
            const newMode = submitMode === 'new' ? 'resubmit' : 'new';
            setSubmitMode(newMode);
        });
    }
    
    // Listeners for Type
    const typeRadios = document.getElementsByName('submitType');
    typeRadios.forEach(r => r.addEventListener('change', (e) => {
        submitListType = e.target.value.toLowerCase();
        document.getElementById('submitLevelName').value = '';
        updateLevelDropdown();
    }));

    const searchInput = document.getElementById('submitLevelName');
    searchInput?.addEventListener('input', () => updateLevelDropdown());
    searchInput?.addEventListener('focus', () => updateLevelDropdown());
    
    const commentInput = document.getElementById('submitComments');
    const charCount = document.getElementById('commentCharCount');
    const charWarning = document.getElementById('commentWarning');

    if (commentInput && charCount) {
        commentInput.addEventListener('input', () => {
            if (commentInput.value.length > 500) {
                commentInput.value = commentInput.value.substring(0, 500);
            }

            const len = commentInput.value.length;
            charCount.textContent = `${len}/500`;
            
            if (len >= 500) {
                charCount.classList.add('text-red-500');
                charCount.classList.remove('text-gray-500');
                if(charWarning) {
                    charWarning.textContent = "Character limit reached.";
                    charWarning.classList.remove('hidden');
                }
            } else {
                charCount.classList.remove('text-red-500');
                charCount.classList.add('text-gray-500');
                if(charWarning) charWarning.classList.add('hidden');
            }
        });
    }
    
    //Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('submitLevelDropdown');
        const input = document.getElementById('submitLevelName');
        if (dropdown && !dropdown.contains(e.target) && !input.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    //Form Submit
    const form = document.getElementById('submitRecordForm');
    form?.removeEventListener('submit', handleRecordSubmit);
    form?.addEventListener('submit', handleRecordSubmit);
    
    //Initial Setup
    setSubmitMode('new');
    renderMySubmissions();
}

function setSubmitMode(mode) {
    submitMode = mode;
    const toggleLink = document.getElementById('submitModeToggle');
    const header = document.getElementById('submitHeader');
    
    if (toggleLink) {
        if (mode === 'new') {
            toggleLink.innerHTML = "Submitted a record already? <span class='text-accent-blue font-bold'>Click to resubmit</span>";
            if(header) header.textContent = "Submit a Record";
        } else {
            toggleLink.innerHTML = "Want to send a new record? <span class='text-accent-blue font-bold'>Click here</span>";
            if(header) header.textContent = "Resubmit Record";
        }
    }
    
    document.getElementById('submitLevelName').value = '';
    updateLevelDropdown();
}

function updateLevelDropdown() {
    const input = document.getElementById('submitLevelName');
    const dropdown = document.getElementById('submitLevelDropdown');
    if (!input || !dropdown) return;

    const searchTerm = input.value.toLowerCase();
    
    if (typeof classicData === 'undefined' || typeof platformerData === 'undefined') return;
    
    const data = submitListType === 'classic' ? classicData : platformerData;
    
    const filtered = data.filter(level => {
        if (!level.name.toLowerCase().includes(searchTerm)) return false;
        
        if (!currentUser) return true; 
        
        const hasBeaten = level.victors && level.victors.some(v => v.name === currentUser.username);
        const isVerifier = level.verifier === currentUser.username;
        const alreadyCompleted = hasBeaten || isVerifier;

        if (submitMode === 'new') {
            return !alreadyCompleted;
        } else {
            return alreadyCompleted; 
        }
    });

    dropdown.innerHTML = '';
    
    if (document.activeElement === input) {
        dropdown.classList.remove('hidden');
        
        if (filtered.length > 0) {
            filtered.slice(0, 50).forEach(level => { 
                const rank = data.indexOf(level) + 1;
                
                let rankClass = 'text-gray-500';
                if (rank === 1) rankClass = 'text-accent-gold';
                else if (rank === 2) rankClass = 'text-gray-300';
                else if (rank === 3) rankClass = 'text-[#CD7F32]';
                else if (rank <= 10) rankClass = 'text-accent-red';

                const div = document.createElement('div');
                div.className = "flex items-center gap-3 p-3 hover:bg-dark-700 cursor-pointer text-sm text-white border-b border-dark-700 last:border-0";
                
                div.innerHTML = `
                    <span class="font-bold font-mono w-8 text-right ${rankClass}">#${rank}</span>
                    <span class="font-medium">${level.name}</span>
                `;
                
                div.onclick = () => {
                    input.value = level.name;
                    dropdown.classList.add('hidden');
                };
                dropdown.appendChild(div);
            });
        } else {
            const div = document.createElement('div');
            div.className = "p-4 text-center text-sm text-gray-500 italic";
            div.textContent = "No levels found matching criteria.";
            dropdown.appendChild(div);
        }
    } else {
        dropdown.classList.add('hidden');
    }
}

function showValidationPopup(message) {
    let popup = document.getElementById('validationPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'validationPopup';
        popup.className = "fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-200";
        
        popup.innerHTML = `
            <div class="bg-dark-800 border border-red-500/30 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform scale-95 transition-all duration-200">
                <div class="flex flex-col items-center text-center gap-3">
                    <div class="p-3 rounded-full bg-red-500/10 mb-1">
                        <i data-lucide="alert-triangle" class="w-8 h-8 text-red-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Oops!</h3>
                    <p id="validationPopupMsg" class="text-gray-400 mb-4 text-sm leading-relaxed"></p>
                    <button onclick="document.getElementById('validationPopup').classList.add('opacity-0', 'pointer-events-none'); document.querySelector('#validationPopup > div').classList.add('scale-95')" 
                        class="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    document.getElementById('validationPopupMsg').textContent = message;
    
    popup.classList.remove('opacity-0', 'pointer-events-none');
    popup.querySelector('div').classList.remove('scale-95');
}

function handleRecordSubmit(e) {
    e.preventDefault(); 
    
    const levelName = document.getElementById('submitLevelName').value;
    const video = document.getElementById('submitVideoLink').value;
    const comments = document.getElementById('submitComments').value;
    const raw = document.getElementById('submitRawLink').value;
    
    if (!levelName || !video) {
        showValidationPopup("Please fill in all required fields.");
        return;
    }

    //--- SUBMISSION CHECK ---
    let rank = 0;
    if (typeof classicData !== 'undefined' && typeof platformerData !== 'undefined') {
        const data = submitListType === 'classic' ? classicData : platformerData;
        const normalize = str => str.trim().toLowerCase();
        
        const levelObj = data.find(level => normalize(level.name) === normalize(levelName));
        
        if (!levelObj) {
            showValidationPopup("This level is not on the list. You can only submit records for valid levels.");
            return;
        }
        rank = data.indexOf(levelObj) + 1;
    } else {
        console.warn("List data not loaded, skipping validation.");
    }
    
    //Determine Type string (New Submission vs Resubmission) based on current mode
    let typeLabel = "New Submission";
    if (currentUser) {
        const data = submitListType === 'classic' ? classicData : platformerData;
        const levelObj = data.find(l => l.name.toLowerCase() === levelName.toLowerCase());
        if (levelObj) {
             const hasBeaten = levelObj.victors && levelObj.victors.some(v => v.name === currentUser.username);
             const isVerifier = levelObj.verifier === currentUser.username;
             if (hasBeaten || isVerifier) typeLabel = "Resubmission";
        }
    }

    const currentQueueCount = mySubmissions.filter(s => s.listType === submitListType).length;
    
    const newSubmission = {
        id: `sub-${Date.now()}`,
        level: levelName,
        rank: rank,
        user: currentUser ? currentUser.username : "Guest",
        link: video,
        raw: raw,
        comments: comments,
        status: 'pending',
        timestamp: new Date().toISOString(),
        listType: submitListType, 
        queuePosition: currentQueueCount + 1,
        type: typeLabel
    };

    mySubmissions.unshift(newSubmission);
    renderMySubmissions();

    const event = new CustomEvent('newSubmissionAdded', { detail: newSubmission });
    window.dispatchEvent(event);

    const toast = document.getElementById('toastNotification');
    const msg = document.getElementById('toastMessage');
    
    if (toast && msg) {
        msg.textContent = "Record Submitted Successfully!";
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
    
    e.target.reset();
    document.getElementById('commentCharCount').textContent = "0/500";
}

//--- RENDER RECENT SUBMISSIONS (UPDATED) ---
function renderMySubmissions() {
    const list = document.getElementById('submittedRecordsList');
    if (!list) return;

    if (mySubmissions.length === 0) {
        list.innerHTML = `<div class="text-center py-8 text-gray-600 italic text-sm">No recent submissions in this session.</div>`;
        return;
    }

    list.innerHTML = mySubmissions.map((sub, index) => {
        //Styling for rank (No Box)
        let rankClass = 'text-gray-500';
        if (sub.rank === 1) rankClass = 'text-accent-gold';
        else if (sub.rank === 2) rankClass = 'text-gray-300';
        else if (sub.rank === 3) rankClass = 'text-[#CD7F32]';
        else if (sub.rank <= 10) rankClass = 'text-accent-red';

        let queueName = sub.listType ? (sub.listType.charAt(0).toUpperCase() + sub.listType.slice(1)) : 'Unknown';

        return `
        <div onclick="openSubmissionDetailModal(mySubmissions[${index}])" 
             class="group flex items-center justify-between p-4 bg-dark-800 border border-dark-600 rounded-lg hover:bg-dark-700 hover:border-dark-500 transition-all cursor-pointer shadow-sm hover:shadow-md mb-2 last:mb-0">
            <div class="flex items-center gap-4 overflow-hidden">
                <!-- RANK DISPLAY: Seamless text -->
                <div class="w-12 text-center font-black text-xl ${rankClass}">
                    #${sub.rank}
                </div>
                
                <div class="flex flex-col min-w-0">
                    <span class="font-bold text-white text-sm truncate group-hover:text-accent-blue transition-colors">${sub.level}</span>
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span class="px-1.5 py-0.5 rounded bg-dark-900 border border-dark-700 text-gray-400 font-mono uppercase text-[10px] tracking-wider">
                            ${queueName}
                        </span>
                        <!-- REMOVED: Status dot and text from left side -->
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <!-- Right side: Status Badge Only -->
                <div class="text-right">
                     <span class="block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide text-center min-w-[80px]
                        ${sub.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                          sub.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}">
                        ${sub.status}
                    </span>
                    <!-- REMOVED: Type text from under badge -->
                </div>
                <div class="w-8 h-8 rounded-full bg-dark-900 flex items-center justify-center text-gray-500 group-hover:bg-dark-600 group-hover:text-white transition-colors">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </div>
            </div>
        </div>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openSubmissionDetailModal(sub) {
    let modal = document.getElementById('submissionDetailModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'submissionDetailModal';
        modal.className = "fixed inset-0 flex items-center justify-center z-[110] bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-200";
        modal.innerHTML = `
            <div class="bg-dark-800 border border-dark-600 w-full max-w-md rounded-xl shadow-2xl transform scale-95 transition-all duration-200 flex flex-col max-h-[90vh] m-4">
                <div class="p-5 border-b border-dark-700 flex justify-between items-center bg-dark-900/50 rounded-t-xl">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="file-text" class="w-5 h-5 text-accent-blue"></i>
                        Submission Details
                    </h3>
                    <button id="closeSubDetail" class="text-gray-400 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto space-y-4">
                    <div id="subDetailStatusContainer" class="p-3 rounded-lg border flex items-center justify-between">
                        <span class="text-sm font-bold uppercase tracking-wider">Status</span>
                        <span id="subDetailStatus" class="font-bold text-sm uppercase"></span>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Level Name</label>
                        <div id="subDetailLevel" class="text-xl font-black text-white"></div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span id="subDetailQueue" class="px-1.5 py-0.5 bg-dark-900 border border-dark-700 rounded text-[10px] text-gray-400 font-mono uppercase tracking-wider"></span>
                            <span id="subDetailDate" class="text-xs text-gray-500 font-mono"></span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Video Proof</label>
                            <a id="subDetailVideo" href="#" target="_blank" class="flex items-center gap-2 p-3 bg-dark-900 rounded border border-dark-700 text-accent-blue hover:text-white hover:border-accent-blue transition-colors truncate">
                                <i data-lucide="youtube" class="w-4 h-4 shrink-0"></i>
                                <span class="truncate text-sm underline decoration-dashed underline-offset-4"></span>
                            </a>
                        </div>
                        <div id="subDetailRawContainer">
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Raw Footage</label>
                            <a id="subDetailRaw" href="#" target="_blank" class="flex items-center gap-2 p-3 bg-dark-900 rounded border border-dark-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors truncate">
                                <i data-lucide="file-video" class="w-4 h-4 shrink-0"></i>
                                <span class="truncate text-sm underline decoration-dashed underline-offset-4"></span>
                            </a>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Comments</label>
                        <div id="subDetailComments" class="p-3 bg-dark-900/50 border border-dark-700 rounded text-sm text-gray-300 whitespace-pre-wrap break-words max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600"></div>
                    </div>
                </div>
                
                <div class="p-4 border-t border-dark-700 bg-dark-900/30 rounded-b-xl flex justify-end">
                    <button onclick="document.getElementById('closeSubDetail').click()" class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white text-sm font-bold rounded transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = document.getElementById('closeSubDetail');
        closeBtn.onclick = () => {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.querySelector('div').classList.add('scale-95');
        };
        modal.onclick = (e) => {
            if(e.target === modal) closeBtn.click();
        }
    }

    const statusContainer = document.getElementById('subDetailStatusContainer');
    const statusText = document.getElementById('subDetailStatus');
    
    const displayStatus = `${sub.status} (${sub.type || 'New'})`;
    
    if (sub.status === 'pending') {
        statusContainer.className = "p-3 rounded-lg border flex items-center justify-between bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
    } else if (sub.status === 'accepted') {
        statusContainer.className = "p-3 rounded-lg border flex items-center justify-between bg-green-500/10 border-green-500/30 text-green-400";
    } else {
        statusContainer.className = "p-3 rounded-lg border flex items-center justify-between bg-red-500/10 border-red-500/30 text-red-400";
    }
    statusText.textContent = displayStatus;

    document.getElementById('subDetailLevel').textContent = sub.level;
    
    const dateObj = new Date(sub.timestamp);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    document.getElementById('subDetailDate').textContent = `${day}/${month}/${year}`;
    
    const queueEl = document.getElementById('subDetailQueue');
    if (queueEl) {
        queueEl.textContent = sub.listType ? sub.listType.toUpperCase() : "UNKNOWN";
    }
    
    const vidLink = document.getElementById('subDetailVideo');
    vidLink.href = sub.link;
    vidLink.querySelector('span').textContent = sub.link;

    const rawContainer = document.getElementById('subDetailRawContainer');
    const rawLink = document.getElementById('subDetailRaw');
    
    if (sub.raw) {
        rawContainer.classList.remove('hidden');
        rawLink.href = sub.raw;
        rawLink.querySelector('span').textContent = sub.raw;
    } else {
        rawContainer.classList.add('hidden');
    }

    const commentsEl = document.getElementById('subDetailComments');
    if (sub.comments) {
        commentsEl.textContent = sub.comments;
        commentsEl.classList.remove('text-gray-500', 'italic');
    } else {
        commentsEl.textContent = "No comments provided.";
        commentsEl.classList.add('text-gray-500', 'italic');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('div').classList.remove('scale-95');
}

window.initSubmitPage = initSubmitPage;
window.renderMySubmissions = renderMySubmissions;
window.openSubmissionDetailModal = openSubmissionDetailModal;