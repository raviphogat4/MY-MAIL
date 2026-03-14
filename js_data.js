/**
 * AXIOM MAIL — Data Controller
 * Manages mail database, contacts, drafts, and file uploads
 */

const DataController = {
    activeTab: 'inbox',
    tempAttach: null,
    currentDraftId: null,

    G_URL: "https://script.google.com/macros/s/AKfycbzL4tx51elWjvcY0MG5LBTUM0NfTAMZKq4kZ2p2SML4wqW0Aw-WOlogfM1Fow6vk7Zcdw/exec",

    // ─── Core DB helpers ─────────────────────────────────────

    getDB()       { return JSON.parse(localStorage.getItem('mailDB'))      || []; },
    saveDB(db)    { localStorage.setItem('mailDB', JSON.stringify(db)); },
    getUsers()    { return JSON.parse(localStorage.getItem('mailUsers'))   || { admin: 'admin' }; },
    getContacts() { return JSON.parse(localStorage.getItem('userContacts')) || {}; },
    saveContacts(c){ localStorage.setItem('userContacts', JSON.stringify(c)); },

    currentUser() { return sessionStorage.getItem('loggedUser'); },

    sync() {
        UIController.renderMail();
        UIController.renderContacts();
        UIController.updateStats();
    },

    // ─── File Upload ──────────────────────────────────────────

    async handleFileUpload() {
        const file = document.getElementById('fileInput').files[0];
        const status = document.getElementById('upStatus');
        if (!file) return;

        status.style.color = 'var(--text-muted)';
        status.textContent = '🔒 Encrypting…';

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = reader.result.split(',')[1];
            try {
                const res = await fetch(this.G_URL, {
                    method: 'POST',
                    redirect: 'follow',
                    body: JSON.stringify({ base64: base64Data, type: file.type, name: file.name })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    this.tempAttach = { name: result.name, url: result.url };
                    status.style.color = 'var(--success)';
                    status.textContent = '📎 ' + result.name;
                } else {
                    status.style.color = 'var(--danger)';
                    status.textContent = 'Upload failed';
                }
            } catch (e) {
                status.style.color = 'var(--danger)';
                status.textContent = 'Upload failed';
            }
        };
    },

    // ─── Send Message ─────────────────────────────────────────

    sendMessage() {
        const to      = document.getElementById('to').value.toLowerCase().trim();
        const cc      = document.getElementById('cc').value.toLowerCase().trim();
        const subject = document.getElementById('subject').value.trim();
        const body    = document.getElementById('body').value.trim();

        if (!to) return UIController.toast('Recipient required.', 'error');

        const db = this.getDB();

        // Remove this draft if it's a reply/forward (ID stored)
        if (this.currentDraftId) {
            const idx = db.findIndex(m => m.id === this.currentDraftId && m.draft);
            if (idx !== -1) db.splice(idx, 1);
        }

        const msg = {
            id:      Date.now(),
            from:    this.currentUser(),
            to:      to,
            cc:      cc || null,
            sub:     subject || '(No Subject)',
            body:    body,
            vault:   this.tempAttach,
            starred: false,
            trash:   false,
            draft:   false,
            ts:      Date.now()
        };

        db.push(msg);
        this.saveDB(db);
        UIController.toggleCompose(false);
        UIController.toast('Message sent.', 'success');
        this.sync();
    },

    // ─── Save Draft ───────────────────────────────────────────

    saveDraft() {
        const to      = document.getElementById('to').value.toLowerCase().trim();
        const subject = document.getElementById('subject').value.trim();
        const body    = document.getElementById('body').value;

        const db = this.getDB();
        const id = this.currentDraftId || Date.now();

        // Remove old draft entry if editing existing
        const filtered = db.filter(m => !(m.id === this.currentDraftId && m.draft));

        filtered.push({
            id, from: this.currentUser(), to, sub: subject || '(Draft)',
            body, vault: this.tempAttach,
            starred: false, trash: false, draft: true, ts: Date.now()
        });

        this.saveDB(filtered);
        UIController.toggleCompose(false);
        UIController.toast('Draft saved.', 'success');
        this.sync();
    },

    // ─── Delete / Trash ───────────────────────────────────────

    deleteMail(id) {
        const db = this.getDB();
        const m  = db.find(x => x.id === id);
        if (!m) return;

        if (m.trash) {
            if (!confirm('Permanently erase this message?')) return;
            this.saveDB(db.filter(x => x.id !== id));
        } else {
            m.trash = true;
            this.saveDB(db);
        }
        this.sync();
    },

    // ─── Star ─────────────────────────────────────────────────

    toggleStar(id) {
        const db  = this.getDB();
        const idx = db.findIndex(m => m.id === Number(id));
        if (idx !== -1) {
            db[idx].starred = !db[idx].starred;
            this.saveDB(db);
            UIController.renderMail();
        }
    },

    // ─── Reply / Forward ──────────────────────────────────────

    prepareReply(m) {
        UIController.toggleCompose(true);
        document.getElementById('to').value      = m.from;
        document.getElementById('subject').value = 'Re: ' + m.sub;
        document.getElementById('body').value    =
            `\n\n────────────────────────────\nOn ${new Date(m.ts || m.id).toLocaleString()}, ${m.from} wrote:\n\n${m.body}`;
        document.getElementById('composeTitle').textContent = 'Reply';
    },

    prepareForward(m) {
        UIController.toggleCompose(true);
        document.getElementById('subject').value = 'Fwd: ' + m.sub;
        document.getElementById('body').value    =
            `\n\n────────────────────────────\nForwarded message\nFrom: ${m.from}\nTo: ${m.to}\n\n${m.body}`;
        document.getElementById('composeTitle').textContent = 'Forward';
    },

    // ─── Contacts ─────────────────────────────────────────────

    addContact() {
        const target = prompt('Enter username to verify and add:');
        if (!target) return;
        const t = target.trim().toLowerCase();
        if (!t) return;

        const registry = this.getUsers();
        if (!registry.hasOwnProperty(t)) {
            return UIController.toast(`"${t}" is not registered in the system.`, 'error');
        }

        const user = this.currentUser();
        const all  = this.getContacts();
        if (!all[user]) all[user] = [];

        if (all[user].includes(t)) {
            return UIController.toast('Already in your contacts.', 'error');
        }
        if (t === user) {
            return UIController.toast("Can't add yourself.", 'error');
        }

        all[user].push(t);
        this.saveContacts(all);
        UIController.toast(`${t} added to contacts.`, 'success');
        this.sync();
    },

    removeContact(target) {
        const user = this.currentUser();
        const all  = this.getContacts();
        if (all[user]) {
            all[user] = all[user].filter(c => c !== target);
            this.saveContacts(all);
            this.sync();
        }
    }
};
