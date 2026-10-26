// --- CHANGELOG RENDER LOGIC ---

function parseDate(dateStr) {
    // Expects DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function getRelativeDateLabel(dateStr) {
    const entryDate = parseDate(dateStr);
    if (!entryDate) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - entryDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else {
        return dateStr;
    }
}

function renderChangelog() {
    const container = document.getElementById('changelogContainer');
    const lastUpdated = document.getElementById('changelogLastUpdated');
    
    // Debugging
    if (!container) {
        console.warn("renderChangelog: 'changelogContainer' not found.");
        return;
    }
    if (typeof changelogData === 'undefined') {
        console.error("renderChangelog: 'changelogData' is undefined.");
        container.innerHTML = '<div class="text-red-500 text-xs">Error: Data missing</div>';
        return;
    }

    if (lastUpdated && changelogData.length > 0) {
        lastUpdated.textContent = `Last updated: ${getRelativeDateLabel(changelogData[0].date)}`;
    }

    container.innerHTML = changelogData.map((entry, index) => {
        const displayDate = getRelativeDateLabel(entry.date);
        
        // Check if title exists and is not empty string
        const titleHtml = (entry.title && entry.title.trim() !== "") 
            ? `<h3 class="text-white font-bold text-sm mb-2">${entry.title}</h3>` 
            : '';

        return `
        <div class="border-l-2 border-dark-600 pl-4 relative pb-6 last:pb-0">
            <div class="text-xs text-gray-500 font-mono mb-1">${displayDate}</div>
            ${titleHtml}
            <ul class="list-disc list-inside text-xs text-gray-400 space-y-1">
                ${entry.changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
        </div>
    `}).join('');
}