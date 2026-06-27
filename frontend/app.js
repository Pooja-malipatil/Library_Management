const token = localStorage.getItem('token');
const role  = localStorage.getItem('role');
if (!token || role !== 'ADMIN') window.location.href = 'login.html';

const API = 'http://localhost:8082/api';
let allMedia = [];
let allMembers = [];
let mediaChart = null;

const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
};
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-btn')[['dashboard','media','members','transactions','activity'].indexOf(page)].classList.add('active');
    if (page === 'dashboard')    loadDashboard();
    if (page === 'media')        loadMedia();
    if (page === 'members')      loadMembers();
    if (page === 'transactions') loadTransactions();
    if (page === 'activity')     loadMemberActivity();
}

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ── Modals ────────────────────────────────────────────────
function showAddMediaForm()  { document.getElementById('add-media-form').classList.remove('hidden'); }
function showAddMemberForm() { document.getElementById('add-member-form').classList.remove('hidden'); }
function showBorrowForm()    { document.getElementById('borrow-form').classList.remove('hidden'); }
function showReturnForm()    { document.getElementById('return-form').classList.remove('hidden'); }
function hideModal(id)       { document.getElementById(id).classList.add('hidden'); }

// ── Dashboard ─────────────────────────────────────────────
async function loadDashboard() {
    try {
        const [media, members, transactions] = await Promise.all([
    fetch(`${API}/media`,        { headers: authHeaders }).then(r => r.json()),
    fetch(`${API}/members`,      { headers: authHeaders }).then(r => r.json()),
    fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json())
]);

        document.getElementById('total-media').textContent   = media.length;
        document.getElementById('total-members').textContent = members.length;
        document.getElementById('total-borrowed').textContent = transactions.filter(t => t.status === 'BORROWED').length;
        document.getElementById('total-overdue').textContent  = transactions.filter(t => t.status === 'OVERDUE').length;

        renderChart(media);
    } catch (e) {
        showToast('Could not load dashboard', 'error');
    }
}

function renderChart(media) {
    const counts = { BOOK: 0, DVD: 0, MAGAZINE: 0, AUDIOBOOK: 0, OTHER: 0 };
    media.forEach(m => { if (counts[m.mediaType] !== undefined) counts[m.mediaType]++; });

    const ctx = document.getElementById('mediaChart').getContext('2d');
    if (mediaChart) mediaChart.destroy();

    mediaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['📖 Books', '📀 DVDs', '📰 Magazines', '🎧 Audiobooks', '📦 Other'],
            datasets: [{
                label: 'Count',
                data: Object.values(counts),
                backgroundColor: ['#ede9fe','#fce7f3','#dcfce7','#fef3c7','#f1f5f9'],
                borderColor:     ['#4f46e5','#be185d','#15803d','#b45309','#475569'],
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ── Media ─────────────────────────────────────────────────
async function loadMedia() {
    try {
        const res = await fetch(`${API}/media`, { headers: authHeaders });
        if (res.status === 403 || res.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => { localStorage.clear(); window.location.href = 'login.html'; }, 2000);
            return;
        }
        allMedia = await res.json();
        renderMedia(allMedia);
    } catch (e) {
        showToast('Could not load media', 'error');
    }
}

function renderMedia(list) {
    const container = document.getElementById('media-list');
    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">No media found</p>';
        return;
    }
    container.innerHTML = list.map(m => {
        const pct  = (m.available / m.totalCopies) * 100;
        const cls  = pct > 60 ? 'high' : pct > 30 ? 'medium' : 'low';
        return `
        <div class="media-card">
            <div class="media-card-header">
                <h3>${m.title}</h3>
                <div class="card-actions">
                    <span class="badge badge-${m.mediaType.toLowerCase()}">${m.mediaType}</span>
                    <button class="icon-btn" onclick="showEditMediaForm(${m.id})" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="deleteMedia(${m.id})" title="Delete">🗑️</button>
                </div>
            </div>
            <p>👤 ${m.creator}</p>
            <p>🎭 ${m.genre || 'N/A'} &nbsp;|&nbsp; 📅 ${m.releaseYear}</p>
            <span class="media-id-badge">ID: ${m.id}</span>
            <div class="availability">
                <div class="avail-bar">
                    <div class="avail-fill ${cls}" style="width:${pct}%"></div>
                </div>
                <span class="avail-text">${m.available}/${m.totalCopies} available</span>
            </div>
        </div>`;
    }).join('');
}

function searchMedia() {
    const keyword = document.getElementById('media-search').value.toLowerCase();
    renderMedia(allMedia.filter(m =>
        m.title.toLowerCase().includes(keyword) ||
        m.creator.toLowerCase().includes(keyword)
    ));
}

function filterMedia(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMedia(type === 'ALL' ? allMedia : allMedia.filter(m => m.mediaType === type));
}

async function addMedia() {
    const body = {
        title:       document.getElementById('m-title').value,
        creator:     document.getElementById('m-creator').value,
        mediaType:   document.getElementById('m-type').value,
        genre:       document.getElementById('m-genre').value,
        releaseYear: parseInt(document.getElementById('m-year').value),
        totalCopies: parseInt(document.getElementById('m-copies').value)
    };
    try {
        const res = await fetch(`${API}/media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            hideModal('add-media-form');
            document.getElementById('m-title').value   = '';
            document.getElementById('m-creator').value = '';
            document.getElementById('m-genre').value   = '';
            document.getElementById('m-year').value    = '';
            document.getElementById('m-copies').value  = '';
            await loadMedia();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not add media', 'error');
    }
}

function showEditMediaForm(id) {
    const m = allMedia.find(m => m.id === id);
    if (!m) return;
    document.getElementById('e-id').value      = m.id;
    document.getElementById('e-title').value   = m.title;
    document.getElementById('e-creator').value = m.creator;
    document.getElementById('e-type').value    = m.mediaType;
    document.getElementById('e-genre').value   = m.genre || '';
    document.getElementById('e-year').value    = m.releaseYear;
    document.getElementById('e-copies').value  = m.totalCopies;
    document.getElementById('edit-media-form').classList.remove('hidden');
}

async function updateMedia() {
    const body = {
        title:       document.getElementById('e-title').value,
        creator:     document.getElementById('e-creator').value,
        mediaType:   document.getElementById('e-type').value,
        genre:       document.getElementById('e-genre').value,
        releaseYear: parseInt(document.getElementById('e-year').value),
        totalCopies: parseInt(document.getElementById('e-copies').value)
    };
    const id = document.getElementById('e-id').value;
    try {
        const res = await fetch(`${API}/media/${id}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(body)
        });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            hideModal('edit-media-form');
            loadMedia();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not update media', 'error');
    }
}

async function deleteMedia(id) {
    if (!confirm('Are you sure you want to delete this media?')) return;
    try {
        const res = await fetch(`${API}/media/${id}`, { method: 'DELETE', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            loadMedia();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not delete media', 'error');
    }
}

// ── Members ───────────────────────────────────────────────
async function loadMembers() {
    try {
        allMembers = await fetch(`${API}/members`, { headers: authHeaders }).then(r => r.json());
        renderMembers(allMembers);
    } catch (e) {
        showToast('Could not load members', 'error');
    }
}

function renderMembers(list) {
    const container = document.getElementById('members-list');
    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">No members found</p>';
        return;
    }
    container.innerHTML = list.map(m => `
        <div class="member-card">
            <div class="member-avatar">${m.name.charAt(0).toUpperCase()}</div>
            <div class="member-info">
                <h3>${m.name}</h3>
                <p>📧 ${m.email}</p>
                <p>📞 ${m.phone}</p>
                <span class="member-id-badge">ID: ${m.id}</span>
            </div>
            <div class="member-actions">
                <span class="member-status ${m.active ? 'status-active' : 'status-inactive'}">
                    ${m.active ? 'Active' : 'Inactive'}
                </span>
                <button class="btn-info" onclick="viewMemberBorrows(${m.id}, '${m.name}')">📋 Borrows</button>
                ${m.active 
                    ? `<button class="btn-danger" onclick="deactivateMember(${m.id})">🔴 Deactivate</button>`
                    : `<button class="btn-info" onclick="reactivateMember(${m.id})">🟢 Activate</button>`
                }
            </div>
        </div>
    `).join('');
}

async function searchMembers() {
    const keyword = document.getElementById('member-search').value;
    if (keyword.trim() === '') {
        renderMembers(allMembers);
        return;
    }
    try {
        const list = await fetch(`${API}/members/search?keyword=${keyword}`, { headers: authHeaders }).then(r => r.json());
        renderMembers(list);
    } catch (e) {
        showToast('Could not search members', 'error');
    }
}

async function addMember() {
    const body = {
        name:  document.getElementById('mb-name').value,
        email: document.getElementById('mb-email').value,
        phone: document.getElementById('mb-phone').value
    };
    try {
        const res = await fetch(`${API}/members`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(body)
        });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            hideModal('add-member-form');
            document.getElementById('mb-name').value  = '';
            document.getElementById('mb-email').value = '';
            document.getElementById('mb-phone').value = '';
            loadMembers();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not add member', 'error');
    }
}

async function deactivateMember(id) {
    if (!confirm('Deactivate this member?')) return;
    try {
        const res = await fetch(`${API}/members/${id}`, { method: 'DELETE', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) { showToast('✅ ' + msg); loadMembers(); }
        else showToast('❌ ' + msg, 'error');
    } catch (e) { showToast('❌ Could not deactivate', 'error'); }
}

async function reactivateMember(id) {
    try {
        const res = await fetch(`${API}/members/${id}/activate`, { method: 'PUT', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) { showToast('✅ ' + msg); loadMembers(); }
        else showToast('❌ ' + msg, 'error');
    } catch (e) { showToast('❌ Could not activate', 'error'); }
}

async function viewMemberBorrows(id, name) {
    try {
        const list = await fetch(`${API}/transactions/member/${id}`, { headers: authHeaders }).then(r => r.json());
        const container = document.getElementById('member-borrows-list');
        document.querySelector('#view-borrows-modal .modal-header h3').textContent = `📋 ${name}'s Borrows`;
        if (list.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">No active borrows</p>';
        } else {
            container.innerHTML = list.map(t => `
                <div class="borrow-item">
                    <h4>📖 ${t.mediaTitle || 'Media #' + t.mediaId}</h4>
                    <p>📅 Borrowed: ${new Date(t.borrowDate).toLocaleDateString()}</p>
                    <p>⏰ Due: ${new Date(t.dueDate).toLocaleDateString()}</p>
                    <p>🆔 TXN ID: <strong>${t.id}</strong></p>
                </div>
            `).join('');
        }
        document.getElementById('view-borrows-modal').classList.remove('hidden');
    } catch (e) {
        showToast('Could not load borrows', 'error');
    }
}

async function payFine(id) {
    try {
        const res = await fetch(`${API}/transactions/fine/${id}/pay`, { method: 'PUT', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) { showToast('✅ ' + msg); loadTransactions(); }
        else showToast('❌ ' + msg, 'error');
    } catch (e) { showToast('❌ Could not update fine', 'error'); }
}

// ── Transactions ──────────────────────────────────────────
async function loadTransactions() {
    try {
        // Auto mark overdue first
        await fetch(`${API}/transactions/overdue`, { method: 'PUT', headers: authHeaders });

        const transactions = await fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json());
        const container = document.getElementById('transactions-list');

        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">No transactions yet</p>';
            return;
        }

        const borrowed  = transactions.filter(t => t.status === 'BORROWED');
        const overdue   = transactions.filter(t => t.status === 'OVERDUE');
        const returned  = transactions.filter(t => t.status === 'RETURNED');

        function txnCard(t) {
            const fine = t.fineAmount || 0;
            return `
            <div class="txn-card ${t.status.toLowerCase()}">
                <h3>📖 ${t.mediaTitle || 'Media #' + t.mediaId}</h3>
                <p>👤 ${t.memberName || 'Member #' + t.memberId}</p>
                <p>📅 Borrowed: ${new Date(t.borrowDate).toLocaleDateString()}</p>
                <p>⏰ Due: ${new Date(t.dueDate).toLocaleDateString()}</p>
                ${t.returnDate ? `<p>✅ Returned: ${new Date(t.returnDate).toLocaleDateString()}</p>` : ''}
                ${fine > 0 ? `<p>💰 Fine: <strong style="color:#dc2626">₹${fine.toFixed(2)}</strong> ${t.finePaid ? '✅ Paid' : '❌ Unpaid'}</p>` : ''}
                <p>🆔 TXN ID: <strong>${t.id}</strong></p>
                <span class="txn-status status-${t.status.toLowerCase()}">${t.status}</span>
                ${fine > 0 && !t.finePaid ? `<button onclick="payFine(${t.id})" class="btn-warning" style="margin-top:8px;font-size:12px;padding:6px 12px">💰 Mark Fine Paid</button>` : ''}
            </div>`;
        }

        container.innerHTML = `
            <!-- Borrowed Section -->
            <div style="margin-bottom:20px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                    <span style="background:#ede9fe;color:#4f46e5;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
                        📤 Currently Borrowed (${borrowed.length})
                    </span>
                </div>
                ${borrowed.length === 0
                    ? '<p style="text-align:center;color:#94a3b8;padding:16px;background:white;border-radius:12px">No active borrows</p>'
                    : borrowed.map(t => txnCard(t)).join('')}
            </div>

            <!-- Overdue Section -->
            <div style="margin-bottom:20px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                    <span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
                        ⚠️ Overdue (${overdue.length})
                    </span>
                </div>
                ${overdue.length === 0
                    ? '<p style="text-align:center;color:#94a3b8;padding:16px;background:white;border-radius:12px">No overdue items</p>'
                    : overdue.map(t => txnCard(t)).join('')}
            </div>

            <!-- Returned Section -->
            <div style="margin-bottom:20px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                    <span style="background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
                        ✅ Returned (${returned.length})
                    </span>
                </div>
                ${returned.length === 0
                    ? '<p style="text-align:center;color:#94a3b8;padding:16px;background:white;border-radius:12px">No returned items yet</p>'
                    : returned.map(t => txnCard(t)).join('')}
            </div>
        `;
    } catch (e) {
        showToast('Could not load transactions', 'error');
    }
}

async function borrowMedia() {
    const body = {
        memberId: parseInt(document.getElementById('b-member-id').value),
        mediaId:  parseInt(document.getElementById('b-media-id').value),
        days:     parseInt(document.getElementById('b-days').value)
    };
    try {
        const res = await fetch(`${API}/transactions/borrow`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(body)
        });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            hideModal('borrow-form');
            loadTransactions();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not borrow', 'error');
    }
}

async function returnMedia(id) {
    try {
        const res = await fetch(`${API}/transactions/return/${id}`, { method: 'PUT', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            hideModal('return-form');
            loadTransactions();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not return', 'error');
    }
}

async function markOverdue() {
    try {
        
        const msg = await res.text();
        showToast('✅ ' + msg);
        loadTransactions();
        loadDashboard();
    } catch (e) {
        showToast('❌ Could not mark overdue', 'error');
    }
}
// ── PDF Export ────────────────────────────────────────────
function exportPDF() {
    const transactions = document.getElementById('transactions-list').querySelectorAll('.txn-card');
    let rows = '';
    transactions.forEach(t => {
        rows += `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
            ${t.innerHTML.replace(/<button[^>]*>.*?<\/button>/gs, '')}
        </div>`;
    });

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Library Ledger — Transaction Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto; }
                h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                h3 { font-size: 15px; margin-bottom: 6px; }
                p  { font-size: 13px; color: #475569; margin: 3px 0; }
                .txn-status { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .status-borrowed { background: #ede9fe; color: #4f46e5; }
                .status-returned { background: #dcfce7; color: #15803d; }
                .status-overdue  { background: #fee2e2; color: #dc2626; }
                @media print { button { display: none !important; } }
            </style>
        </head>
        <body>
            <h1>📚 Library Ledger — Full Transaction Report</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Transactions:</strong> ${transactions.length}</p>
            <hr style="margin:16px 0">
            ${rows}
            <script>window.onload = () => window.print();<\/script>
        </body>
        </html>
    `);
    win.document.close();
}

// ── Member Activity Report ────────────────────────────────
async function loadMemberActivity() {
    try {
        const [members, transactions] = await Promise.all([
            fetch(`${API}/members`, { headers: authHeaders }).then(r => r.json()),
            fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json())
        ]);

        const container = document.getElementById('member-activity');
        if (!container) return;

        if (members.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">No members found</p>';
            return;
        }

        container.innerHTML = members.map(m => {
            const memberTxns  = transactions.filter(t => t.memberId === m.id);
            const borrowed    = memberTxns.filter(t => t.status === 'BORROWED');
            const returned    = memberTxns.filter(t => t.status === 'RETURNED');
            const overdue     = memberTxns.filter(t => t.status === 'OVERDUE');
            const totalFines  = memberTxns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
            const unpaidFines = memberTxns.filter(t => t.fineAmount > 0 && !t.finePaid)
                                          .reduce((sum, t) => sum + (t.fineAmount || 0), 0);

            const txnListHTML = memberTxns.length === 0 ? '<p style="color:#94a3b8;font-size:13px;padding:8px 0">No transactions</p>' :
                memberTxns.map(t => `
                    <div style="background:#f8fafc;border-radius:8px;padding:10px;margin-bottom:6px;border-left:3px solid ${
                        t.status === 'BORROWED' ? '#4f46e5' : t.status === 'RETURNED' ? '#16a34a' : '#dc2626'
                    }">
                        <p style="font-size:13px;font-weight:600;margin-bottom:4px">📖 ${t.mediaTitle || 'Media #' + t.mediaId}</p>
                        <p style="font-size:11px;color:#64748b">📅 Borrowed: ${new Date(t.borrowDate).toLocaleDateString()}</p>
                        <p style="font-size:11px;color:#64748b">⏰ Due: ${new Date(t.dueDate).toLocaleDateString()}</p>
                        ${t.returnDate ? `<p style="font-size:11px;color:#16a34a">✅ Returned: ${new Date(t.returnDate).toLocaleDateString()}</p>` : ''}
                        ${t.fineAmount > 0 ? `<p style="font-size:11px;color:#dc2626">💰 Fine: ₹${t.fineAmount.toFixed(2)} ${t.finePaid ? '✅ Paid' : '❌ Unpaid'}</p>` : ''}
                        <span style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;background:${
                            t.status === 'BORROWED' ? '#ede9fe' : t.status === 'RETURNED' ? '#dcfce7' : '#fee2e2'
                        };color:${
                            t.status === 'BORROWED' ? '#4f46e5' : t.status === 'RETURNED' ? '#15803d' : '#dc2626'
                        }">${t.status}</span>
                    </div>
                `).join('');

            return `
            <div style="background:white;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <!-- Member Header -->
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">
                        ${m.name.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex:1">
                        <h3 style="font-size:15px;font-weight:700">${m.name}</h3>
                        <p style="font-size:12px;color:#64748b">${m.email} | ${m.phone}</p>
                    </div>
                    <span style="font-size:11px;padding:3px 8px;border-radius:20px;font-weight:600;background:${m.active ? '#dcfce7' : '#fee2e2'};color:${m.active ? '#15803d' : '#dc2626'}">
                        ${m.active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <!-- Stats -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
                    <div style="background:#ede9fe;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#4f46e5">${borrowed.length}</div>
                        <div style="font-size:11px;color:#64748b">Borrowed</div>
                    </div>
                    <div style="background:#dcfce7;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#15803d">${returned.length}</div>
                        <div style="font-size:11px;color:#64748b">Returned</div>
                    </div>
                    <div style="background:#fee2e2;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#dc2626">${overdue.length}</div>
                        <div style="font-size:11px;color:#64748b">Overdue</div>
                    </div>
                </div>

                <!-- Fines -->
                ${totalFines > 0 ? `
                <div style="background:#fef3c7;border-radius:10px;padding:10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <span style="font-size:13px;color:#b45309">💰 Total: <strong>₹${totalFines.toFixed(2)}</strong></span>
                    <span style="font-size:13px;color:#dc2626">Unpaid: <strong>₹${unpaidFines.toFixed(2)}</strong></span>
                </div>` : ''}

                <!-- Transaction List -->
                <div style="margin-bottom:10px">
                    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:8px">📋 Transaction History (${memberTxns.length})</p>
                    ${txnListHTML}
                </div>

                <!-- PDF Button -->
                <button onclick="exportMemberPDF(${m.id}, '${m.name.replace(/'/g, "\\'")}')" 
                    style="width:100%;padding:10px;background:#f0f4ff;color:#4f46e5;border:1.5px solid #c4b5fd;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">
                    🖨️ Export ${m.name}'s Report as PDF
                </button>
            </div>`;
        }).join('');
    } catch (e) {
        console.error(e);
        showToast('Could not load activity report', 'error');
    }
}
// ── Init ──────────────────────────────────────────────────

async function exportMemberPDF(memberId, memberName) {
    try {
        const [member, transactions] = await Promise.all([
            fetch(`${API}/members/${memberId}`, { headers: authHeaders }).then(r => r.json()),
            fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json())
        ]);

        const memberTxns  = transactions.filter(t => t.memberId === memberId);
        const borrowed    = memberTxns.filter(t => t.status === 'BORROWED').length;
        const returned    = memberTxns.filter(t => t.status === 'RETURNED').length;
        const overdue     = memberTxns.filter(t => t.status === 'OVERDUE').length;
        const totalFines  = memberTxns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);

        const txnRows = memberTxns.map(t => `
            <tr>
                <td>${t.id}</td>
                <td>${t.mediaTitle || 'Media #' + t.mediaId}</td>
                <td>${new Date(t.borrowDate).toLocaleDateString()}</td>
                <td>${new Date(t.dueDate).toLocaleDateString()}</td>
                <td>${t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-'}</td>
                <td><span style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${
                    t.status === 'BORROWED' ? '#ede9fe' : t.status === 'RETURNED' ? '#dcfce7' : '#fee2e2'
                };color:${
                    t.status === 'BORROWED' ? '#4f46e5' : t.status === 'RETURNED' ? '#15803d' : '#dc2626'
                }">${t.status}</span></td>
                <td>${t.fineAmount > 0 ? '₹' + t.fineAmount.toFixed(2) : '-'}</td>
                <td>${t.fineAmount > 0 ? (t.finePaid ? '✅ Paid' : '❌ Unpaid') : '-'}</td>
            </tr>
        `).join('');

        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>Member Report — ${memberName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
                    h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                    h2 { color: #475569; font-size: 16px; margin-top: 20px; }
                    .stats { display: flex; gap: 16px; margin: 16px 0; }
                    .stat { background: #f8fafc; border-radius: 8px; padding: 12px 20px; text-align: center; flex: 1; }
                    .stat h3 { font-size: 24px; font-weight: 700; margin: 0; }
                    .stat p  { font-size: 12px; color: #64748b; margin: 4px 0 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
                    th { background: #4f46e5; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background: #f8fafc; }
                    .fine-box { background: #fef3c7; border-radius: 8px; padding: 12px; margin-top: 16px; }
                    @media print { button { display: none !important; } }
                </style>
            </head>
            <body>
                <h1>📚 Member Activity Report</h1>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

                <h2>👤 Member Information</h2>
                <p><strong>Name:</strong> ${member.name}</p>
                <p><strong>Email:</strong> ${member.email}</p>
                <p><strong>Phone:</strong> ${member.phone}</p>
                <p><strong>Status:</strong> ${member.active ? '✅ Active' : '❌ Inactive'}</p>

                <h2>📊 Summary</h2>
                <div class="stats">
                    <div class="stat"><h3 style="color:#4f46e5">${borrowed}</h3><p>Currently Borrowed</p></div>
                    <div class="stat"><h3 style="color:#15803d">${returned}</h3><p>Returned</p></div>
                    <div class="stat"><h3 style="color:#dc2626">${overdue}</h3><p>Overdue</p></div>
                    <div class="stat"><h3 style="color:#b45309">${memberTxns.length}</h3><p>Total Transactions</p></div>
                </div>

                ${totalFines > 0 ? `
                <div class="fine-box">
                    <strong>💰 Total Fines: ₹${totalFines.toFixed(2)}</strong>
                </div>` : ''}

                <h2>📋 Transaction History</h2>
                <table>
                    <thead>
                        <tr>
                            <th>TXN ID</th>
                            <th>Media</th>
                            <th>Borrowed</th>
                            <th>Due Date</th>
                            <th>Returned</th>
                            <th>Status</th>
                            <th>Fine</th>
                            <th>Fine Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txnRows.length > 0 ? txnRows : '<tr><td colspan="8" style="text-align:center;color:#94a3b8">No transactions</td></tr>'}
                    </tbody>
                </table>
                <script>window.onload = () => window.print();<\/script>
            </body>
            </html>
        `);
        win.document.close();
    } catch (e) {
        showToast('Could not generate PDF', 'error');
    }
}

async function showReturnForm() {
    try {
        // Auto mark overdue first
        await fetch(`${API}/transactions/overdue`, { method: 'PUT', headers: authHeaders });

        const transactions = await fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json());
        const activeBorrows = transactions.filter(t => t.status === 'BORROWED' || t.status === 'OVERDUE');

        const container = document.getElementById('return-items-list');

        if (activeBorrows.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">No active borrows to return</p>';
        } else {
            container.innerHTML = activeBorrows.map(t => `
                <div style="background:#f8fafc;border-radius:12px;padding:12px;border-left:4px solid ${t.status === 'OVERDUE' ? '#dc2626' : '#4f46e5'}">
                    <p style="font-size:14px;font-weight:700;margin-bottom:4px">📖 ${t.mediaTitle || 'Media #' + t.mediaId}</p>
                    <p style="font-size:12px;color:#64748b">👤 ${t.memberName || 'Member #' + t.memberId}</p>
                    <p style="font-size:12px;color:#64748b">⏰ Due: ${new Date(t.dueDate).toLocaleDateString()}</p>
                    <p style="font-size:12px;color:#64748b">🆔 TXN ID: ${t.id}</p>
                    ${t.status === 'OVERDUE' ? `<span style="background:#fee2e2;color:#dc2626;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600">⚠️ OVERDUE</span>` : ''}
                    <button onclick="returnMedia(${t.id})"
                        style="margin-top:8px;width:100%;padding:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                        📥 Return This
                    </button>
                </div>
            `).join('');
        }

        document.getElementById('return-form').classList.remove('hidden');
    } catch (e) {
        showToast('Could not load borrows', 'error');
    }
}



loadDashboard();

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}