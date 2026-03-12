<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyMail Pro | Cloud Storage Edition</title>
    <style>
        :root { 
            --primary: #0b57d0; 
            --gmail-bg: #f6f8fc; 
            --sidebar-text: #444;
            --main-bg: #ffffff;
            --border-color: #dddddd;
            --item-hover: #f8f9fa;
            --text-main: #202124;
            --admin-red: #d93025; 
            --sidebar-active: #d3e3fd; 
            --star: #f4b400; 
        }

        body.dark-mode {
            --gmail-bg: #1a1c1e;
            --main-bg: #2d2f31;
            --sidebar-text: #e2e2e2;
            --border-color: #444746;
            --item-hover: #3c3f41;
            --text-main: #e2e2e2;
            --sidebar-active: #004a77;
        }

        body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; background: var(--gmail-bg); overflow: hidden; height: 100vh; color: var(--text-main); transition: 0.2s; }

        /* AUTHENTICATION - FULLY CENTERED */
        #authWrapper { 
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            display: flex; justify-content: center; align-items: center; 
            background: var(--gmail-bg); z-index: 2000;
        }
        .auth-card { 
            background: var(--main-bg); padding: 40px; border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 350px; text-align: center; 
        }

        /* HEADER */
        .app-header { display: flex; align-items: center; padding: 0 20px; background: var(--gmail-bg); border-bottom: 1px solid var(--border-color); height: 60px; }
        .menu-btn { font-size: 24px; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .menu-btn:hover { background: var(--border-color); }
        .app-logo { font-size: 1.4rem; font-weight: bold; color: var(--primary); margin-left: 15px; }

        /* LAYOUT */
        #mailApp { display: none; height: calc(100vh - 60px); grid-template-columns: 0px 1fr 260px; transition: 0.3s; }
        #mailApp.sidebar-open { grid-template-columns: 260px 1fr 260px; }

        /* SIDEBARS */
        .sidebar { padding: 15px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: var(--gmail-bg); overflow: hidden; }
        .nav-item { padding: 12px 18px; cursor: pointer; border-radius: 20px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; color: var(--sidebar-text); }
        .nav-item:hover { background: var(--item-hover); }
        .nav-item.active { background: var(--sidebar-active); font-weight: bold; }

        /* MAIN CONTENT */
        .main-view { background: var(--main-bg); margin: 15px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; position: relative; border: 1px solid var(--border-color); }
        .list-container { height: 100%; overflow-y: auto; }
        .email-item { display: flex; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--border-color); cursor: pointer; font-size: 0.9rem; }

        /* ADMIN SECTION - BALANCED */
        .admin-section { padding: 25px; overflow-y: auto; height: 100%; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-top: 10px; }
        .admin-table th, .admin-table td { border: 1px solid var(--border-color); padding: 10px; text-align: left; }

        /* BUTTONS */
        .btn-mid { padding: 8px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border-radius: 6px; border: 1px solid var(--border-color); background: var(--main-bg); color: var(--text-main); }
        .compose-btn { padding: 15px 25px; border-radius: 16px; border: none; background: #c2e7ff; color: #001d35; cursor: pointer; margin-bottom: 20px; font-weight: bold; width: 100%; }
    </style>
</head>
<body class="light-mode">

    <div id="authWrapper">
        <div class="auth-card">
            <h1 style="color: var(--primary);">MyMail</h1>
            <p style="color:#777; font-size:0.85rem; margin-bottom:20px;">Private Communication Network</p>
            <input type="text" id="username" placeholder="Username" style="width:100%; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
            <input type="password" id="password" placeholder="Password" style="width:100%; padding:12px; margin-bottom:20px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box;">
            <button onclick="handleAuth()" style="width:100%; padding:12px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Sign In</button>
        </div>
    </div>

    <div id="headerUI" style="display:none;" class="app-header">
        <div class="menu-btn" onclick="toggleSidebar()">☰</div>
        <div class="app-logo">MyMail</div>
    </div>

    <div id="mailApp">
        <div class="sidebar">
            <button class="compose-btn" onclick="toggleCompose(true)">+ Compose</button>
            <div id="sidebar-nav">
                <div class="nav-item active" onclick="switchTab('inbox', this)"><span>📥 Inbox</span></div>
                <div class="nav-item" onclick="switchTab('starred', this)"><span>⭐ Starred</span></div>
                <div class="nav-item" onclick="switchTab('sent', this)"><span>📤 Sent</span></div>
                <div class="nav-item" onclick="switchTab('trash', this)"><span>🗑️ Trash</span></div>
            </div>
            <div style="margin-top:auto;">
                <div onclick="toggleTheme()" style="padding:10px; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; gap:8px;">
                    <span id="themeIcon">🌙</span> <span id="themeText">Dark Mode</span>
                </div>
                <div style="font-size:0.8rem; border-top:1px solid var(--border-color); padding:15px 0; margin-top:10px;">
                    <b id="userLabel"></b> | <a href="#" onclick="logout()" style="color:var(--admin-red); text-decoration:none;">Logout</a>
                </div>
            </div>
        </div>

        <div class="main-view">
            <div class="list-container" id="contentArea"></div>
            <div id="viewMessageOverlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:var(--main-bg); padding:30px; box-sizing:border-box; z-index:100;">
                <button onclick="closeMessage()" class="btn-mid">← Back</button>
                <h2 id="msgSubject" style="margin-top:20px;"></h2>
                <div id="msgMeta" style="color:#777; font-size:0.85rem; border-bottom:1px solid var(--border-color); padding-bottom:10px;"></div>
                <div id="msgBody" style="margin-top:20px; line-height:1.6; white-space:pre-wrap;"></div>
            </div>
        </div>

        <div class="sidebar" style="border-left:1px solid var(--border-color); background:var(--main-bg);">
            <div style="font-weight:bold; color:#777; font-size:0.75rem; margin-bottom:15px;">CONTACTS</div>
            <div id="contactList" style="flex-grow:1;"></div>
            <button onclick="addContact()" style="width:100%; padding:8px; border:1px dashed #bbb; background:transparent; color:var(--text-main); border-radius:8px; cursor:pointer;">+ Add User</button>
        </div>
    </div>

    <div id="composeModal" style="display:none; position:fixed; bottom:0; right:20px; width:450px; background:var(--main-bg); border:1px solid var(--border-color); border-radius:10px 10px 0 0; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:1000;">
        <div style="padding:10px; background:var(--sidebar-active); font-weight:bold; display:flex; justify-content:space-between;">New Message <span onclick="toggleCompose(false)" style="cursor:pointer">×</span></div>
        <div style="padding:15px; display:flex; flex-direction:column; gap:10px;">
            <input type="text" id="toField" placeholder="To" style="border:none; border-bottom:1px solid var(--border-color); background:transparent; padding:8px; color:var(--text-main);">
            <input type="text" id="subjectField" placeholder="Subject" style="border:none; border-bottom:1px solid var(--border-color); background:transparent; padding:8px; color:var(--text-main);">
            <textarea id="bodyField" rows="8" style="border:none; background:transparent; padding:8px; color:var(--text-main); resize:none;"></textarea>
            
            <div style="display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                <input type="file" id="fileInput" style="display: none;" onchange="uploadToDrive()">
                <button type="button" onclick="document.getElementById('fileInput').click()" class="btn-mid" id="uploadBtn">📎 Attach File</button>
                <span id="uploadStatus" style="font-size: 0.75rem; color: var(--primary);"></span>
            </div>

            <button onclick="sendEmail()" style="background:var(--primary); color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold;">Send</button>
        </div>
    </div>

    <script>
        // YOUR VALIDATED GOOGLE SCRIPT URL
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuh_uFirw6MuAniJEyMTygxegAr9lnt6GNLOeQ7uY-iZgSesN7Be9PDKVxB0I10Zc9CA/exec";

        let currentTab = 'inbox';
        const SUPER_USER = 'admin';

        async function uploadToDrive() {
            const fileBtn = document.getElementById('uploadBtn');
            const status = document.getElementById('uploadStatus');
            const file = document.getElementById('fileInput').files[0];
            if (!file) return;

            fileBtn.disabled = true;
            status.innerText = "☁️ Uploading...";

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async function () {
                const base64 = reader.result.split(',')[1];
                const data = { base64: base64, mimetype: file.type, filename: file.name };

                try {
                    const response = await fetch(GOOGLE_SCRIPT_URL, { 
                        method: 'POST', 
                        body: JSON.stringify(data),
                        mode: 'cors' 
                    });
                    const result = await response.json();
                    if (result.url) {
                        document.getElementById('bodyField').value += `\n\n📎 Attachment: ${result.name}\n${result.url}\n`;
                        status.innerText = "✅ Attached!";
                    } else {
                        status.innerText = "❌ Error in Script";
                    }
                } catch (e) { 
                    status.innerText = "❌ Blocked/Failed"; 
                    console.error("Upload Error:", e);
                }
                fileBtn.disabled = false;
            };
        }

        // --- CORE APP LOGIC ---
        function toggleSidebar() { document.getElementById('mailApp').classList.toggle('sidebar-open'); }
        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-mode');
            document.getElementById('themeIcon').innerText = isDark ? "☀️" : "🌙";
            document.getElementById('themeText').innerText = isDark ? "Light Mode" : "Dark Mode";
            localStorage.setItem('mailTheme', isDark ? 'dark' : 'light');
        }
        if(localStorage.getItem('mailTheme') === 'dark') toggleTheme();

        function handleAuth() {
            const u = document.getElementById('username').value.trim().toLowerCase();
            const p = document.getElementById('password').value.trim();
            if(!u || !p) return;
            let users = JSON.parse(localStorage.getItem('mailUsers')) || {};
            if(!users[u]) users[u] = p;
            if(users[u] === p) {
                sessionStorage.setItem('loggedUser', u);
                localStorage.setItem('mailUsers', JSON.stringify(users));
                initApp();
            } else alert("Invalid Password");
        }

        function initApp() {
            document.getElementById('authWrapper').style.display = 'none';
            document.getElementById('headerUI').style.display = 'flex';
            document.getElementById('mailApp').style.display = 'grid';
            document.getElementById('mailApp').classList.add('sidebar-open');
            document.getElementById('userLabel').innerText = sessionStorage.getItem('loggedUser');
            
            if(sessionStorage.getItem('loggedUser') === SUPER_USER) {
                const nav = document.getElementById('sidebar-nav');
                if(!document.querySelector('.admin-only-item')) {
                    const adminBtn = document.createElement('div');
                    adminBtn.className = "nav-item";
                    adminBtn.style.border = "1.5px dashed var(--admin-red)";
                    adminBtn.style.color = "var(--admin-red)";
                    adminBtn.innerHTML = "<span>⚙️ SYSTEM ADMIN</span>";
                    adminBtn.onclick = function() { switchTab('admin', this); };
                    nav.appendChild(adminBtn);
                }
            }
            renderView(); renderContacts();
        }

        function renderView() {
            const area = document.getElementById('contentArea');
            const user = sessionStorage.getItem('loggedUser');
            let emails = JSON.parse(localStorage.getItem('mailDB')) || [];
            document.getElementById('viewMessageOverlay').style.display = 'none';

            if(currentTab === 'admin' && user === SUPER_USER) {
                renderAdminPanel(area); return;
            }

            const filtered = emails.filter(m => {
                if(currentTab === 'trash') return m.trash && (m.to === user || m.from === user);
                if(currentTab === 'starred') return m.starred && !m.trash && (m.to === user || m.from === user);
                if(currentTab === 'sent') return m.from === user && !m.trash;
                return m.to === user && !m.trash;
            });

            area.innerHTML = filtered.map(m => `
                <div class="email-item" onclick="openMessage(${m.id})">
                    <span style="margin-right:15px; color:${m.starred ? 'var(--star)' : '#777'}" onclick="event.stopPropagation(); toggleStar(${m.id})">★</span>
                    <div style="width:120px; font-weight:bold;">${currentTab === 'sent' ? 'To: '+m.to : m.from}</div>
                    <div style="flex-grow:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><b>${m.sub}</b> - ${m.body.substring(0,40)}...</div>
                    <span onclick="event.stopPropagation(); deleteMail(${m.id})" style="color:#ccc;">🗑️</span>
                </div>`).join('') || '<div style="padding:30px; text-align:center;">Empty Folder</div>';
        }

        function renderAdminPanel(area) {
            const users = JSON.parse(localStorage.getItem('mailUsers')) || {};
            area.innerHTML = `
                <div class="admin-section">
                    <h2 style="color:var(--admin-red)">System Admin</h2>
                    <button class="btn-mid" onclick="localStorage.setItem('mailDB', '[]'); renderView();">Wipe All Mail Traffic</button>
                    <table class="admin-table">
                        <tr><th>Username</th><th>Password</th><th>Status</th></tr>
                        ${Object.entries(users).map(([u, p]) => `<tr><td>${u}</td><td><code>${p}</code></td><td style="color:green">Active</td></tr>`).join('')}
                    </table>
                </div>`;
        }

        function openMessage(id) {
            const m = (JSON.parse(localStorage.getItem('mailDB')) || []).find(e => e.id === id);
            if(!m) return;
            document.getElementById('msgSubject').innerText = m.sub;
            document.getElementById('msgMeta').innerText = `From: ${m.from} | To: ${m.to}`;
            document.getElementById('msgBody').innerText = m.body;
            document.getElementById('viewMessageOverlay').style.display = 'block';
        }
        function closeMessage() { document.getElementById('viewMessageOverlay').style.display = 'none'; }
        function toggleCompose(s) { document.getElementById('composeModal').style.display = s?'block':'none'; document.getElementById('uploadStatus').innerText=''; }
        
        function sendEmail() {
            const to = document.getElementById('toField').value.trim().toLowerCase();
            let emails = JSON.parse(localStorage.getItem('mailDB')) || [];
            emails.push({ id: Date.now(), from: sessionStorage.getItem('loggedUser'), to, sub: document.getElementById('subjectField').value || "(No Subject)", body: document.getElementById('bodyField').value, trash: false, starred: false });
            localStorage.setItem('mailDB', JSON.stringify(emails));
            toggleCompose(false); renderView();
        }

        function deleteMail(id) {
            let e = JSON.parse(localStorage.getItem('mailDB'));
            let m = e.find(x => x.id === id);
            if(m.trash) e = e.filter(x => x.id !== id); else m.trash = true;
            localStorage.setItem('mailDB', JSON.stringify(e)); renderView();
        }

        function toggleStar(id) {
            let e = JSON.parse(localStorage.getItem('mailDB'));
            let m = e.find(x => x.id === id);
            if(m) m.starred = !m.starred;
            localStorage.setItem('mailDB', JSON.stringify(e)); renderView();
        }

        function addContact() {
            const t = prompt("Username:"); if(!t) return;
            const users = JSON.parse(localStorage.getItem('mailUsers')) || {};
            if(!users[t]) return alert("Not found");
            const me = sessionStorage.getItem('loggedUser');
            let c = JSON.parse(localStorage.getItem('mailContacts')) || {};
            if(!c[me]) c[me] = []; if(!c[me].includes(t)) c[me].push(t);
            localStorage.setItem('mailContacts', JSON.stringify(c)); renderContacts();
        }

        function renderContacts() {
            const u = sessionStorage.getItem('loggedUser');
            let c = JSON.parse(localStorage.getItem('mailContacts')) || {};
            document.getElementById('contactList').innerHTML = (c[u] || []).map(x => `
                <div class="nav-item">
                    <span onclick="document.getElementById('toField').value='${x}';toggleCompose(true)">👤 ${x}</span>
                    <span onclick="removeContact('${x}')">×</span>
                </div>`).join('');
        }

        function removeContact(n) {
            const u = sessionStorage.getItem('loggedUser');
            let c = JSON.parse(localStorage.getItem('mailContacts'));
            c[u] = c[u].filter(x => x !== n);
            localStorage.setItem('mailContacts', JSON.stringify(c)); renderContacts();
        }

        function switchTab(t, e) { currentTab = t; document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active')); e.classList.add('active'); renderView(); }
        function logout() { sessionStorage.clear(); location.reload(); }
        if(sessionStorage.getItem('loggedUser')) initApp();
    </script>
</body>
</html>
