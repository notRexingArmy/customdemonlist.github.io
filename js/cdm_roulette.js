window.showRoulette = function() {
    if (typeof hideAllSections === 'function') hideAllSections();
    const rouletteSection = document.getElementById('rouletteSection');
    if (rouletteSection) rouletteSection.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    if (typeof drawRouletteWheel === 'function') drawRouletteWheel();
};

function initRoulette() {
    const navRoulette = document.getElementById('navRoulette');
    if (navRoulette) {
        navRoulette.addEventListener('click', () => {
            showRoulette();
            const dropdown = document.getElementById('otherDropdown');
            if (dropdown) dropdown.classList.add('hidden');
        });
    }
    initRouletteGame();
}

let drawRouletteWheel; 

function initRouletteGame() {
    let configSkips = 0;
    let rouletteStreak = 0;
    let rouletteGoal = 1;
    let currentSkips = 0;
    let isSpinning = false;
    let currentRouletteLevel = null;
    let playedLevels = new Set(); 
    let currentWheelLevels = []; 
    let sessionHistory = []; 
    const rouletteMode = 'classic';
    
    let currentSeed = null;
    let rng = null;
    let levelQueue = [];
    
    const btnSpin = document.getElementById('btnSpin');
    const rouletteCenterBtn = document.getElementById('rouletteCenterBtn');
    const progressContainer = document.getElementById('progressContainer');
    const btnSubmitPercent = document.getElementById('btnSubmitPercent');
    const btnSkipLevel = document.getElementById('btnSkipLevel'); 
    const roulettePercentInput = document.getElementById('roulettePercentInput');
    const inputError = document.getElementById('rouletteInputError'); 
    const btnFail = document.getElementById('btnFail');
    const winMessage = document.getElementById('winMessage');
    const btnRestartWin = document.getElementById('btnRestartWin');
    const rouletteHistory = document.getElementById('rouletteHistory');
    const rouletteHistoryList = document.getElementById('rouletteHistoryList');
    const rouletteResult = document.getElementById('rouletteResult');
    const rouletteLevelName = document.getElementById('rouletteLevelName');
    const rouletteCreator = document.getElementById('rouletteCreator');
    const rouletteRank = document.getElementById('rouletteRank');
    const rouletteId = document.getElementById('rouletteId');
    const rouletteGoalEl = document.getElementById('rouletteGoal');
    const rouletteStreakEl = document.getElementById('rouletteStreak');
    const rouletteSkipsDisplay = document.getElementById('rouletteSkipsDisplay');
    const rouletteSkipsContainer = document.getElementById('rouletteSkipsContainer');

    const confirmModal = document.getElementById('confirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmGiveUpBtn = document.getElementById('confirmGiveUpBtn');
    const skipConfirmModal = document.getElementById('skipConfirmModal');
    const cancelSkipBtn = document.getElementById('cancelSkipBtn');
    const confirmSkipBtn = document.getElementById('confirmSkipBtn');
    const skipConfirmText = document.getElementById('skipConfirmText');
    const importRunModal = document.getElementById('importRunModal');
    const importRunInput = document.getElementById('importRunInput');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const closeImportModal = document.getElementById('closeImportModal');

    const rouletteOptionsBtn = document.getElementById('rouletteOptionsBtn');
    const rouletteSettingsModal = document.getElementById('rouletteSettingsModal');
    const closeRouletteSettings = document.getElementById('closeRouletteSettings');
    const saveRouletteSettings = document.getElementById('saveRouletteSettings');
    const settingsSkipsRange = document.getElementById('settingsSkipsRange');
    const settingsSkipsVal = document.getElementById('settingsSkipsVal');
    const btnExportRun = document.getElementById('btnExportRun');
    const btnImportRun = document.getElementById('btnImportRun');

    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    if (rouletteOptionsBtn) {
        rouletteOptionsBtn.addEventListener('click', () => {
            if (rouletteSettingsModal) {
                if(settingsSkipsRange) settingsSkipsRange.value = configSkips;
                if(settingsSkipsVal) settingsSkipsVal.textContent = configSkips;
                
                const gameActive = currentSeed !== null;
                
                if (gameActive) {
                    if(settingsSkipsRange) settingsSkipsRange.disabled = true;
                } else {
                    if(settingsSkipsRange) settingsSkipsRange.disabled = false;
                }

                if (btnExportRun) {
                    if (currentSeed === null) {
                        btnExportRun.disabled = true;
                        btnExportRun.classList.add('opacity-50', 'cursor-not-allowed');
                        btnExportRun.title = "Start a roulette run first";
                    } else {
                        btnExportRun.disabled = false;
                        btnExportRun.classList.remove('opacity-50', 'cursor-not-allowed');
                        btnExportRun.title = "";
                    }
                }

                rouletteSettingsModal.classList.remove('hidden');
                rouletteSettingsModal.classList.add('flex');
            }
        });
    }

    if (settingsSkipsRange) {
        settingsSkipsRange.addEventListener('input', (e) => {
            if (currentSeed !== null) {
                e.target.value = configSkips; 
                return;
            }

            const val = parseInt(e.target.value);
            if(settingsSkipsVal) settingsSkipsVal.textContent = val;
            
            if (!settingsSkipsRange.disabled) {
                configSkips = val;
                if (rouletteStreak === 0) {
                    currentSkips = val;
                    updateRouletteStats();
                }
            }
        });
    }

    function closeSettings() {
        if(rouletteSettingsModal) {
            rouletteSettingsModal.classList.add('hidden');
            rouletteSettingsModal.classList.remove('flex');
        }
    }

    if (closeRouletteSettings) closeRouletteSettings.addEventListener('click', closeSettings);
    if (saveRouletteSettings) saveRouletteSettings.addEventListener('click', closeSettings);

    function generateLevelQueue(seed) {
        if (typeof SeededRandom === 'undefined') {
            console.error("SeededRandom missing");
            return [];
        }
        
        const queueRng = new SeededRandom(seed);
        let data = typeof classicData !== 'undefined' ? [...classicData] : [];
        
        if (data.length === 0) return [];
        
        let winnerPool = [...data];
        
        // Fisher-Yates shuffle for winners
        for (let i = winnerPool.length - 1; i > 0; i--) {
            const j = Math.floor(queueRng.nextFloat() * (i + 1));
            [winnerPool[i], winnerPool[j]] = [winnerPool[j], winnerPool[i]];
        }
        
        let winners = [...winnerPool];
        while (winners.length < 100) {
            winners = winners.concat(winnerPool);
        }
        
        // Track "simulated played" to ensure decoys are valid unplayed levels
        let simPlayed = new Set();

        let fullQueue = winners.map(winner => {
            let options = [];
            let losers = [];
            
            // Available pool for decoys: Full Data minus (Already Played + Current Winner)
            // This ensures "My first level was on the second level wheel" doesn't happen
            let availableForDecoy = data.filter(d => !simPlayed.has(d.name) && d.name !== winner.name);
            
            // If we run out of unplayed decoys, fallback to any non-winner
            if (availableForDecoy.length < 3) {
                 availableForDecoy = data.filter(d => d.name !== winner.name);
            }

            while (losers.length < 3) {
                 // Deterministic pick
                 const r = Math.floor(queueRng.nextFloat() * availableForDecoy.length);
                 const candidate = availableForDecoy[r];
                 
                 // Ensure distinct within losers
                 if (!losers.some(l => l.name === candidate.name)) {
                     losers.push(candidate);
                 }
            }
            
            const winningIndex = Math.floor(queueRng.nextFloat() * 4);
            
            options = [...losers];
            options.splice(winningIndex, 0, winner); 
            
            // Randomize Wheel Speed (Spin Params)
            const spinAngleStart = queueRng.nextFloat() * 20 + 10; // Range 10-30
            const spinTimeTotal = queueRng.nextFloat() * 4000 + 4000; // Range 4000-8000ms
            
            // Mark winner as played for next iteration's decoy logic
            simPlayed.add(winner.name);

            return {
                winner: winner,
                options: options,
                winningIndex: winningIndex, 
                spinAngleStart: spinAngleStart,
                spinTimeTotal: spinTimeTotal
            };
        });
        
        return fullQueue;
    }

    if (btnExportRun) {
        btnExportRun.addEventListener('click', () => {
            if (currentSeed === null) return; 

            const state = {
                seed: currentSeed,
                streak: rouletteStreak,
                goal: rouletteGoal,
                skips: currentSkips,
                configSkips: configSkips,
                history: sessionHistory,
            };
            const json = JSON.stringify(state);
            const b64 = btoa(json);
            
            navigator.clipboard.writeText(b64).then(() => {
                showRouletteToast("Run code copied to clipboard!");
            }).catch(() => {
                prompt("Copy this code:", b64);
            });
        });
    }

    if (btnImportRun) {
        btnImportRun.addEventListener('click', () => {
            if (importRunModal) {
                if(importRunInput) importRunInput.value = '';
                importRunModal.classList.remove('hidden');
                importRunModal.classList.add('flex');
                closeSettings(); 
            }
        });
    }

    function closeImport() {
        if(importRunModal) {
            importRunModal.classList.add('hidden');
            importRunModal.classList.remove('flex');
        }
    }

    if (closeImportModal) closeImportModal.addEventListener('click', closeImport);
    if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImport);

    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', () => {
            const code = importRunInput ? importRunInput.value.trim() : '';
            if (!code) {
                showRouletteError("Please enter a valid run code.");
                return;
            }
            
            try {
                const json = atob(code);
                const state = JSON.parse(json);
                
                if (!state.seed || typeof state.streak === 'undefined') {
                    throw new Error("Missing required fields");
                }

                currentSeed = state.seed;
                
                levelQueue = generateLevelQueue(currentSeed);
                
                rouletteStreak = state.streak;
                rouletteGoal = state.goal;
                currentSkips = state.skips;
                configSkips = state.configSkips;
                
                sessionHistory = state.history || [];
                
                rng = new SeededRandom(currentSeed);
                
                if(rouletteHistoryList) {
                    rouletteHistoryList.innerHTML = '';
                    [...sessionHistory].reverse().forEach((item, idx) => {
                         const rank = item.level._rank || '-';
                         const percentText = item.skipped ? `<span class="text-blue-400 font-bold">SKIP (${item.percent}%)</span>` : `${item.percent}%`;
                         const percentClass = item.skipped ? "" : "text-accent-green"; 
                         
                         const div = document.createElement('div');
                         div.className = "grid grid-cols-12 items-center bg-dark-900/50 p-2 rounded border border-dark-600 text-sm animate-fade-in";
                         div.innerHTML = `
                            <div class="col-span-1 font-bold text-gray-500 text-xs text-center">${sessionHistory.length - idx}</div>
                            <div class="col-span-7 font-bold text-white truncate px-2 text-center">${item.level.name}</div>
                            <div class="col-span-2 text-center font-mono text-accent-gold text-xs">#${rank}</div>
                            <div class="col-span-2 text-center font-bold ${percentClass}">${percentText}</div>
                        `;
                        rouletteHistoryList.appendChild(div);
                    });
                    if (sessionHistory.length > 0) rouletteHistory.classList.remove('hidden');
                }

                updateRouletteStats();
                resetToStartScreen(); 
                closeImport();
                showRouletteToast("Run loaded successfully!");

            } catch (e) {
                console.error(e);
                showRouletteError("Invalid Run Code or Version mismatch");
            }
        });
    }

    const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6']; 
    let startAngle = 0;
    let arc = 0; 
    let spinTimeout = null;
    let spinAngleStart = 10;
    let spinTime = 0;
    let spinTimeTotal = 0;

    function drawAdaptiveText(ctx, text, maxWidth, initialFontSize) {
        let fontSize = initialFontSize;
        ctx.font = `bold ${fontSize}px Inter`;
        while (ctx.measureText(text).width > maxWidth && fontSize > 14) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px Inter`;
        }
        ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    }

    drawRouletteWheel = function() {
        if (!canvas || !ctx) return;
        const options = currentWheelLevels.length > 0 ? currentWheelLevels : ["?", "?", "?", "?"];
        const numOptions = 4; 
        arc = Math.PI * 2 / numOptions;
        ctx.clearRect(0,0, canvas.width, canvas.height);
        const outsideRadius = 380; 
        const textRadius = 260;
        const insideRadius = 80;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for(let i = 0; i < numOptions; i++) {
            const angle = startAngle + i * arc;
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
            ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);
            ctx.stroke();
            ctx.fill();
            ctx.save();
            ctx.shadowOffsetX = -1;
            ctx.shadowOffsetY = -1;
            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.fillStyle = "white"; 
            ctx.translate(centerX + Math.cos(angle + arc / 2) * textRadius, centerY + Math.sin(angle + arc / 2) * textRadius);
            ctx.rotate(angle + arc / 2 + Math.PI / 2); 
            const rawText = options[i].name || options[i];
            drawAdaptiveText(ctx, rawText, 250, 48); 
            ctx.restore();
        }
    }

    function rotateWheel() {
        spinTime += 30;
        if(spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        drawRouletteWheel();
        spinTimeout = setTimeout(rotateWheel, 30);
    }

    function stopRotateWheel() {
        clearTimeout(spinTimeout);
        isSpinning = false;
        
        const degrees = startAngle * 180 / Math.PI + 90; 
        const arcd = arc * 180 / Math.PI;
        const index = Math.floor((360 - degrees % 360) / arcd);
        
        let winningIndex = index % 4;
        if (winningIndex < 0) winningIndex += 4;
        
        const selectedLevel = currentWheelLevels[winningIndex];
        pickLevel(selectedLevel);
    }

    function easeOut(t, b, c, d) {
        const ts = (t/=d)*t;
        const tc = ts*t;
        return b+c*(tc + -3*ts + 3*t);
    }

    function updateRouletteStats() {
        if(rouletteGoalEl) rouletteGoalEl.textContent = `${rouletteGoal}%`;
        if(rouletteStreakEl) rouletteStreakEl.textContent = rouletteStreak;
        if(rouletteSkipsDisplay) rouletteSkipsDisplay.textContent = currentSkips;
        
        if (configSkips <= 0) {
            if(rouletteSkipsContainer) rouletteSkipsContainer.classList.add('hidden');
            if(btnSkipLevel) btnSkipLevel.classList.add('hidden');
        } else {
            if(rouletteSkipsContainer) rouletteSkipsContainer.classList.remove('hidden');
            if(btnSkipLevel) {
                btnSkipLevel.classList.remove('hidden');
                if (currentSkips > 0) {
                    btnSkipLevel.disabled = false;
                    btnSkipLevel.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    btnSkipLevel.disabled = true;
                    btnSkipLevel.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }
        }
    }

    function showRouletteToast(msg) {
        let toast = document.getElementById('rouletteToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'rouletteToast';
            toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-accent-blue/90 border border-blue-400 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<div class="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center"><i data-lucide="info" class="w-4 h-4 text-white"></i></div><span class="font-bold text-sm">${msg}</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        void toast.offsetWidth;
        
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
    }

    function showRouletteError(msg) {
        let toast = document.getElementById('rouletteErrorToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'rouletteErrorToast';
            toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-red-600/90 border border-red-400 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<div class="w-6 h-6 bg-red-800/20 rounded-full flex items-center justify-center"><i data-lucide="alert-triangle" class="w-4 h-4 text-white"></i></div><span class="font-bold text-sm">${msg}</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        void toast.offsetWidth;
        
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => { toast.classList.add('translate-y-20', 'opacity-0'); }, 3000);
    }

    function startSpinSequence() {
        if(isSpinning) return;
        
        if (currentSeed === null) {
            if (typeof SeededRandom === 'undefined') {
                alert("Critical: cdm_seed.js missing");
                return;
            }
            currentSeed = (Date.now() ^ Math.floor(Math.random() * 2147483647)) % 2147483647;
            
            levelQueue = generateLevelQueue(currentSeed);
            
            if(rouletteHistoryList) rouletteHistoryList.innerHTML = '';
            sessionHistory = [];
            
            if(btnExportRun) {
                btnExportRun.disabled = false;
                btnExportRun.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }

        if (!levelQueue || levelQueue.length === 0) {
            showError("No levels available.");
            return;
        }

        const roundData = levelQueue[rouletteStreak % levelQueue.length];
        if (!roundData) {
            showRouletteToast("Queue Error.");
        }

        currentWheelLevels = roundData.options;
        spinAngleStart = roundData.spinAngleStart;
        spinTimeTotal = roundData.spinTimeTotal;
        startAngle = 0; 
        spinTime = 0;
        
        isSpinning = true;
        btnSpin.classList.add('hidden');
        if (rouletteOptionsBtn) rouletteOptionsBtn.classList.add('pointer-events-none', 'opacity-50'); 
        if(settingsSkipsRange) settingsSkipsRange.disabled = true;
        if(progressContainer) { progressContainer.classList.add('hidden'); progressContainer.classList.remove('flex', 'flex-col'); }
        if(roulettePercentInput) roulettePercentInput.value = '';
        if(inputError) { inputError.classList.add('hidden'); inputError.textContent = ''; }
        if(rouletteResult) { rouletteResult.classList.add('hidden'); rouletteResult.classList.remove('flex'); }
        if(winMessage) winMessage.classList.add('hidden');

        drawRouletteWheel();
        rotateWheel();
    }

    if(btnSpin) btnSpin.addEventListener('click', startSpinSequence);

    if(rouletteCenterBtn) {
        rouletteCenterBtn.addEventListener('click', () => {
            if (!btnSpin.classList.contains('hidden')) { startSpinSequence(); } 
            else if (progressContainer && !progressContainer.classList.contains('hidden')) { if (btnSubmitPercent) btnSubmitPercent.click(); }
        });
    }

    function pickLevel(finalLevel) {
        let data = typeof classicData !== 'undefined' ? classicData : [];
        playedLevels.add(finalLevel.name);
        currentRouletteLevel = finalLevel;
        const rank = data.indexOf(finalLevel) + 1;
        currentRouletteLevel._rank = rank; 
        
        if(rouletteResult) { rouletteResult.classList.remove('hidden'); rouletteResult.classList.add('flex'); }
        if(rouletteLevelName) rouletteLevelName.textContent = finalLevel.name;
        if(rouletteCreator) { const pub = finalLevel.publisher || 'Unknown'; rouletteCreator.textContent = `by ${pub}`; }
        if(rouletteRank) rouletteRank.textContent = `#${rank}`;
        if(rouletteId) rouletteId.textContent = finalLevel.level_id || 'Unknown';
        
        if (rouletteOptionsBtn) rouletteOptionsBtn.classList.remove('pointer-events-none', 'opacity-50');

        if(progressContainer) { progressContainer.classList.remove('hidden'); progressContainer.classList.add('flex', 'flex-col'); }
        if(roulettePercentInput) {
            roulettePercentInput.focus();
            if (rouletteGoal >= 100) { roulettePercentInput.placeholder = `Beat the level! (Achieve 100%)`; } 
            else { roulettePercentInput.placeholder = `At least ${rouletteGoal}%`; }
        }
        updateRouletteStats();
    }

    function addToHistory(level, percent, skipped = false) {
        if (!rouletteHistory || !rouletteHistoryList) return;
        rouletteHistory.classList.remove('hidden');
        
        const rank = level._rank || '-';
        const percentText = skipped ? `<span class="text-blue-400 font-bold">SKIP (${percent}%)</span>` : `${percent}%`;
        const percentClass = skipped ? "" : "text-accent-green"; 
        
        const item = document.createElement('div');
        item.className = "grid grid-cols-12 items-center bg-dark-900/50 p-2 rounded border border-dark-600 text-sm animate-fade-in";
        item.innerHTML = `
            <div class="col-span-1 font-bold text-gray-500 text-xs text-center">${sessionHistory.length + 1}</div>
            <div class="col-span-7 font-bold text-white truncate px-2 text-center">${level.name}</div>
            <div class="col-span-2 text-center font-mono text-accent-gold text-xs">#${rank}</div>
            <div class="col-span-2 text-center font-bold ${percentClass}">${percentText}</div>
        `;
        rouletteHistoryList.appendChild(item);
        sessionHistory.push({ level, rank, percent, skipped });
    }

    if(rouletteLevelName) {
        rouletteLevelName.addEventListener('click', () => {
            if(currentRouletteLevel && typeof showList === 'function' && typeof switchListTab === 'function') {
                showList();
                let data = typeof classicData !== 'undefined' ? classicData : [];
                let type = 'classic';
                let idx = data.findIndex(l => l.name === currentRouletteLevel.name);
                if (idx !== -1) {
                    if (typeof currentListType !== 'undefined' && currentListType !== type) switchListTab(type);
                    if (typeof currentLevelIndex !== 'undefined') currentLevelIndex = idx;
                    if(typeof renderSidebarList === 'function') renderSidebarList(data);
                    if(typeof selectLevel === 'function') selectLevel(idx);
                    const sidebar = document.getElementById('levelSidebar');
                    if(sidebar && sidebar.children[idx]) sidebar.children[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    alert("This level might be in the other list category, or data is missing.");
                }
            }
        });
    }

    if(btnSubmitPercent && roulettePercentInput) {
        btnSubmitPercent.addEventListener('click', () => {
            if(inputError) inputError.classList.add('hidden');
            const val = parseInt(roulettePercentInput.value);
            if (isNaN(val)) { showError("Please enter a percentage."); return; }
            if (val < rouletteGoal) { showError(`You must reach at least ${rouletteGoal}% to continue!`); return; }
            if (val > 100) { showError("Percentage cannot be higher than 100%."); return; }

            if (currentRouletteLevel) addToHistory(currentRouletteLevel, val);
            const nextGoal = val + 1;
            rouletteStreak++;
            if (nextGoal > 100) {
                rouletteGoal = 100;
                updateRouletteStats();
                showWinScreen();
            } else {
                rouletteGoal = nextGoal;
                updateRouletteStats();
                startSpinSequence(); 
            }
        });
        roulettePercentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { btnSubmitPercent.click(); } });
    }

    if (btnSkipLevel) {
        btnSkipLevel.addEventListener('click', () => {
            if (currentSkips <= 0) return; 
            if(skipConfirmModal && skipConfirmText) {
                skipConfirmText.textContent = `Are you sure you want to skip this level? You have ${currentSkips} remaining.`;
                skipConfirmModal.classList.remove('hidden');
                skipConfirmModal.classList.add('flex');
            }
        });
    }

    if(confirmSkipBtn) {
        confirmSkipBtn.addEventListener('click', () => {
            if (currentSkips > 0) {
                currentSkips--;
                
                if (currentRouletteLevel) {
                    addToHistory(currentRouletteLevel, rouletteGoal, true);
                }
                
                const nextGoal = rouletteGoal + 1;
                
                if (nextGoal > 100) {
                    rouletteGoal = 100;
                    rouletteStreak++;
                    updateRouletteStats();
                    showWinScreen();
                } else {
                    rouletteGoal = nextGoal;
                    rouletteStreak++;
                    updateRouletteStats();
                    startSpinSequence(); 
                }
            }
            if(skipConfirmModal) { skipConfirmModal.classList.add('hidden'); skipConfirmModal.classList.remove('flex'); }
        });
    }

    if(cancelSkipBtn) {
        cancelSkipBtn.addEventListener('click', () => { if(skipConfirmModal) { skipConfirmModal.classList.add('hidden'); skipConfirmModal.classList.remove('flex'); } });
    }

    if(btnFail) {
        btnFail.addEventListener('click', () => {
            if(confirmModal) {
                confirmModal.classList.remove('hidden');
                confirmModal.classList.add('flex');
            }
        });
    }

    if(confirmGiveUpBtn) {
        confirmGiveUpBtn.addEventListener('click', () => {
            if(confirmModal) { confirmModal.classList.add('hidden'); confirmModal.classList.remove('flex'); }
            
            if(rouletteHistoryList) {
                const sep = document.createElement('div');
                sep.className = "flex items-center justify-center py-2 text-red-500 text-xs font-bold uppercase tracking-widest";
                sep.innerHTML = `<span>--- GAVE UP ---</span>`;
                rouletteHistoryList.appendChild(sep);

                let data = typeof classicData !== 'undefined' ? classicData : [];
                
                if (levelQueue.length > 0) {
                    const cycleLength = data.length; 
                    const currentIndex = rouletteStreak % cycleLength;
                    const remainingCount = cycleLength - currentIndex;
                    
                    let projectedGoal = rouletteGoal; 
                    
                    for(let i=0; i<remainingCount; i++) {
                        const nextIdx = (rouletteStreak + i) % levelQueue.length;
                        const winner = levelQueue[nextIdx].winner; 
                        
                        if(winner) {
                            const goal = projectedGoal + i; 
                            const goalText = goal > 100 ? "100%" : `${goal}%`;

                            const div = document.createElement('div');
                            div.className = "grid grid-cols-12 items-center bg-dark-800/30 p-2 rounded border border-dark-700/50 text-sm animate-fade-in opacity-75";
                            div.innerHTML = `
                                <div class="col-span-1 font-bold text-gray-600 text-xs text-center">-</div>
                                <div class="col-span-7 font-bold text-gray-400 truncate px-2 text-center italic">${winner.name}</div>
                                <div class="col-span-2 text-center font-mono text-gray-600 text-xs">#${data.indexOf(winner)+1}</div>
                                <div class="col-span-2 text-center font-bold text-gray-600 text-xs">${goalText}</div>
                            `;
                            rouletteHistoryList.appendChild(div);
                        }
                    }
                }
                
                rouletteHistory.classList.remove('hidden');
            }
            
            resetToStartScreen();
            if (rouletteOptionsBtn) rouletteOptionsBtn.classList.remove('pointer-events-none', 'opacity-50');
            if (settingsSkipsRange) settingsSkipsRange.disabled = false;
            
            playedLevels.clear();
            sessionHistory = [];
            currentSeed = null; 
            levelQueue = []; 
            
            rouletteGoal = 1;
            rouletteStreak = 0;
            currentSkips = configSkips;
            currentRouletteLevel = null;

            if(btnExportRun) {
                btnExportRun.disabled = true;
                btnExportRun.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            updateRouletteStats();
        });
    }

    if (btnRestartWin) {
        btnRestartWin.addEventListener('click', () => {
            fullReset();
        });
    }

    if(cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => {
            if(confirmModal) {
                confirmModal.classList.add('hidden');
                confirmModal.classList.remove('flex');
            }
        });
    }

    function fullReset() {
        currentSeed = null;
        rng = null;
        levelQueue = [];
        rouletteGoal = 1;
        rouletteStreak = 0;
        currentSkips = configSkips; 
        currentRouletteLevel = null;
        
        playedLevels.clear(); 
        sessionHistory = [];
        if(rouletteHistoryList) rouletteHistoryList.innerHTML = '';
        if(rouletteHistory) rouletteHistory.classList.add('hidden');
        
        updateRouletteStats();
        resetToStartScreen();
        if(winMessage) winMessage.classList.add('hidden');
        if(inputError) inputError.classList.add('hidden');
        
        if(btnExportRun) {
            btnExportRun.disabled = true;
            btnExportRun.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    function resetToStartScreen() {
        if(progressContainer) { progressContainer.classList.add('hidden'); progressContainer.classList.remove('flex', 'flex-col'); }
        if(btnSpin) btnSpin.classList.remove('hidden');
        if(rouletteResult) { rouletteResult.classList.add('hidden'); rouletteResult.classList.remove('flex'); }
        if (rouletteOptionsBtn) rouletteOptionsBtn.classList.remove('pointer-events-none', 'opacity-50');
        if (settingsSkipsRange) settingsSkipsRange.disabled = false;
        currentWheelLevels = []; 
        drawRouletteWheel(); 
    }
    
    drawRouletteWheel();
}

function showError(msg) {
    const inputError = document.getElementById('rouletteInputError');
    if(inputError) {
        inputError.textContent = msg;
        inputError.classList.remove('hidden');
    } else {
        alert(msg);
    }
}

initRoulette();