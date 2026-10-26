async function loadSections() {
    const appContainer = document.getElementById('app-container');
    const sections = ['home', 'list', 'roulette', 'extras'];
    
    // 1. Load HTML Content
    try {
        const promises = sections.map(sec => fetch(`sections/${sec}.html`).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.text();
        }));
        const contents = await Promise.all(promises);
        
        contents.forEach(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            while (tempDiv.firstChild) {
                appContainer.appendChild(tempDiv.firstChild);
            }
        });
        
        console.log("HTML Sections Loaded.");
    } catch (e) {
        console.error("Failed to load sections:", e);
        appContainer.innerHTML = `<div class="p-8 text-center text-red-500">Failed to load content segments. Ensure you are using Live Server.</div>`;
        return;
    }

    // 2. Load Logic Scripts
    const scripts = [
        'js/cdm_changelogcore.js', 
        'js/cdm_core.js',
        'js/cdm_mod.js',
        'js/cdm_submit.js', 
        'js/cdm_web_changelog.js',
        'js/cdm_packs_logic.js', // Logic only. Data loaded in index.html
        'js/cdm_ui.js',
        'js/cdm_list.js',
        'js/cdm_social.js',
        'js/cdm_auth.js',
        'js/cdm_seed.js', // NEW: Seed Logic
        'js/cdm_roulette.js'
    ];

    for (const src of scripts) {
        try {
            await loadScript(src);
        } catch (err) {
            console.error(`Failed to load script: ${src}`, err);
        }
    }
    
    console.log("All Scripts Loaded.");
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load error: ${src}`));
        document.body.appendChild(script);
    });
}

// Check if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSections);
} else {
    loadSections();
}