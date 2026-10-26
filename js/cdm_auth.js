function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    // Case-insensitive username check
    const foundUser = (typeof users !== 'undefined' ? users : []).find(user => 
        user.username.toLowerCase() === u.toLowerCase() && user.password === p
    );

    if (foundUser) {
        currentUser = JSON.parse(JSON.stringify(foundUser));
        const navLoginBtn = document.getElementById('navLoginBtn');
        const navUserBtn = document.getElementById('navUserBtn');
        const navUserName = document.getElementById('navUserName');
        const navUserAvatar = document.getElementById('navUserAvatar');
        const loginModal = document.getElementById('loginModal');
        const userDropdown = document.getElementById('userDropdown');

        if(navLoginBtn) navLoginBtn.classList.add('hidden');
        if(navUserBtn) {
            navUserBtn.classList.remove('hidden');
            navUserBtn.classList.add('flex'); 
        }
        if(navUserName) navUserName.textContent = currentUser.username;
        
        if (navUserAvatar) {
            if (currentUser.avatar) {
                navUserAvatar.src = currentUser.avatar;
                navUserAvatar.classList.remove('hidden');
            } else {
                navUserAvatar.classList.add('hidden');
            }
        }
        
        const dropdownModPanel = document.getElementById('dropdownModPanel');
        if (dropdownModPanel && typeof staffData !== 'undefined' && staffData.owners) {
            const isOwner = staffData.owners.some(owner => owner.name === currentUser.username);
            if (isOwner) {
                dropdownModPanel.classList.remove('hidden');
                dropdownModPanel.classList.add('block');
            } else {
                dropdownModPanel.classList.add('hidden');
                dropdownModPanel.classList.remove('block');
            }
        }

        if(loginModal) {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex'); 
        }
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
    } else {
        const errorModal = document.getElementById('errorModal');
        if (errorModal) {
            errorModal.classList.remove('hidden');
            errorModal.classList.add('flex');
        } else {
            alert("Invalid username or password."); 
        }
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('navLoginBtn')?.classList.remove('hidden');
    document.getElementById('navUserBtn')?.classList.add('hidden');
    document.getElementById('navUserBtn')?.classList.remove('flex');
    
    const dropdownModPanel = document.getElementById('dropdownModPanel');
    if(dropdownModPanel) {
        dropdownModPanel.classList.add('hidden');
        dropdownModPanel.classList.remove('block');
    }

    const profileSection = document.getElementById('profileSection');
    const settingsSection = document.getElementById('settingsSection');
    const clanSection = document.getElementById('clanSection');
    const submitRecordSection = document.getElementById('submitRecordSection');
    const modPanelSection = document.getElementById('modPanelSection');

    if ((profileSection && !profileSection.classList.contains('hidden')) || 
        (settingsSection && !settingsSection.classList.contains('hidden')) || 
        (clanSection && !clanSection.classList.contains('hidden')) || 
        (submitRecordSection && !submitRecordSection.classList.contains('hidden')) ||
        (modPanelSection && !modPanelSection.classList.contains('hidden'))) {
        showHome();
    }
}

function showSettingsPage() {
    if (!currentUser) return;
    hideAllSections();
    const settingsSection = document.getElementById('settingsSection');
    if(settingsSection) settingsSection.classList.remove('hidden');
    document.getElementById('settingsName').value = currentUser.username;
    document.getElementById('settingsBio').value = currentUser.bio || '';
    document.getElementById('settingsCountry').value = currentUser.country || 'US';
}

function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
    }
}

function initAuth() {
    const navLoginBtn = document.getElementById('navLoginBtn');
    const loginModal = document.getElementById('loginModal');
    const errorModal = document.getElementById('errorModal');
    const userDropdown = document.getElementById('userDropdown');
    const navUserBtn = document.getElementById('navUserBtn');

    if (navLoginBtn) navLoginBtn.addEventListener('click', () => { loginModal.classList.remove('hidden'); loginModal.classList.add('flex'); });
    document.getElementById('closeLoginBtn')?.addEventListener('click', closeLoginModal);
    
    // NEW: Close Login on Backdrop Click
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // NEW: Close Login on Escape Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal && !loginModal.classList.contains('hidden')) {
            closeLoginModal();
        }
    });

    function closeError() { errorModal.classList.add('hidden'); errorModal.classList.remove('flex'); }
    document.getElementById('closeErrorBtn')?.addEventListener('click', closeError);
    if(errorModal) errorModal.addEventListener('click', (e) => { if(e.target === errorModal) closeError(); });
    
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    navUserBtn?.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('hidden'); });
    
    document.addEventListener('click', (e) => { if (userDropdown && !userDropdown.classList.contains('hidden')) { if (!navUserBtn.contains(e.target) && !userDropdown.contains(e.target)) userDropdown.classList.add('hidden'); } });

    document.getElementById('dropdownProfile')?.addEventListener('click', () => { if (currentUser) renderProfile(currentUser.username); userDropdown.classList.add('hidden'); });
    document.getElementById('dropdownClan')?.addEventListener('click', () => { if (currentUser) showClanPage(); userDropdown.classList.add('hidden'); });
    document.getElementById('dropdownSubmit')?.addEventListener('click', () => { if (currentUser) showSubmitPage(); userDropdown.classList.add('hidden'); });
    document.getElementById('dropdownSettings')?.addEventListener('click', () => { showSettingsPage(); userDropdown.classList.add('hidden'); });
    document.getElementById('dropdownModPanel')?.addEventListener('click', () => { if (currentUser && typeof showModPanel === 'function') showModPanel(); userDropdown.classList.add('hidden'); });
    document.getElementById('dropdownLogout')?.addEventListener('click', () => { handleLogout(); userDropdown.classList.add('hidden'); });
}

initAuth();