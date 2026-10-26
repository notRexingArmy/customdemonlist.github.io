// --- WEBSITE CHANGELOG DATA ---
const webChangelogData = [
    {
        date: "dd/mm/yyyy",
        title: "Initial Launch",
        changes: [
            "Launched of the Private Demonlist Website.",
        ]
    },
];

// --- RENDER LOGIC ---
function renderWebChangelog() {
    const container = document.getElementById('webChangelogContainer');
    if (!container) return;

    if (webChangelogData.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">No updates yet.</div>';
        return;
    }

    container.innerHTML = webChangelogData.map(entry => {
        return `
        <div class="border-l-2 border-accent-blue pl-4 relative pb-6 last:pb-0">
            <div class="text-xs text-gray-400 font-mono mb-1">${entry.date}</div>
            ${entry.title ? `<h3 class="text-white font-bold text-sm mb-2">${entry.title}</h3>` : ''}
            <ul class="list-disc list-inside text-xs text-gray-300 space-y-1">
                ${entry.changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
        </div>
    `}).join('');
}
window.renderWebChangelog = renderWebChangelog;