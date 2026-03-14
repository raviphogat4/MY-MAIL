/**
 * AXIOM MAIL — Admin Controller
 * Master console for admin user only
 */

const AdminController = {
    subTab: 'traffic',

    injectTab() {
        if (document.querySelector('[data-tab="admin"]')) return;
        const nav = document.getElementById('sidebar-nav');

        const sep = document.createElement('div');
        sep.style.cssText = 'margin: 8px 18px; border-top: 1px solid rgba(248,113,113,0.2);';
        nav.appendChild(sep);

        const div = document.createElement('div');
        div.className = 'nav-item';
        div.setAttribute('data-tab', 'admin');
        div.setAttribute('data-admin', '1');
        div.style.color = 'var(--danger)';
        div.innerHTML = `
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41"/>
            </svg>
            <span>Master Admin</span>`;
        div.onclick = () => UIController.switchTab('admin', div);
        nav.appendChild(div);
    },

    render(db) {
        const users = DataController.getUsers();
        const sub   = this.subTab;

        let html = `<div class="admin-panel">
            <div class="admin-title">⚡ Master Admin Console</div>
            <div class="admin-subtitle">AXIOM MAIL — SYSTEM CONTROL INTERFACE</div>

            <div class="admin-tabs">
                <button class="admin-tab ${sub === 'traffic' ? 'active' : ''}"
                    onclick="AdminController.subTab='traffic'; UIController.renderMail()">
                    TRAFFIC LOG
                </button>
                <button class="admin-tab ${sub === 'users' ? 'active' : ''}"
                    onclick="AdminController.subTab='users'; UIController.renderMail()">
                    USER REGISTRY
                </button>
                <button class="admin-tab ${sub === 'stats' ? 'active' : ''}"
                    onclick="AdminController.subTab='stats'; UIController.renderMail()">
                    SYSTEM STATS
                </button>
            </div>`;

        if (sub === 'traffic') {
            html += `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>FROM</th><th>TO</th><th>SUBJECT</th>
                        <th>STATUS</th><th>TIME</th><th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${db.length === 0
                        ? `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">No messages in system</td></tr>`
                        : db.map(m => `
                    <tr>
                        <td>${m.from || '—'}</td>
                        <td>${m.to || '—'}</td>
                        <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${UIController.escapeHtml(m.sub)}</td>
                        <td class="${m.trash ? 'status-deleted' : 'status-active'}">${m.draft ? 'DRAFT' : m.trash ? 'DELETED' : 'ACTIVE'}</td>
                        <td>${UIController.formatTime(m.ts || m.id)}</td>
                        <td><button class="btn-kill" onclick="AdminController.killMail(${m.id})">PURGE</button></td>
                    </tr>`).join('')}
                </tbody>
            </table>`;

        } else if (sub === 'users') {
            html += `
            <table class="admin-table">
                <thead>
                    <tr><th>USERNAME</th><th>CREDENTIAL</th><th>ROLE</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(users).map(([u, p]) => `
                    <tr>
                        <td style="font-weight:600; color:var(--text-primary);">${u}</td>
                        <td><code>${p}</code></td>
                        <td style="color:${u === 'admin' ? 'var(--danger)' : 'var(--text-muted)'}">
                            ${u === 'admin' ? 'ADMIN' : 'USER'}
                        </td>
                        <td>
                            ${u !== 'admin'
                                ? `<button class="btn-kill" onclick="AdminController.killUser('${u}')">BANISH</button>`
                                : '<span style="color:var(--text-muted); font-size:10px;">PROTECTED</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;

        } else {
            // Stats
            const totalMsgs  = db.length;
            const activeMsgs = db.filter(m => !m.trash && !m.draft).length;
            const totalUsers = Object.keys(users).length;
            const starredCount = db.filter(m => m.starred).length;
            const trashCount   = db.filter(m => m.trash).length;

            html += `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-top:8px;">
                ${[
                    ['TOTAL MESSAGES', totalMsgs,  'var(--accent)'],
                    ['ACTIVE MESSAGES', activeMsgs, 'var(--success)'],
                    ['REGISTERED USERS', totalUsers, 'var(--accent-2)'],
                    ['STARRED MESSAGES', starredCount, 'var(--warning)'],
                    ['IN TRASH', trashCount, 'var(--danger)'],
                    ['STORAGE USED', ((totalMsgs / 500) * 100).toFixed(1) + '%', 'var(--text-secondary)'],
                ].map(([label, val, color]) => `
                    <div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); padding:20px;">
                        <div style="font-family:var(--font-mono); font-size:9px; letter-spacing:2px; color:var(--text-muted); margin-bottom:8px;">${label}</div>
                        <div style="font-family:var(--font-display); font-size:28px; font-weight:800; color:${color};">${val}</div>
                    </div>`).join('')}
            </div>`;
        }

        document.getElementById('mailList').innerHTML = html + `</div>`;
    },

    killMail(id) {
        if (!confirm('Permanently purge this message from the system?')) return;
        const db = DataController.getDB().filter(m => m.id !== id);
        DataController.saveDB(db);
        UIController.toast('Message purged.', 'success');
        UIController.renderMail();
    },

    killUser(u) {
        if (u === 'admin') return;
        if (!confirm(`Banish user "${u}" from the system? This cannot be undone.`)) return;
        const users = DataController.getUsers();
        delete users[u];
        localStorage.setItem('mailUsers', JSON.stringify(users));
        UIController.toast(`User "${u}" banished.`, 'success');
        UIController.renderMail();
    }
};
