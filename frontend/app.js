// Auth check
// Auth check
const token = localStorage.getItem('token');
const role  = localStorage.getItem('role');
if (!token || role !== 'ADMIN') window.location.href = 'login.html';

const API = 'http://localhost:8082/api';
let allMedia = [];
let allMembers = [];
let mediaChart = null;

// Auth headers for all requests
const authHeaders = {
    'Content-Type':  'application/json',
    'Authorization': 'Bearer ' + token
};
const API = 'http://localhost:8082/api';
let allMedia = [];
let allMembers = [];
let mediaChart = null;

// ── Page Navigation ───────────────────────────────────────
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-btn')[['dashboard','media','members','transactions'].indexOf(page)].classList.add('active');
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
            headers: authHeaders,
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
            loadMedia();
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
                <button class="btn-danger" onclick="deleteMember(${m.id})">🗑️ Delete</button>
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

async function deleteMember(id) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
        const res = await fetch(`${API}/members/${id}`, { method: 'DELETE', headers: authHeaders });
        const msg = await res.text();
        if (res.ok) {
            showToast('✅ ' + msg);
            loadMembers();
            loadDashboard();
        } else {
            showToast('❌ ' + msg, 'error');
        }
    } catch (e) {
        showToast('❌ Could not delete member', 'error');
    }
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
                    <p>⏰ Due: ${t.dueDate}</p>
                    <p>🆔 TXN ID: <strong>${t.id}</strong></p>
                </div>
            `).join('');
        }
        document.getElementById('view-borrows-modal').classList.remove('hidden');
    } catch (e) {
        showToast('Could not load borrows', 'error');
    }
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
        container.innerHTML = transactions.map(t => `
            <div class="txn-card ${t.status.toLowerCase()}">
                <h3>📖 ${t.mediaTitle || 'Media #' + t.mediaId}</h3>
                <p>👤 ${t.memberName || 'Member #' + t.memberId}</p>
                <p>📅 Borrowed: ${new Date(t.borrowDate).toLocaleDateString()}</p>
                <p>⏰ Due: ${t.dueDate}</p>
                ${t.returnDate ? `<p>✅ Returned: ${new Date(t.returnDate).toLocaleDateString()}</p>` : ''}
                <p>🆔 TXN ID: <strong>${t.id}</strong></p>
                <span class="txn-status status-${t.status.toLowerCase()}">${t.status}</span>
            </div>
        `).join('');
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
        const res = await fetch(`${API}/transactions/overdue`, { method: 'PUT', headers: authHeaders });
        const msg = await res.text();
        showToast('✅ ' + msg);
        loadTransactions();
        loadDashboard();
    } catch (e) {
        showToast('❌ Could not mark overdue', 'error');
    }
}

// ── Init ──────────────────────────────────────────────────
loadDashboard();