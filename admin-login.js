const adminSessionKey = 'bastoAdminAuthenticated';
const adminUsername = 'bastostore';
const adminPassword = 'BASTO146$$$';
const loginForm = document.querySelector('#admin-login-form');
const usernameInput = document.querySelector('#admin-username');
const passwordInput = document.querySelector('#admin-password');
const loginError = document.querySelector('#login-error');

if (sessionStorage.getItem(adminSessionKey) === 'true') window.location.replace('admin.html');

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (usernameInput.value.trim() !== adminUsername || passwordInput.value !== adminPassword) {
        loginError.textContent = 'Incorrect username or password.';
        passwordInput.select();
        return;
    }
    sessionStorage.setItem(adminSessionKey, 'true');
    window.location.replace('admin.html');
});
