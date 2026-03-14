/**
 * AXIOM MAIL — UI Controller
 * Handles all rendering, navigation, and user interactions
 */

const UIController = {

    // ─── Navigation ──────────────────────────────────────────

    switchTab(tab, el) {
        DataController.activeTab = tab;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');

        const titles = {
            inbox: 'Inbox', starred: 'Starred', sent: 'Sent',
            drafts: 'Drafts', trash: 'Trash', admin: 'Admin Console'
        };
        document.getElementById('folderTitle').textContent = titles[tab] || tab;
        this.renderMail();
    },

    // ─── Render Mail List ─────────────────────────────────────

    renderMail(searchQuery = '') {
        const user = DataController.currentUser();
        const db   = DataController.getDB();
        const tab  = DataController.activeTab;
        const list = document.getElementById('mailList');

        document.getElementById('viewOverlay').style.display = 'none';

        if (tab === 'admin' && user === 'admin') {
            AdminController.render(db);
            return;
        }

        const filtered = db.filter(m => {
            const matchesTab = (() => {
                if (tab === 'trash')   return m.trash && (m.to === user || m.from === user);
                if (m.trash) return false;
                if (tab === 'drafts')  return m.draft && m.from === user;
                if (m.draft) return false;
                if (tab === 'starred') return m.starred && (m.to === user || m.from === user);
                if (tab === 'sent')    return m.from === user;
                return m.to === user; // inbox
            })();

            if (!matchesTab) return false;
            if (!searchQuery) return true;

            const q = searchQuery.toLowerCase();
            return (m.sub  || '').toLowerCase().includes(q)
                || (m.from || '').toLowerCase().includes(q)
                || (m.to   || '').toLowerCase().includes(q)
                || (m.body || '').toLowerCase().includes(q);
        }).reverse();

        // Update inbox badge
        const inboxCount = db.filter(m => m.to === user && !m.trash && !m.draft).length;
        const badge = document.getElementById('inboxBadge');
        if (inboxCount > 0 && tab !== 'inbox') {
            badge.style.display = 'inline';
            badge.textContent = inboxCount;
        } else {
            badge.style.display = 'none';
        }

        document.getElementById('mailCount').textContent =
            filtered.length + (filtered.length === 1 ? ' message' : ' messages');

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
                    </svg>
                    <h3>${searchQuery ? 'No results found' : 'Nothing here'}</h3>
                    <p>${searchQuery ? 'Try a different search term' : 'This folder is empty'}</p>
                </div>`;
            return;
        }

        list.innerHTML = filtered.map((m, i) => {
            const sender  = tab === 'sent' ? m.to : m.from;
            const initial = sender ? sender.charAt(0).toUpperCase() : '?';
            const time    = this.formatTime(m.ts || m.id);
            const preview = (m.body || '').replace(/\n/g, ' ').substring(0, 80);

            return `
            <div class="email-item" style="animation-delay:${i * 0.03}s"
                 onclick="UIController.openMessage(${m.id})">
                <div class="email-avatar">${initial}</div>
                <div class="email-content">
                    <div class="email-row-top">
                        <span class="email-sender">${sender || '—'}</span>
                        <span class="email-time">${time}</span>
                    </div>
                    <div class="email-subject">
                        ${m.draft ? '<span style="color:var(--warning); font-size:10px; font-family:var(--font-mono); margin-right:6px;">DRAFT</span>' : ''}
                        ${this.escapeHtml(m.sub)}
                    </div>
                    <div class="email-preview">${this.escapeHtml(preview)}</div>
                </div>
                ${m.vault ? '<span class="attach-chip">📎 file</span>' : ''}
                <div class="email-actions">
                    <button class="star-btn ${m.starred ? 'starred' : ''}"
                        onclick="event.stopPropagation(); DataController.toggleStar(${m.id})"
                        title="${m.starred ? 'Unstar' : 'Star'}">★</button>
                    <button class="trash-btn"
                        onclick="event.stopPropagation(); DataController.deleteMail(${m.id})"
                        title="${m.trash ? 'Delete permanently' : 'Move to trash'}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
                        </svg>
                    </button>
                </div>
            </div>`;
        }).join('');
    },

    // ─── Open Message ─────────────────────────────────────────

    openMessage(id) {
        const db = DataController.getDB();
        const m  = db.find(x => x.id === id);
        if (!m) return;

        // If it's a draft, open compose
        if (m.draft) {
            DataController.currentDraftId = m.id;
            this.toggleCompose(true);
            document.getElementById('to').value      = m.to || '';
            document.getElementById('subject').value = m.sub || '';
            document.getElementById('body').value    = m.body || '';
            document.getElementById('composeTitle').textContent = 'Edit Draft';
            return;
        }

        const overlay = document.getElementById('viewOverlay');
        overlay.style.display = 'flex';

        const sender  = m.from;
        const initial = sender ? sender.charAt(0).toUpperCase() : '?';

        document.getElementById('msgSub').textContent  = m.sub;
        document.getElementById('msgFrom').textContent = 'From: ' + m.from;
        document.getElementById('msgTo').textContent   = 'To: ' + m.to + (m.cc ? `  CC: ${m.cc}` : '');
        document.getElementById('msgTime').textContent = this.formatTime(m.ts || m.id, true);
        document.getElementById('msgAvatar').textContent = initial;
        document.getElementById('msgBody').textContent = m.body;

        // Vault attachment
        const vault = document.getElementById('vaultArea');
        vault.innerHTML = '';
        if (m.vault) {
            const btn = document.createElement('button');
            btn.className = 'vault-btn';
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Open Secure File: ${m.vault.name}`;
            btn.onclick = () => window.open(m.vault.url, '_blank');
            vault.appendChild(btn);
        }

        // Action bar
        const actions = document.getElementById('viewActions');
        actions.innerHTML = `
            <button class="btn-icon-text" onclick="DataController.prepareReply(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
                Reply
            </button>
            <button class="btn-icon-text" onclick="DataController.prepareForward(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>
                Forward
            </button>`;
    },

    closeMessage() {
        document.getElementById('viewOverlay').style.display = 'none';
    },

    // ─── Contacts ─────────────────────────────────────────────

    renderContacts() {
        const user = DataController.currentUser();
        const all  = DataController.getContacts();
        const mine = all[user] || [];
        const el   = document.getElementById('contactsList');

        if (mine.length === 0) {
            el.innerHTML = `<div class="contacts-empty">No contacts yet.<br>Click + to add users.</div>`;
            return;
        }

        el.innerHTML = mine.map(c => `
            <div class="contact-item" onclick="UIController.quickCompose('${c}')">
                <div class="contact-avatar">${c.charAt(0).toUpperCase()}</div>
                <span class="contact-name">${c}</span>
                <button class="contact-remove" 
                    onclick="event.stopPropagation(); DataController.removeContact('${c}')"
                    title="Remove">×</button>
            </div>`).join('');
    },

    // ─── Compose ─────────────────────────────────────────────

    toggleCompose(show) {
        const modal = document.getElementById('composeModal');
        if (show) {
            modal.style.display = 'flex';
            setTimeout(() => document.getElementById('to').focus(), 50);
        } else {
            modal.style.display = 'none';
            document.getElementById('to').value          = '';
            document.getElementById('cc').value          = '';
            document.getElementById('subject').value     = '';
            document.getElementById('body').value        = '';
            document.getElementById('upStatus').textContent = '';
            document.getElementById('composeTitle').textContent = 'New Message';
            DataController.tempAttach    = null;
            DataController.currentDraftId = null;
        }
    },

    quickCompose(target) {
        this.toggleCompose(true);
        document.getElementById('to').value = target;
        document.getElementById('subject').focus();
    },

    // ─── Search ──────────────────────────────────────────────

    handleSearch(query) {
        this.renderMail(query);
    },

    // ─── Stats ───────────────────────────────────────────────

    updateStats() {
        const db    = DataController.getDB();
        const total = 500;
        const count = db.length;
        const pct   = Math.min((count / total) * 100, 100).toFixed(1);

        document.getElementById('storageBar').style.width = pct + '%';
        document.getElementById('storageNums').textContent = `${count} / ${total} msgs`;
    },

    // ─── Toast Notifications ─────────────────────────────────

    toast(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        const div = document.createElement('div');
        div.className = `toast ${type}`;

        const icons = { success: '✓', error: '✕', info: '·' };
        div.innerHTML = `<span>${icons[type] || '·'}</span> ${msg}`;
        container.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    },

    // ─── Helpers ─────────────────────────────────────────────

    formatTime(ts, full = false) {
        const d    = new Date(ts);
        const now  = new Date();
        const diff = now - d;

        if (full) return d.toLocaleString();
        if (diff < 60000)       return 'just now';
        if (diff < 3600000)     return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000)    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000)   return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
