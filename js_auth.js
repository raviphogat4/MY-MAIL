/**
 * AXIOM MAIL — Auth Controller
 * Manages login, session, and app initialization
 */

const AuthController = {
    login() {
        const u = document.getElementById('username').value.trim().toLowerCase();
        const p = document.getElementById('password').value.trim();
        if (!u || !p) return UIController.toast('Enter username and passphrase.', 'error');

        // Validate existing user OR register new
        let users = JSON.parse(localStorage.getItem('mailUsers')) || { admin: 'admin' };

        if (users[u] && users[u] !== p) {
            return UIController.toast('Incorrect passphrase.', 'error');
        }

        if (!users[u]) {
            users[u] = p;
            localStorage.setItem('mailUsers', JSON.stringify(users));
            UIController.toast('New account created. Welcome!', 'success');
        }

        sessionStorage.setItem('loggedUser', u);
        this.initApp();
    },

    initApp() {
        const user = sessionStorage.getItem('loggedUser');
        if (!user) return;

        document.getElementById('authWrapper').style.display = 'none';
        document.getElementById('mailApp').style.display = 'grid';
        document.getElementById('userLabel').textContent = user;
        document.getElementById('userAvatar').textContent = user.charAt(0).toUpperCase();

        if (user === 'admin') AdminController.injectTab();

        DataController.sync();
    },

    logout() {
        sessionStorage.clear();
        location.reload();
    }
};

// Auto-init on page load
window.onload = () => {
    // Allow Enter key on login form
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.getElementById('authWrapper').style.display !== 'none') {
            AuthController.login();
        }
    });

    if (sessionStorage.getItem('loggedUser')) {
        AuthController.initApp();
    }
};
