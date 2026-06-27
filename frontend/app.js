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
        const transactions = await fetch(`${API}/transactions`, { headers: authHeaders }).then(r => r.json());
        const container = document.getElementById('transactions-list');
        if (transactions.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:30px">No transactions yet</p>';
            return;
        }
        container.innerHTML = transactions.map(t => {
            const isOverdue = t.status === 'OVERDUE';
            const fine = isOverdue ? t.fineAmount : 0;
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
        }).join('');
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

async function returnMedia() {
    const id = document.getElementById('r-txn-id').value;
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
    const transactions = document.getElementById('transactions-list').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Library Ledger — Transaction Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
                h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                .txn-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
                .txn-card h3 { font-size: 15px; margin-bottom: 6px; }
                .txn-card p  { font-size: 13px; color: #475569; margin: 3px 0; }
                .status-borrowed { background: #ede9fe; color: #4f46e5; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
                .status-returned { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
                .status-overdue  { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
                .btn-warning { display: none; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h1>📚 Library Ledger — Transaction Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <hr>
            ${transactions}
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

        container.innerHTML = members.map(m => {
            const memberTxns    = transactions.filter(t => t.memberId === m.id);
            const borrowed      = memberTxns.filter(t => t.status === 'BORROWED').length;
            const returned      = memberTxns.filter(t => t.status === 'RETURNED').length;
            const overdue       = memberTxns.filter(t => t.status === 'OVERDUE').length;
            const totalFines    = memberTxns.reduce((sum, t) => sum + (t.fineAmount || 0), 0);
            const unpaidFines   = memberTxns.filter(t => t.fineAmount > 0 && !t.finePaid)
                                            .reduce((sum, t) => sum + (t.fineAmount || 0), 0);

            return `
            <div style="background:white;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0">
                        ${m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="font-size:15px;font-weight:700">${m.name}</h3>
                        <p style="font-size:12px;color:#64748b">${m.email}</p>
                    </div>
                    <span style="margin-left:auto;font-size:11px;padding:3px 8px;border-radius:20px;font-weight:600;background:${m.active ? '#dcfce7' : '#fee2e2'};color:${m.active ? '#15803d' : '#dc2626'}">
                        ${m.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
                    <div style="background:#ede9fe;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#4f46e5">${borrowed}</div>
                        <div style="font-size:11px;color:#64748b">Borrowed</div>
                    </div>
                    <div style="background:#dcfce7;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#15803d">${returned}</div>
                        <div style="font-size:11px;color:#64748b">Returned</div>
                    </div>
                    <div style="background:#fee2e2;border-radius:10px;padding:10px;text-align:center">
                        <div style="font-size:20px;font-weight:700;color:#dc2626">${overdue}</div>
                        <div style="font-size:11px;color:#64748b">Overdue</div>
                    </div>
                </div>
                ${totalFines > 0 ? `
                <div style="background:#fef3c7;border-radius:10px;padding:10px;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:13px;color:#b45309">💰 Total Fines: <strong>₹${totalFines.toFixed(2)}</strong></span>
                    <span style="font-size:13px;color:#dc2626">Unpaid: <strong>₹${unpaidFines.toFixed(2)}</strong></span>
                </div>` : ''}
            </div>`;
        }).join('');
    } catch (e) {
        showToast('Could not load activity report', 'error');
    }
}
// ── Init ──────────────────────────────────────────────────


if (page === 'activity') loadMemberActivity();
loadDashboard();

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}